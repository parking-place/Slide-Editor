# Slide Editor 구조 문서

이 문서는 현재 `Slide Editor`의 실행 구조, 저장 구조, Viewer 출력 구조를 빠르게 파악하기 위한 최신 문서입니다.

기준 버전은 `version.json` 기준 `v0.12.0`입니다.

## 1. 개요

- 프런트엔드: 브라우저에서 동작하는 단일 페이지 편집기
- 서버: `scripts/server.js` 기반 Node.js / Express 서버
- 기본 실행 방식: Docker Compose
- 보조 실행 방식: `node scripts/server.js`
- 주요 결과물: Viewer 미리보기, HTML 다운로드, JSON 백업
- 저장 방식: 프로젝트별 디렉터리 저장 구조
- 이미지 처리: 비동기 WebP 변환 + 구버전 이미지 backfill

## 2. 루트 구조

```text
Slide-Editor/
├─ SlideEditor.html
├─ version.json
├─ Dockerfile
├─ docker-compose.yml
├─ docker-compose-up.bat
├─ docker-compose-up.sh
├─ docker-multiarch-release.bat
├─ docker-multiarch-release.sh
├─ src/
├─ scripts/
├─ data/
├─ exports/
└─ docs/
```

## 3. 프런트엔드 구조

### 3.1 진입점

- `SlideEditor.html`
  - 라이브러리, CSS, 기능 모듈 JS를 순서대로 로드
  - 헤더, Navigator, 미리보기, 프로젝트/테마/브랜딩 모달을 제공

- `src/app.js`
  - 부트스트랩용 엔트리 파일

### 3.2 상태 및 공통 로직

- `src/core/state.js`
  - 전역 상태(`slidesData`, `projectSettings`, `currentProject`) 관리
  - 초기 프로젝트 로드
  - 버전 정보 로드
  - 공통 요청 유틸과 프로젝트 선택 상태 동기화

### 3.3 기능 모듈

- `src/features/projects.js`
  - 프로젝트 목록, 열기, 복제, 이름 변경, 삭제
  - 프로젝트 매니저 UI

- `src/features/editor.js`
  - 슬라이드 추가, 수정, 삭제
  - 에디터 미리보기 렌더링
  - 중제목 변경 시 커버 슬라이드 삽입
  - Navigator 데이터 생성

- `src/features/media.js`
  - 이미지 업로드
  - WebP 변환 상태 polling
  - 구버전 이미지 backfill

- `src/features/export.js`
  - JSON 백업 export / import
  - 레거시 HTML 생성 경로 유지

- `src/features/export-enhancements.js`
  - Viewer HTML 생성
  - Viewer 팝업 / HTML 다운로드
  - 이미지 fallback 처리
  - 코드블록 스타일과 복사 버튼
  - Navigator, 이미지 확대
  - 에디터와 동일한 중제목 커버 슬라이드 삽입

- `src/features/theme.js`
  - 테마 로드 / 저장 / 적용
  - 브랜딩과 glass UI 변수 동기화

- `src/features/html5-semantics.js`
  - HTML5 시맨틱 구조 보강

- `src/features/html5-forms.js`
  - `form`, `fieldset`, `details`, `output`, `progress` 기반 UI 보강

- `src/features/outline.js`
  - Viewer / HTML용 공통 outline 메타데이터 연결

### 3.4 스타일 구조

- `src/style.css`
  - 스타일 로더

- `src/styles/base.css`
  - 전역 변수, 리셋, 공통 토큰

- `src/styles/layout.css`
  - 헤더, 본문 레이아웃, Navigator

- `src/styles/editor.css`
  - 에디터 카드, 커버 슬라이드, 미리보기 레이아웃
  - 긴 본문일 때 카드가 최소 높이 이상으로 자동 확장되도록 조정

- `src/styles/modal.css`
  - 프로젝트/테마/확인 모달

- `src/styles/enhancements.css`
  - WebP 상태 UI, lazy 렌더링, HTML5 보강 스타일

## 4. 데이터 구조

프로젝트는 아래 경로에 저장됩니다.

```text
data/projects/<projectId>/
  meta.json
  slide_data.json
  image_data/
    index.json
    originals/
    converted/
```

핵심 파일:

- `meta.json`
  - 프로젝트 이름, 저장 버전, 마지막 저장 시각

- `slide_data.json`
  - 브랜딩, 활성 테마, 슬라이드 데이터

- `image_data/index.json`
  - 변환 이미지 메타데이터

## 5. Viewer / HTML 출력 구조

- Viewer와 HTML 다운로드는 모두 `export-enhancements.js`의 생성 경로를 우선 사용합니다.
- Viewer는 에디터와 동일한 흐름으로 렌더링됩니다.
  - 커버 슬라이드
  - 중제목 변경 시 구분 커버 슬라이드
  - 일반 본문 슬라이드
- Viewer Navigator는 일반 슬라이드 제목과 중제목 구분 항목을 함께 표시합니다.
- 중제목 항목을 클릭하면 해당 중제목 커버 슬라이드로 이동합니다.
- 일반 제목 항목 활성화는 실제 본문 슬라이드를 기준으로 동기화됩니다.
- 긴 본문은 에디터와 Viewer 모두에서 최소 높이 이상으로 자연스럽게 확장되며, 짧은 본문이라고 해서 카드가 더 작아지지는 않습니다.

## 6. 실행과 배포

- 로컬 권장 실행: Docker Compose
- 배포 이미지: `parkingplace/slide-editor`
- 멀티아키텍처 지원:
  - `linux/amd64`
  - `linux/arm64`
- 원격 배포 시에는 최신 이미지 pull, 컨테이너 재기동, 미사용 이미지 정리를 함께 수행합니다.
