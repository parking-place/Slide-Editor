# Slide Editor 구조 분석 및 운영 개요

이 문서는 현재 `Slide Editor`의 실제 코드 구조와 실행 방식, 데이터 저장 흐름, 유지보수 포인트를 빠르게 파악하기 위한 구조 문서입니다. 문서 기준 시점의 앱 버전은 `version.json` 기준 `v0.9.1`입니다.

## 1. 현재 프로젝트 개요

- 편집 UI: 브라우저 기반 단일 페이지 편집기
- 서버: `scripts/server.js` 기반 Node.js/Express 서버
- 기본 실행 경로: Docker Compose
- 대체 실행 경로: `node scripts/server.js`
- 주요 출력물: PPTX, HTML 가이드, JSON 백업
- 저장 모델: 프로젝트별 독립 저장 구조

현재 프로젝트는 예전의 단일 `slide_data.json` 중심 구조에서 벗어나, 각 프로젝트를 `data/projects/<projectId>/` 아래에 독립적으로 저장하는 구조로 운영됩니다. 또한 이미지 자산은 비동기 WebP 변환 파이프라인을 거쳐 프로젝트 단위로 관리됩니다.

## 2. 디렉터리 구조

### 2.1 루트

- `SlideEditor.html`
  - 앱의 HTML 엔트리 파일입니다.
  - 외부 라이브러리와 `src` 하위 CSS/JS를 로드합니다.
- `Dockerfile`, `docker-compose.yml`
  - 배포 및 로컬 실행용 컨테이너 설정입니다.
- `version.json`
  - 앱이 화면과 저장 데이터에 표시하는 기준 버전입니다.
- `README.md`
  - 실행 방법, 배포 방식, 사용자 관점 개요를 담습니다.

### 2.2 `src/`

현재 프런트엔드는 기능 단위로 분리된 구조를 사용합니다.

- `src/app.js`
  - 앱 초기 부트스트랩과 공통 전역 연결을 담당합니다.
- `src/core/state.js`
  - 전역 상태, 버전 정보, 현재 프로젝트 정보, 공통 상태 유틸을 담당합니다.
- `src/features/projects.js`
  - 프로젝트 목록, 열기, 새 프로젝트, Save As, 이름 변경, 삭제, 프로젝트 매니저 UI를 담당합니다.
- `src/features/editor.js`
  - 슬라이드 생성, 수정, 삭제, 기본 렌더링 흐름을 담당합니다.
- `src/features/export.js`
  - 서버 저장, JSON 백업, HTML/PPTX 출력 흐름을 담당합니다.
- `src/features/theme.js`
  - 테마 및 브랜딩 관리 기능을 담당합니다.
- `src/features/media.js`
  - 이미지 업로드, WebP 변환 상태 polling, 구버전 이미지 backfill 변환을 담당합니다.
- `src/features/html5-semantics.js`
  - `dialog`, `figure`, `section` 등 HTML5 시맨틱 강화 로직을 담당합니다.
- `src/features/html5-forms.js`
  - `form`, `fieldset`, `progress`, `output`, `details` 기반 편집 UI 강화를 담당합니다.
- `src/features/outline.js`
  - TOC, outline 메타데이터, 탐색 보강 로직을 담당합니다.
- `src/features/export-enhancements.js`
  - HTML export 구조 보강, lazy/image fallback, 편집기와 export 구조 동기화를 담당합니다.

### 2.3 `src/styles/`

스타일은 책임별 CSS 파일로 분리되어 있고, `src/style.css`가 이를 순서대로 import하는 로더 역할을 합니다.

- `base.css`
  - 변수, 공통 리셋, 버튼/입력 기본 스타일
- `layout.css`
  - 전체 레이아웃, 헤더, 미리보기, TOC 구조
- `editor.css`
  - 슬라이드 편집 UI, 폼, 미디어 편집 스타일
- `modal.css`
  - 프로젝트/테마/브랜딩/확인 모달 스타일
- `enhancements.css`
  - WebP 변환 상태, lazy 렌더링, HTML5 강화 스타일

### 2.4 `scripts/`

- `server.js`
  - 정적 파일 서빙, 프로젝트 API, 이미지 변환 API, 테마 API, HTML 저장 API를 담당하는 메인 서버입니다.
- 기타 보조 스크립트
  - 분할/패치/테스트 보조용 스크립트가 존재할 수 있으나, 운영 기준 서버는 `server.js`입니다.

### 2.5 `data/`

- `data/projects/`
  - 프로젝트별 저장소입니다.
- `data/themes/`
  - 사용자 테마 저장 경로입니다.
- `data/slide_data.json`, `data/image_data/`
  - 구버전 호환용 레거시 경로입니다.
  - 서버 시작 시 필요하면 `default` 프로젝트로 이관됩니다.

### 2.6 `exports/`

- 서버가 생성한 HTML 가이드 출력물이 저장됩니다.

## 3. 실행 구조

### 3.1 Docker 기준 실행

현재 기본 운영 경로는 Docker입니다.

- 기본 이미지: `parkingplace/slide-editor:<version>` 또는 `latest`
- 바인드 마운트
  - `data -> /app/data`
  - `exports -> /app/exports`
- 기본 포트: `8000`

Docker 실행 시 프로젝트 데이터와 export 결과물은 컨테이너 외부 볼륨에 유지됩니다.

### 3.2 Node 직접 실행

로컬 개발이나 빠른 확인이 필요할 때는 다음 경로를 사용할 수 있습니다.

1. `npm install`
2. `node scripts/server.js`

직접 실행은 개발 편의용이며, 실제 운영 기준은 Docker입니다.

## 4. 프런트엔드 구조

### 4.1 HTML 엔트리

`SlideEditor.html`은 다음 역할을 수행합니다.

- 외부 라이브러리 로드
  - `pptxgenjs`
  - `marked`
  - `highlight.js`
  - 폰트 및 아이콘
- 앱 셸 UI 제공
  - 헤더
  - TOC 사이드바
  - 미리보기 영역
  - 프로젝트/테마/확인 모달
- 기능별 스크립트 로드

현재 주요 모달은 HTML5 `dialog` 기반으로 구성되어 있습니다. 브랜딩 편집과 JSON 임포트/백업 도구는 별도 헤더 액션이 아니라 프로젝트 매니저 안으로 통합되었습니다.

### 4.2 전역 상태와 초기화

전역 상태는 주로 `src/core/state.js`에서 관리합니다.

대표 상태는 다음과 같습니다.

- `slidesData`
- `projectSettings`
- `currentProject`
- `projectListCache`
- `currentAppVersion`
- 이미지 변환 관련 런타임 상태

앱 시작 시에는 다음 흐름으로 초기화됩니다.

1. `version.json`에서 현재 앱 버전을 읽습니다.
2. `/api/app-state`와 `/api/projects`를 통해 현재 프로젝트와 프로젝트 목록을 확인합니다.
3. 마지막 프로젝트 또는 기본 프로젝트를 로드합니다.
4. 미리보기, TOC, 프로젝트 표시, 모달 상태를 렌더링합니다.

### 4.3 기능 모듈 분리 원칙

현재 `src` 구조는 과거의 페이즈별 임시 파일 구조를 정리하고, 기능 단위로 재분할한 상태입니다.

분리 기준은 다음과 같습니다.

- 프로젝트 관리
- 편집/렌더링
- 미디어 처리
- export
- 테마/브랜딩
- HTML5 시맨틱 보강
- 접근성/폼 보강

이 구조는 기능 경계를 명확히 하고, 이후 유지보수 시 특정 기능만 분리 점검하거나 교체하기 쉽게 만듭니다.

## 5. 프로젝트 저장 구조

### 5.1 프로젝트 디렉터리

각 프로젝트는 아래 구조를 가집니다.

```text
data/projects/<projectId>/
  meta.json
  slide_data.json
  image_data/
    index.json
    originals/
    converted/
```

### 5.2 `slide_data.json`

프로젝트의 실제 편집 데이터입니다.

주요 필드는 다음과 같습니다.

- `savedVersion`
  - 데이터를 저장한 앱 버전입니다.
  - 프로젝트 매니저에서 함께 표시됩니다.
  - 값이 없으면 구버전 데이터로 간주하고 `old`로 표시합니다.
- `settings`
  - 활성 테마, 브랜딩 정보 등 프로젝트 설정입니다.
  - `settings.branding.projectName`은 현재 프로젝트 저장 이름과 동일하게 유지됩니다.
- `slides`
  - 슬라이드 배열입니다.

### 5.3 `meta.json`

프로젝트 목록 렌더링용 메타데이터입니다.

대표 정보는 다음과 같습니다.

- 프로젝트 이름
- 프로젝트 ID
- 슬라이드 수
- 생성/수정 시각
- `savedVersion`

### 5.4 `image_data/index.json`

이미지 자산 메타데이터 저장소입니다.

대표 필드는 다음과 같습니다.

- 자산 ID
- 상태
  - `queued`
  - `converting`
  - `ready`
  - `failed`
- 원본 파일 경로
- 변환 파일 경로
- MIME 타입
- 생성/수정 시각

## 6. 이미지 처리 파이프라인

현재 이미지는 프로젝트별 비동기 WebP 파이프라인으로 처리됩니다.

### 6.1 신규 업로드

1. 사용자가 이미지를 업로드합니다.
2. 서버는 원본을 `originals/`에 저장합니다.
3. 이미지 자산을 `queued` 또는 `converting` 상태로 등록합니다.
4. `sharp`를 통해 WebP로 변환합니다.
5. 변환 완료 시 `converted/` 경로와 `ready` 상태를 기록합니다.
6. 프런트는 상태 API를 polling해 미리보기를 갱신합니다.

### 6.2 UI 동작

- 변환 전에는 이미지 영역에 `변환 중` 상태를 표시합니다.
- 변환 완료 후에는 WebP 이미지를 자동으로 반영합니다.
- 이미지 엘리먼트에는 `loading="lazy"`, `decoding="async"`가 적용됩니다.

### 6.3 구버전 데이터 호환

기존 JSON import 또는 구버전 프로젝트 로드 시에는 다음 흐름을 따릅니다.

1. 프로젝트와 슬라이드 자체는 먼저 화면에 표시합니다.
2. 이미지가 구버전 형식이면 일괄적으로 `변환 중` 상태를 표시합니다.
3. 이미지는 순차적으로 하나씩 WebP로 backfill 변환합니다.
4. 모든 변환이 끝나면 완료 알림을 표시합니다.
5. 서버 프로젝트인 경우 변환 완료 데이터를 현재 프로젝트에 다시 저장해 다음부터 재변환하지 않도록 합니다.

추가로 현재 JSON 임포트는 단순 임시 로드가 아니라 서버 프로젝트 생성 흐름으로 연결됩니다. 구조화된 JSON 파일이면 파일 안의 `settings.branding.projectName`을 우선 프로젝트 이름으로 사용하고, 해당 이름으로 서버 프로젝트를 만든 뒤 즉시 열어 편집을 이어갑니다.

## 7. 출력 및 백업 구조

### 7.1 서버 저장

- 현재 프로젝트 저장은 `/api/projects/:projectId` 계열 API를 통해 수행됩니다.
- 저장 시 `savedVersion`이 함께 기록됩니다.

### 7.2 JSON 백업

- 사용자가 다운로드하는 백업 JSON에도 `savedVersion`이 포함됩니다.
- 백업은 portable 성격을 유지하기 위해 필요한 경우 이미지를 인라인 데이터로 다시 포함합니다.
- 백업 파일명은 `프로젝트명_data_YYMMDDhhmmss.json` 형식을 사용합니다.

### 7.2.1 프로젝트 매니저 통합 도구

현재 프로젝트 매니저는 다음 도구를 함께 제공합니다.

- 프로젝트 생성, 열기, Save As, 이름 변경, 삭제
- 현재 프로젝트 브랜딩 편집
  - 프로젝트명은 읽기 전용 표시이며 저장 이름과 자동 동기화됩니다.
  - 부제와 footer 문구는 여기서 직접 수정합니다.
- JSON import
  - 파일 내부 브랜딩 프로젝트명을 우선 사용해 서버 프로젝트로 저장합니다.
- JSON backup
  - 현재 열려 있는 프로젝트 기준 portable JSON을 다운로드합니다.

### 7.3 HTML 가이드

- HTML 가이드는 서버 저장과 다운로드 두 경로를 모두 지원합니다.
- export 시 HTML5 시맨틱 구조와 outline 메타데이터를 반영합니다.
- WebP 우선 사용, 필요 시 fallback 규칙을 적용합니다.

### 7.4 PPTX 출력

- PPTX 출력은 현재 편집 데이터와 이미지 해석 규칙을 공유합니다.
- HTML export와 가능한 한 동일한 이미지 해석 흐름을 따르도록 맞춰져 있습니다.

## 8. 서버 구조

`scripts/server.js`는 현재 다음 책임을 담당합니다.

- 정적 파일 서빙
- 프로젝트 목록/로드/생성/이름 변경/삭제
- 앱 상태 저장 및 마지막 프로젝트 기억
- 프로젝트별 이미지 업로드
- 이미지 상태 조회 및 파일 제공
- WebP 변환 처리
- 레거시 데이터 이관
- 테마 목록/불러오기/저장
- HTML 가이드 저장

주요 기술 요소는 다음과 같습니다.

- `express`
- `sharp`
- 파일 시스템 기반 JSON 저장

현재 서버는 데이터베이스 없이 파일 시스템을 신뢰 저장소로 사용하는 구조입니다.

## 9. 유지보수 포인트

### 9.1 구조 변경 시 함께 갱신할 문서

- `README.md`
- `docs/CONTRIBUTING.md`
- `docs/slide_editor_architecture.md`
- `docs/changelog/unreleased.md`
- 필요 시 릴리즈 노트

### 9.2 버전 관리 기준

버전 관련 정보는 다음 경로와 함께 움직여야 합니다.

- `version.json`
- changelog
- Git 태그
- Docker 태그
- 저장 데이터의 `savedVersion`

### 9.3 특히 주의할 변경 지점

- 프로젝트 저장 포맷 변경
- 이미지 자산 경로 변경
- WebP 변환 파이프라인 변경
- export HTML 구조 변경
- TOC 및 outline 메타데이터 변경
- HTML5 `dialog`/폼 구조 변경

이 영역은 편집기 UI, 저장 데이터, 서버 API, export 결과물이 동시에 영향을 받을 수 있으므로 변경 시 통합 점검이 필요합니다.

## 10. 현재 구조의 핵심 요약

현재 `Slide Editor`는 다음 세 축으로 이해하면 가장 빠릅니다.

1. 프런트엔드는 기능 단위 모듈로 나뉜 단일 페이지 편집기입니다.
2. 서버는 파일 시스템 기반 프로젝트 저장소와 이미지 변환 파이프라인을 제공합니다.
3. 프로젝트 데이터는 버전 메타데이터와 함께 저장되며, 구버전 데이터도 `old` 표시와 backfill 변환으로 호환됩니다.

즉, 현재 구조는 단순한 슬라이드 편집기를 넘어, 프로젝트 단위 저장과 HTML/PPTX export, 비동기 이미지 최적화, HTML5 강화 UI까지 포함하는 경량 문서 제작 플랫폼에 가깝습니다.
