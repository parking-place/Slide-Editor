# HPE VME Editor 코드 분석 문서

이 문서는 `HPE_VME_Editor.html` 단일 파일로 구성된 "HPE VME 가이드 제작 도구" 애플리케이션의 아키텍처, 데이터 구조 및 핵심 기능들을 분석하고 정리한 문서입니다. 향후 수정 작업이나 유지 보수를 진행할 때 참고 지침으로 사용됩니다.

## 1. 개요 (Overview)
- **앱 성격**: 단일 페이지 웹 애플리케이션(SPA) 에디터
- **목적**: HPE Virtual Machine Essentials (VME) 설치 및 구성 가이드를 작성, 저장하고, 이를 다양한 형식(PPTX, 배포용 HTML)으로 변환하여 내보냅니다.
- **주요 스택**: HTML5, Vanilla JavaScript, CSS3
- **주요 특징**: 별도의 백엔드 데이터베이스 없이 프론트엔드의 메모리(JS 배열)에서 데이터를 관리하고 JSON 파일 형식으로 로컬과 상호작용합니다.

---

## 2. 디렉토리 구조 및 역할 (Directory Structure)
v0.5.2 버전을 기점으로 유지보수 및 파일 성격에 따라 폴더가 분리되었습니다.
- **`/` (Root)**: 메인 애플리케이션 `HPE_VME_Editor.html` 및 초기 실행 배치 스크립트(`.bat`) 위치
- **`/src`**: 에디터 프론트엔드를 구성하는 `style.css`, `app.js` 모듈화 파일 (소스 3 모듈 분리로 HTML 코드 선 축소)
- **`/data`**: 로컬 시스템의 데이터 영속성을 위한 JSON 저장소 (초기화 및 스냅샷 보관용)
  - **`/data/themes`**: `.slidetheme` 형식의 커스텀 테마 파일 저장 디렉토리
- **`/docs`**: 프로젝트 기록(버전노트, 기능분석) 마크다운 백서 
- **`/scripts`**: 포트 스캐닝 및 HTML/JSON 렌더링 내보내기를 담당하는 로컬 Poweshell 서버 스크립트와 정규식 파이썬 패치 코드 보관
- **`/exports`**: 사용자가 브라우저에서 '웹 가이드'를 추출할 때 떨어지는 최종 배포 HTML 산출물 저장 경로
- **`/plans`**: 기능 기획 및 개발 예정 목록 문서 (배포에 포함되지 않는 내부 문서)

---

## 3. 주요 라이브러리 및 의존성
| 라이브러리/에셋 | 버전/출처 | 목적 |
| :--- | :--- | :--- |
| **PptxGenJS** | 3.12.0 (CDN) | 브라우저 단에서 순수 JavaScript로 PPTX 확장자 파일을 생성하고 다운로드하기 위해 사용합니다. |
| **Marked.js** | CDN | 사용자가 입력한 Markdown 텍스트를 웹 프리뷰용 HTML 텍스트로 변환 시 사용합니다. |
| **폰트** | Urbanist, Pretendard, D2Coding | 기본 텍스트 폰트 및 코드 블록(D2Coding) 가독성 향상. |
| **FontAwesome** | 6.5.1 | 웹 UI의 각종 아이콘 렌더링. |

---

## 4. 데이터 구조 (State Management)
앱의 핵심 데이터는 전역 변수 `slidesData`, `projectSettings`, `activeTheme`으로 관리됩니다.

**`vme_data.json` 저장 구조** (`feat/custom-theme-builder` 이후)
```json
{
  "settings": {
    "activeTheme": "hpe_default",
    "branding": {
      "projectName":   "HPE Virtual Machine Essentials (VME)",
      "guideSubtitle": "설치 및 구성 가이드",
      "footerCopy":    "HPE VME Guide"
    }
  },
  "slides": [
    {
      "chapter": "1. 대제목",
      "middleTitle": "1.1 중제목 (선택)",
      "title": "1.1.1 소제목",
      "text": "본문 내용 (마크다운 지원)",
      "image": "data:image/png;base64,...",
      "imageCaption": "이미지 설명 캡션"
    }
  ]
}
```
> **구버전 호환**: 파일이 배열(`[]`) 형태인 경우 `parseLoadedData()`가 자동으로 감지하여 슬라이드만 교체하고 `settings`는 기본값을 유지합니다.

**`.slidetheme` 파일 구조**
```json
{
  "name": "hpe_default",
  "colors": { "accent": "#00E676", "bgDark": "#010409", ... },
  "pptx":   { "masterBg": "0D1117", "accentColor": "00E676", ... },
  "webGuide": { "headerBg": "#01a982", "accentColor": "#01a982", ... },
  "fonts":  { "uiFamily": "Pretendard", "pptxBody": "Malgun Gothic", ... }
}
```

그 외 UI 상태 추적용으로 `activeEditorIndex`(추가 중인 폼 위치), `editingSlideIndex`(수정 중인 폼 위치) 변수를 사용합니다.

---

## 5. 핵심 모듈 및 기능 (Functions)

### 5.1 데이터 로드 및 저장 (Data & File I/O)
- `loadInitialData()`: 에디터 로드 시 `vme_data.json`을 자동으로 가져온 뒤 `parseLoadedData()`로 파싱, 이후 저장된 테마(`projectSettings.activeTheme`)를 자동 로드합니다.
- `parseLoadedData(data)`: 구버전(배열)/신버전(래퍼 객체) 데이터를 자동 판별하여 `slidesData`와 `projectSettings`를 갱신하는 호환 파서입니다.
- `migrateData(slides)`: 구버전 `bashCode` 필드를 마크다운 코드 블록으로 변환하는 역방향 호환 함수.
- `exportData()` / `downloadData()`: 현재 `{ settings, slides }` 래퍼 객체를 JSON 파일로 서버 저장 또는 브라우저 다운로드합니다.
- `importData(event)`:  불러온 JSON이 구버전 배열이면 슬라이드만 교체, 신버전 래퍼 구조면 settings·theme까지 함께 복원합니다.

### 5.2 화면 렌더링 및 UI 처리 (UI Rendering)
- `renderPreview()`: 데이터를 기반으로 화면 전체를 새로 그리는 메인 렌더링 엔진입니다. React의 렌더링 방식처럼 데이터가 바뀔 때 마다 `preview-area` 내부의 HTML을 싹 지우고 다시 생성합니다.
  1. 고정된 표지 렌더링
  2. TOC(목차) 전처리 및 렌더링
  3. `slidesData` 배열 루프 처리
     - 현재 `activeEditorIndex`와 일치하는 위치에 '새 슬라이드 폼' 렌더링 (아닐 경우 얇은 '추가' 버튼 렌더링)
     - `editingSlideIndex`와 일치하는 슬라이드는 '수정 폼'으로 렌더링
     - 그 외 일반 슬라이드는 Markdown 파싱(`marked.parse()`) 및 HTML 주입을 거쳐 프리뷰 카드로 렌더링.
- `generateTocData(slides)`: 대제목, 중제목 변경 기준을 추적해 중복 항목이 나오지 않도록 계층적 목차 리스트 배포를 위한 전처리 함수입니다.
- `updateDynamicTOC()`: `generateTocData()`의 데이터를 소비하여 좌측 `#toc-navigator` 사이드바 DOM을 재생성합니다. `renderPreview()` 마지막에서 자동 호출되어 데이터와 항상 동기화되도록 연결.

### 5.3 동적 TOC 네비게이터 (Dynamic TOC Navigator)
— `feat/dynamic-toc` 브랜치에서 추가된 신규 모듈
- **레이아웃 변경**: HTML에 `.layout-wrapper`를 추가하여 좌측 `<aside class="toc-sidebar">`와 기존 `.main-container`를 나란히 배치. 일소구조에서 2단 분할 구조로 확장.
- **사이드바 렌더링**: 사이드바는 비어있을 때 안내 메시지를, 슬라이드가 있으면 대제목/중제목/소제목 계층을 다른 뷃 클래스로 다루어 표시.
- **클릭-스크롤 연동**: 항목 클릭 시 `scrollIntoView({behavior: 'smooth'})` 호출로 해당 슬라이드로 애니메이션 스크롤.
- **`IntersectionObserver`**: 슬라이드가 스크롤 내 특정 영역(상단 20%~하단 60% 사이)에 진입할 때 해당 TOC 아이템에 `.active` 클래스를 스위치하여 코드를 하이라이트. `renderPreview()` 호출 때마다 Observer를 재등록.)

### 5.4 내보내기 로직 (Export Engines)
가장 비중이 높은 핵심 로직입니다. 현재 데이터를 다른 포맷으로 파싱 및 전환합니다.

- **`exportToPPTX()` (PPTX 생성기)**
  - 슬라이드 마스터(`VME_MASTER`)를 정의하여 템플릿 레이아웃 생성.
  - 표지, 목차(페이지 초과 시 여러 페이지로 분할) 동적 생성.
  - 마크다운 텍스트를 수동으로 파싱(`split` 활용하여 ``` 코드 블록 찾기)한 뒤, 코드 블록은 검은 배경 도형 위에 D2Coding 폰트로, 일반 텍스트는 Malgun Gothic 폰트 도형에 올리도록 높이를 계산(`estimatedHeight`)하여 동적으로 배치. (이미지 유무에 따른 Width 비율 조정 로직 포함).
- **`exportToHTML()` (정적 웹 문서 생성기)**
  - 데이터를 읽기 전용 HTML 문서(스크롤 뷰어 형태)로 변환.
  - 뷰어를 위한 CSS 스타일 정보를 하드코딩된 스트링으로 삽입하고, 데이터들을 `card` 디자인 형태로 연결한 뒤 단일 `.html` 파일로 자동 다운로드.

### 5.5 TOC Navigator (추가 기능)
- **자동 동기화**: `renderPreview`가 호출될 때마다 `updateDynamicTOC`가 실행되어 슬라이드 데이터와 목차의 일관성을 유지합니다.
- **상태 관리**: 현재 보고 있는 슬라이드 위치를 `IntersectionObserver`가 감지하여, 좌측 사이드바의 해당 항목에 `.active` 클래스를 부여함으로써 사용자에게 현재 위치를 시각적으로 제공합니다.

### 5.6 모달 및 유틸리티
- `showModal()`: 기본 브라우저 내장 `alert`/`confirm`을 대체하는 커스텀 UI 팝업.
- `openImageModal()`: 이미지가 포함된 슬라이드 클릭 시 확대하여 보여주는 라이트박스 로직.
- `escapeHtml(str)`: 폼 입력 시 XSS 및 렌더링 깨짐을 대비한 이스케이프 함수.

### 5.7 테마 엔진 (Theme Engine)
— `feat/custom-theme-builder` 브랜치에서 추가된 신규 모듈
- **`applyThemeToEditor(theme)`**: `document.documentElement.style.setProperty()`로 CSS 변수(`--hpe-green`, `--bg-dark` 등)를 실시간 교체. `activeTheme`과 `projectSettings.activeTheme`을 동시 갱신.
- **`loadThemeByName(name)`**: `/api/themes/{name}.slidetheme` API 호출 → 성공 시 `applyThemeToEditor()`, 실패 시 `getDefaultThemeObject()`로 폴백.
- **`renderThemeModal()`**: 테마 목록 비동기 렌더링 + 7개의 색상 행(`color-row` 컴포넌트, 픽커↔HEX 양방향 동기화). 브랜딩 필드는 별도 모달로 분리됨.
- **`buildThemeFromModal()`**: 모달 UI 입력값으로부터 완전한 테마 오브젝트(colors, pptx, webGuide, fonts)를 빌드.
- **`syncBrandingUI()` / `collectBrandingFromUI()`**: 브랜딩 모달의 필드와 `projectSettings.branding` 간 양방향 동기화.
- **`exportTheme()` / `importTheme(event)`**: `.slidetheme` 파일 브라우저 다운로드 및 파일 불러오기.
- **`saveThemeToServer(theme)`**: `/api/themes/{name}.slidetheme` POST로 서버 저장.

### 5.8 브랜딩 모달 (Branding Modal)
— `feat/custom-theme-builder` 브랜치에서 테마 모달과 분리된 독립 UI
- **역할 분리**: 테마(색상·폰트)와 브랜딩(텍스트 정보)은 성격이 달라 별도 모달로 구분. 테마 파일에는 색상만, 데이터 파일에는 브랜딩만 저장.
- **`openBrandingModal()`**: `syncBrandingUI()`로 현재 `projectSettings.branding` 값을 필드에 채운 뒤 모달 표시.
- **`applyBrandingFromModal()`**: `collectBrandingFromUI()`로 입력 값을 `projectSettings.branding`에 반영. 영구 저장은 사용자가 데이터 저장 버튼을 눌러야 완료됨.
- **헤더 버튼**: `.btn-hdr--indigo` 색상 variant의 소형 버튼으로 표시.

---

## 6. 향후 수정 시 고려사항 (Considerations)
1. **렌더링 방식 한계**: 현재 바닐라 JS의 `innerHTML` 조작으로 통째로 리렌더링(`renderPreview()`) 하는 방식이라 데이터가 매우 큰 경우 스크롤 위치 유지나 포커스 아웃 현상을 조심해야 합니다.
2. **에러 핸들링**: PPTX 내보내기 시 텍스트가 매우 길어 높이를 초과할 경우 슬라이드 밖으로 벗어나는 한계가 있을 수 있습니다(현재 라인 수 곱하기로 대략적인 높이 산정 `estimatedHeight`).
3. **스타일 격리**: `exportToHTML` 문자열 안의 CSS는 `activeTheme.webGuide`를 통해 동적으로 주입되므로, 에디터 CSS와 내보내기 CSS를 함께 수정해야 합니다.
4. **TOC Observer 재등록 비용**: `renderPreview()` 호출마다 `IntersectionObserver`를 `disconnect` 후 재등록하기 때문에, 슬라이드 수가 매우 많은 경우 (수십 장 이상) Observer 성능 영향을 확인해야 합니다. 필요시 Debounce 도입 검토.
5. **`vme_data.json` 구조 변경 주의**: `feat/custom-theme-builder` 이후 저장 포맷이 배열에서 `{ settings, slides }` 래퍼 객체로 바뀌었습니다. 불러오기는 하위 호환되지만, 새로 저장한 파일은 구버전 에디터에서 열 수 없습니다.
6. **테마 서버 의존성**: 테마 기능은 `/api/themes` 엔드포인트(local_server.ps1)에 의존합니다. 서버 없이 동작 시 `getDefaultThemeObject()` 폴백으로 기본 테마가 적용됩니다.
