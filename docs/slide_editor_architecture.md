# Slide Editor 구조 분석 및 운영 개요

이 문서는 현재 `Slide Editor` 코드 구조, 저장 방식, 이미지 파이프라인, HTML 가이드 출력 흐름, 배포 구조를 빠르게 파악하기 위한 최신 구조 문서입니다.

문서 기준 버전은 `version.json` 기준 `v0.10.0a`입니다.

## 1. 현재 프로젝트 개요

- 편집 UI: 브라우저 기반 단일 페이지 편집기
- 서버: `scripts/server.js` 기반 Node.js/Express 서버
- 기본 실행 경로: Docker Compose
- 대체 실행 경로: `node scripts/server.js`
- 주요 출력물: HTML 가이드, JSON 백업
- 저장 모델: 프로젝트별 독립 저장 구조
- 이미지 처리: 비동기 WebP 변환 + 구버전 데이터 백필 변환

현재 구조는 예전 단일 `slide_data.json` 중심 모델에서 벗어나, 프로젝트별 디렉터리와 이미지 자산 저장소를 갖는 방식으로 전환되어 있습니다.

## 2. 디렉터리 구조

### 2.1 루트

- `SlideEditor.html`
  - 메인 HTML 엔트리 파일입니다.
  - 공통 라이브러리와 `src` 하위 JS/CSS를 로드합니다.
- `Dockerfile`, `docker-compose.yml`
  - 로컬과 원격 배포를 위한 컨테이너 설정입니다.
- `version.json`
  - 현재 릴리즈 버전의 단일 기준 파일입니다.
- `README.md`
  - 실행 방법과 운영 개요를 설명합니다.

### 2.2 `src/`

프런트엔드는 기능 단위 모듈 구조를 사용합니다.

- `src/app.js`
  - 부트스트랩과 초기 연결만 담당합니다.
- `src/core/state.js`
  - 전역 상태, 현재 프로젝트, 버전 정보, 공통 데이터 유틸을 담당합니다.
- `src/features/projects.js`
  - 프로젝트 목록 로딩, Current/Selected 상태 분기, 프로젝트 저장·복제·열기·삭제, 새 프로젝트 다이얼로그 흐름을 담당합니다.
- `src/features/editor.js`
  - 슬라이드 추가/수정/삭제와 미리보기 렌더링을 담당합니다.
- `src/features/export.js`
  - HTML 가이드 저장/다운로드, JSON 백업/임포트를 담당합니다.
- `src/features/theme.js`
  - 테마와 브랜딩 동기화, `glass` 토큰 정규화, CSS 변수 주입, 테마 모달의 glass 편집 UI를 담당합니다.
- `src/features/media.js`
  - 이미지 업로드, WebP 변환 상태 polling, 구버전 이미지 backfill을 담당합니다.
- `src/features/html5-semantics.js`
  - `dialog`, `figure`, `section` 등 HTML5 시맨틱 보강을 담당합니다.
- `src/features/html5-forms.js`
  - `form`, `fieldset`, `details`, `progress`, `output` 기반 UI 보강을 담당합니다.
- `src/features/outline.js`
  - outline 메타데이터와 HTML 가이드 동기화 보강을 담당합니다.
- `src/features/export-enhancements.js`
  - 가이드용 Navigator, 이미지 fallback, portable HTML 변환, glass 토큰이 반영된 HTML 가이드 셸 보강을 담당합니다.

### 2.3 `src/styles/`

스타일은 책임별로 분리되어 있고, `src/style.css`가 로더 역할을 합니다.

- `base.css`
  - 변수, 공통 리셋, 버튼/입력 기본 스타일, glass 공통 토큰
- `layout.css`
  - 헤더, 본문 레이아웃, Navigator, 미리보기 배치, 전역 glass 배경/헤더 shell
- `editor.css`
  - 편집기 폼과 슬라이드 카드 스타일, glass shell + readable inner content 구조
- `modal.css`
  - 프로젝트/테마/확인 모달 스타일, glass 편집 필드와 live sample card
- `enhancements.css`
  - WebP 상태 UI, lazy 렌더링, HTML5 보강 스타일

### 2.4 `scripts/`

- `server.js`
  - 정적 파일 서빙
  - 프로젝트 API
  - 앱 상태 API
  - 테마 API
  - HTML 저장 API
  - 이미지 업로드/상태 조회 API
  - WebP 변환 파이프라인

### 2.5 `data/`

- `data/projects/`
  - 프로젝트별 저장 디렉터리
- `data/themes/`
  - 사용자 테마 저장 경로
- `data/slide_data.json`, `data/image_data/`
  - 구버전 호환용 legacy 경로
  - 필요 시 `default` 프로젝트로 이관됩니다.

### 2.6 `exports/`

- 서버에서 생성한 HTML 가이드가 저장됩니다.

## 3. 프런트엔드 구조

### 3.1 HTML 엔트리

`SlideEditor.html`은 다음 역할을 수행합니다.

- 공통 라이브러리 로드
  - `marked`
  - `highlight.js`
  - 폰트 및 아이콘
- 헤더 액션 표시
  - Theme
  - Project
  - Save
  - Guide
  - HTML
- 프로젝트/테마/확인 모달 제공
- 좌측 Navigator와 본문 미리보기 컨테이너 제공

현재는 더 이상 PPTX 버튼이나 PPTX 라이브러리를 로드하지 않으며, HTML 가이드 중심 구조로 정리되어 있습니다.

### 3.2 미리보기 렌더링

에디터 미리보기는 다음 순서로 구성됩니다.

1. 표지 렌더링
2. 본문 슬라이드 렌더링
3. 중제목 전환 시 구분 표지 렌더링
4. 좌측 Navigator 갱신

예전처럼 미리보기 내부에 별도 목차 슬라이드를 넣지 않고, Navigator만 탐색 수단으로 유지합니다. 이로써 가이드와 편집기의 탐색 모델이 동일해졌습니다.

### 3.3 프로젝트 매니저

프로젝트 매니저는 `Current Project`와 `Selected Project`를 한 화면에 동시에 섞어 보여주지 않고,
선택 상태에 따라 오른쪽 패널의 역할을 분리하는 구조로 정리되어 있습니다.

왼쪽 패널은 항상 동일합니다.

- 저장된 프로젝트 목록
- 새 프로젝트 생성/Import를 여는 `+` 버튼
- 새로고침 버튼
- 각 프로젝트 행의 삭제 버튼

오른쪽 패널은 선택 상태에 따라 바뀝니다.

- 현재 프로젝트를 선택한 경우
  - 이름, 부제, footer 입력 필드
  - `ID`, `page`, `Saved Version`, `Last Saved`
  - `Save`, `Copy`, `Export`
- 다른 프로젝트를 선택한 경우
  - 이름, 부제, footer 읽기 전용 필드
  - `ID`, `page`, `Saved Version`, `Last Saved`
  - `Open`, `Copy`

새 프로젝트 생성과 JSON Import는 메인 패널 하단에 섞어 두지 않고, 별도 `New Project` 다이얼로그에서 시작합니다.
이 다이얼로그 안에서 새 프로젝트 생성용 입력 필드와 Import 버튼을 분리해 제공합니다.

프로젝트 목록의 상태 표시는 별(Current), 체크(Selected), 휴지통(Delete) 아이콘으로 정리되어 있고,
카드와 다이얼로그 버튼은 에디터 전반에서 쓰는 아이콘 스타일과 맞춘 `icon + label` 조합으로 통일되어 있습니다.

### 3.4 버전 표시

`version.json`은 앱 버전 표시와 릴리즈 기준의 단일 소스입니다.

저장 파일과 프로젝트 메타에는 `savedVersion`이 함께 기록됩니다.

- 값이 있으면 해당 버전을 표시
- 값이 없으면 구버전 데이터로 간주하고 `old` 표시

### 3.5 테마 확장 구조

테마 파일은 색상, 웹 가이드, 폰트 외에 `glass` 섹션을 가질 수 있습니다.

- `backgroundColor`
- `backgroundAlpha`
- `backgroundBlur`
- `backgroundSaturation`
- `refraction`
- `depth`

프런트에서는 `src/features/theme.js`가 이 구조를 정규화해
구버전 테마에도 기본 `glass` 값을 주입합니다.

정규화된 glass 값은 `src/styles/base.css`의 `--glass-*` CSS 변수로 연결됩니다.
이 구조를 기준으로 이후 에디터 카드, 모달, HTML 가이드까지 같은 glass 토큰 체계를 공유합니다.

현재 에디터 화면에서는 `src/styles/layout.css`가 배경 그라데이션과 헤더/Navigator 쪽 glass shell을,
`src/styles/editor.css`가 슬라이드 카드, 편집 패널, 업로드 박스 같은 본문 shell을 담당합니다.
입력 필드는 완전한 glass가 아니라, shell 안에 놓이는 읽기 중심의 solid surface로 유지합니다.

테마 모달에서는 `Glass Surface` 섹션을 통해 아래 값을 직접 조정할 수 있습니다.

- `backgroundColor`
- `backgroundAlpha`
- `backgroundBlur`
- `backgroundSaturation`
- `refraction`
- `depth`

이 입력값은 live preview로 즉시 반영되고,
저장 시 `.slidetheme`의 `glass` 섹션에 함께 기록됩니다.

HTML 가이드 쪽은 `src/features/export-enhancements.js`가 현재 활성 theme의 `glass` 토큰을 읽어
body 배경, 헤더, TOC aside, 본문 카드, 이미지 wrapper에 반영합니다.
가이드는 에디터보다 읽기 중심이므로, 동일한 토큰을 쓰더라도 본문 text 영역은 더 짙은 readable surface로 분리합니다.

## 4. 프로젝트 저장 구조

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

### 4.1 `slide_data.json`

핵심 편집 데이터입니다.

- `savedVersion`
- `settings`
- `slides`

`settings.branding.projectName`은 현재 프로젝트 저장 이름과 항상 같은 값으로 유지됩니다.

### 4.2 `meta.json`

목록 렌더링용 요약 메타데이터입니다.

- 프로젝트 이름
- 프로젝트 ID
- 슬라이드 수
- 생성/수정 시각
- `savedVersion`

### 4.3 `image_data/index.json`

이미지 자산 메타데이터 저장소입니다.

- 자산 ID
- 상태
  - `queued`
  - `converting`
  - `ready`
  - `failed`
- 원본 경로
- WebP 경로
- MIME 타입
- 시각 정보

## 5. 이미지 파이프라인

### 5.1 신규 업로드

1. 이미지 파일 업로드
2. 원본을 `originals/`에 저장
3. 상태를 `queued` 또는 `converting`으로 기록
4. `sharp`로 WebP 변환
5. 완료 후 `converted/`에 저장
6. 프런트가 상태 API polling으로 자동 갱신

### 5.2 편집기 표시 방식

- 변환 중에는 이미지 영역에 상태 UI를 표시
- 완료 후 WebP 이미지를 자동 반영
- lazy 로딩 시 `loading="lazy"`와 `decoding="async"` 사용

### 5.3 구버전 데이터 backfill

구버전 JSON이나 예전 프로젝트를 열면 다음 흐름으로 처리합니다.

1. 프로젝트와 슬라이드는 먼저 표시
2. 이미지는 모두 `변환 중` 상태로 표시
3. 이미지를 하나씩 순차적으로 WebP 변환
4. 완료 후 알림 표시
5. 서버 프로젝트는 변환 결과를 다시 저장해 다음부터 재변환하지 않음

## 6. 출력 구조

### 6.1 서버 저장

- 현재 프로젝트 저장은 `/api/projects/:projectId` 계열 API로 수행합니다.
- 저장 시 `savedVersion`을 함께 기록합니다.

### 6.2 JSON 백업

- portable JSON 형식으로 다운로드합니다.
- 파일명은 `프로젝트명_data_YYMMDDhhmmss.json`
- 필요 시 이미지를 인라인 데이터로 포함합니다.

### 6.3 HTML 가이드

HTML 가이드는 다음 두 경로를 지원합니다.

- `Guide`
  - 서버에 저장한 HTML을 새 창에서 미리보기
- `HTML`
  - 현재 프로젝트명 기준 파일명으로 다운로드

가이드 구조는 다음 특성을 가집니다.

- HTML5 시맨틱 구조
- 가이드 전용 Navigator
- 현재 위치 하이라이트
- 이미지 클릭 확대
- WebP 우선 + fallback 처리
- portable 다운로드 시 이미지 인라인 가능

현재 릴리즈 기준으로는 PPTX 출력 경로가 제거되어, HTML 가이드가 유일한 문서 출력 흐름입니다.

## 7. 서버 구조

`scripts/server.js`는 다음을 담당합니다.

- 정적 파일 서빙
- 앱 상태 저장/로드
- 프로젝트 목록/생성/로드/이름 변경/삭제
- 프로젝트별 이미지 업로드
- 이미지 상태 조회
- WebP 변환 실행
- 테마 목록/저장/로드
- HTML 가이드 저장

핵심 구성 요소는 아래와 같습니다.

- `express`
- `sharp`
- 파일 시스템 기반 JSON 저장소

데이터베이스 없이 프로젝트 디렉터리와 메타 JSON을 저장소로 사용하는 구조입니다.

## 8. 배포 구조

### 8.1 Docker

기본 배포는 Docker 이미지 기준입니다.

- 이미지: `parkingplace/slide-editor:<version>` 또는 `latest`
- 포트: `8000`
- 볼륨:
  - `data -> /app/data`
  - `exports -> /app/exports`

### 8.2 원격 서버

원격 서버에서는 Git 저장소를 기준으로 업데이트하고, Docker Compose로 최신 이미지를 실행합니다.

배포 후에는 다음 정리를 수행합니다.

- 사용하지 않는 테스트 컨테이너 제거
- dangling 이미지 제거
- 필요 없는 구버전 이미지 정리

## 9. 유지보수 포인트

### 9.1 반드시 함께 갱신할 문서

- `README.md`
- `docs/CONTRIBUTING.md`
- `docs/slide_editor_architecture.md`
- `docs/changelog/unreleased.md`
- 릴리즈 노트

### 9.2 버전 연동 대상

- `version.json`
- changelog
- Git tag
- Docker tag
- `savedVersion`

### 9.3 영향 범위가 큰 변경 지점

- 프로젝트 저장 구조
- 이미지 자산 경로
- WebP 파이프라인
- HTML 가이드 생성 구조
- Navigator/outline 로직
- HTML5 `dialog`/폼 구조

이 영역은 프런트엔드 UI, 저장 데이터, 서버 API, export 결과물이 동시에 영향을 받기 쉬우므로 통합 검증이 필요합니다.

## 10. 현재 구조 요약

현재 `Slide Editor`는 다음처럼 이해하면 가장 정확합니다.

1. 기능별 모듈 구조를 갖는 브라우저 기반 슬라이드 편집기
2. 파일 시스템 기반 프로젝트 저장소와 이미지 변환 서버를 갖는 경량 문서 플랫폼
3. HTML 가이드 중심 출력, 프로젝트 단위 저장, 비동기 이미지 최적화, HTML5 강화 UI를 포함한 운영 구조
