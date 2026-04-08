# Slide Editor 코드 분석 문서

이 문서는 현재 `Slide Editor` 프로젝트의 구조, 데이터 흐름, 실행 방식, 핵심 모듈을 유지보수 관점에서 정리한 문서입니다. 초기의 HPE VME 전용 단일 HTML 도구에서 출발했지만, 현재는 **범용 슬라이드 편집기 + Node 기반 로컬 서버 + Docker 배포 흐름**으로 확장된 상태를 기준으로 설명합니다.

## 1. 개요

- **앱 성격**: 브라우저 기반 단일 페이지 슬라이드 편집기
- **주요 출력물**: PPTX, 정적 HTML 웹 가이드
- **실행 방식**: Docker Compose 기반 실행이 기본, Node.js 직접 실행도 가능
- **현재 포지셔닝**: HPE 전용 내부 도구에서 범용 `Slide Editor`로 리브랜딩 완료

---

## 2. 디렉토리 구조 및 역할

- **`/` (Root)**: 진입점과 배포 관련 파일이 위치
  - `SlideEditor.html`: 메인 HTML 엔트리
  - `Dockerfile`: 배포용 이미지 빌드 정의
  - `docker-compose.yml`: Docker Hub `latest` 기반 런타임 정의
  - `docker-compose-up.bat`, `docker-compose-up.sh`: 운영체제별 실행 스크립트
- **`/src`**: 프론트엔드 애플리케이션 코드
  - `app.js`: 상태 관리, 렌더링, 내보내기, 테마/브랜딩 로직
  - `style.css`: 에디터 UI 스타일
- **`/data`**: 영속 데이터 저장 영역
  - `slide_data.json`: 기본 저장 데이터
  - `themes/`: `.slidetheme` 파일 저장소
  - `image_data/`: 서버 저장 시 분리되는 이미지 바이너리 파일 저장소
- **`/scripts`**: 서버 및 유틸리티 스크립트
  - `server.js`: 현재 표준 Node.js/Express 서버
  - `local_server.ps1`: 초기 PowerShell 서버
  - `split.ps1`, `split.py`, `patch.py`: 보조 유틸리티
- **`/exports`**: HTML 가이드 산출물 저장 디렉토리
- **`/docs`**: 릴리즈 이력, 컨트리뷰팅 가이드, 구조 분석 문서
- **`/plans`**: 내부 기획 및 작업 문서

---

## 3. 실행 및 배포 구조

### 3.1 기본 실행 흐름

- 기본 실행 기준은 `docker-compose.yml`
- 컨테이너 이미지는 `parkingplace/slide-editor:latest`
- `./data`와 `./exports`는 호스트 볼륨으로 마운트
- 헬스체크는 `http://127.0.0.1:8000/SlideEditor.html` 기준

### 3.2 실행 스크립트 역할

- `docker-compose-up.bat`
- `docker-compose-up.sh`

두 스크립트 모두 현재는 `docker compose pull` 후 `docker compose up -d`를 실행하여 원격 최신 이미지를 기준으로 컨테이너를 재생성합니다.

### 3.3 Docker와 코드 저장소의 관계

- Git 릴리즈 태그와 Docker 이미지 태그는 동일 문자열로 맞춥니다.
- `latest`는 최신 핫픽스 또는 최신 정식 릴리즈를 가리키는 운영 태그 역할을 합니다.
- 실제 이미지 콘텐츠는 `Dockerfile`을 통해 빌드되며, 런타임에서는 Docker Hub 배포 이미지를 소비합니다.

---

## 4. 데이터 구조

앱의 핵심 상태는 프런트엔드 메모리 상의 `slidesData`, `projectSettings`, `activeTheme`로 관리됩니다.

### 4.1 `slide_data.json` 구조

```json
{
  "settings": {
    "activeTheme": "hpe_default",
    "branding": {
      "projectName": "My Guide",
      "guideSubtitle": "Installation Guide",
      "footerCopy": "Slide Editor"
    }
  },
  "slides": [
    {
      "chapter": "1. 대제목",
      "middleTitle": "1.1 중제목",
      "title": "1.1.1 소제목",
      "text": "본문 내용",
      "image": "./data/image_data/example.png",
      "imageCaption": "이미지 설명",
      "textRatio": 50
    }
  ]
}
```

### 4.2 이미지 저장 이원화

- **서버 저장**: 인라인 base64 이미지를 `data/image_data` 아래 파일로 분리 저장
- **브라우저 백업 다운로드**: 이식성을 위해 다시 data URL을 포함한 포터블 JSON 생성

이 구조 덕분에 운영 저장본은 가벼워지고, 백업 파일은 단독 복원이 가능합니다.

### 4.3 하위 호환성

- 구버전 배열형 JSON도 로드 가능
- 구버전 인라인 이미지도 그대로 import 가능
- 새 구조 저장본은 `{ settings, slides }` 래퍼를 사용

---

## 5. 핵심 모듈 및 기능

### 5.1 프론트엔드 렌더링

- `renderPreview()`: 에디터 메인 렌더링 엔진
- `generateTocData()`, `updateDynamicTOC()`: 동적 목차 생성 및 좌측 네비게이터 갱신
- `openImageModal()`, `showModal()`: UI 유틸리티 및 모달 처리

현재 구조는 데이터 변경 시 프리뷰를 다시 그리는 방식이라 구현은 단순하지만, 문서가 매우 커질 경우 렌더링 비용 증가 가능성이 있습니다.

### 5.2 데이터 입출력

- `loadInitialData()`: 앱 시작 시 `slide_data.json` 로드
- `parseLoadedData()`: 구버전/신버전 저장 포맷 호환 파서
- `exportData()`: 서버 저장 API 호출
- `downloadData()`: 포터블 JSON 백업 다운로드
- `importData()`: JSON 파일 불러오기

### 5.3 내보내기 엔진

- `exportToPPTX()`: PptxGenJS 기반 PPTX 생성
- `exportToHTML()`: 정적 HTML 웹 가이드 생성

두 엔진 모두 테마와 브랜딩 정보를 반영하며, 이미지와 텍스트 비율(`textRatio`)도 함께 고려합니다.

### 5.4 테마 및 브랜딩

- `.slidetheme` 기반 테마 시스템
- `applyThemeToEditor()`, `loadThemeByName()`, `renderThemeModal()`
- `openBrandingModal()`, `applyBrandingFromModal()`

테마는 색상/폰트 중심, 브랜딩은 프로젝트별 텍스트 중심으로 분리되어 있습니다.

### 5.5 Node 서버

`scripts/server.js`는 현재 표준 서버 구현입니다.

- 정적 파일 서빙
- `/api/save`: `slide_data.json` 저장
- `/api/saveHtml`: HTML 가이드 저장
- `/api/themes` GET/POST: 테마 파일 관리

여기서 이미지 분리 저장 로직도 함께 처리합니다.

---

## 6. 주요 의존성

| 항목 | 역할 |
|---|---|
| PptxGenJS | 브라우저 PPTX 생성 |
| Marked.js | Markdown 파싱 |
| Highlight.js | 코드 블록 하이라이팅 |
| Font Awesome | 아이콘 렌더링 |
| Express | 로컬 HTTP 서버 |
| Docker / Compose | 컨테이너 실행 및 배포 표준화 |

---

## 7. 유지보수 시 고려사항

1. **README와 실제 배포 기준 동기화**
   Docker 실행 방식, 이미지 태그, 실행 스크립트 동작이 바뀌면 README도 함께 갱신해야 합니다.
2. **`slide_data.json`와 `image_data`의 결합 관계**
   서버 저장본은 `data/image_data` 파일이 함께 있어야 정상 복원됩니다.
3. **하위 호환성 유지**
   새 저장 구조를 바꿀 때는 반드시 구버전 배열형 데이터와 인라인 이미지 로드 경로를 확인해야 합니다.
4. **렌더링 비용**
   `renderPreview()` 중심 전체 리렌더 구조라 슬라이드 수가 많을수록 성능 점검이 필요합니다.
5. **웹 가이드 스타일 동기화**
   에디터 CSS와 HTML 내보내기 문자열 CSS가 서로 어긋나지 않도록 함께 관리해야 합니다.
6. **Docker 릴리즈 규칙 준수**
   릴리즈 태그, Docker 이미지 태그, `version.json`, `CHANGELOG.md`, `docs/changelog/unreleased.md`, `CONTRIBUTING.md`는 항상 같은 기준으로 맞춰야 합니다.
