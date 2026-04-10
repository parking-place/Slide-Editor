# Slide Editor 구조 문서

이 문서는 현재 `Slide Editor`의 실행 구조, 저장 구조, 이미지 파이프라인, Viewer 출력 흐름, Docker 배포 구조를 빠르게 파악하기 위한 최신 문서입니다.

문서 기준 버전은 `version.json` 기준 `v0.12.0`입니다.

## 1. 개요

- 프런트엔드: 브라우저 기반 단일 페이지 편집기
- 서버: `scripts/server.js` 기반 Node.js / Express 서버
- 기본 실행: Docker Compose
- 대체 실행: `node scripts/server.js`
- 주요 산출물: Viewer 미리보기, HTML 다운로드, JSON 백업
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
├─ docs/
└─ plans/
```

## 3. 프런트엔드 구조

### 3.1 진입점

- `SlideEditor.html`
  - 공통 라이브러리와 `src` 하위 JS/CSS를 로드
  - 헤더 액션, Navigator, 미리보기, 모달 컨테이너 제공

- `src/app.js`
  - 부트스트랩 및 모듈 연결

### 3.2 상태 및 공통 로직

- `src/core/state.js`
  - 전역 상태
  - 현재 프로젝트 정보
  - 버전 정보
  - 공통 유틸
  - 초기 프로젝트 로드

### 3.3 기능 모듈

- `src/features/projects.js`
  - 프로젝트 목록
  - 열기 / 복제 / 저장 / 이름 변경 / 삭제
  - 프로젝트 매니저 UI

- `src/features/editor.js`
  - 슬라이드 추가 / 수정 / 삭제
  - 미리보기 렌더링
  - Navigator 데이터 생성

- `src/features/media.js`
  - 이미지 업로드
  - WebP 변환 상태 polling
  - 구버전 이미지 backfill

- `src/features/export.js`
  - JSON 백업 export / import
  - 프로젝트 저장

- `src/features/export-enhancements.js`
  - Viewer HTML 생성
  - HTML 다운로드
  - 이미지 fallback
  - 코드블록 스타일
  - Navigator / 이미지 확대

- `src/features/theme.js`
  - 테마 로드 / 저장
  - 브랜딩 UI 연동
  - glass 관련 CSS 변수 적용

- `src/features/html5-semantics.js`
  - HTML5 시맨틱 구조 보강

- `src/features/html5-forms.js`
  - `form`, `fieldset`, `details`, `output`, `progress` 기반 UI 보강

- `src/features/outline.js`
  - Viewer / HTML에 공통 outline 메타데이터 반영

### 3.4 스타일 구조

- `src/style.css`
  - 스타일 로더

- `src/styles/base.css`
  - 전역 변수, 리셋, 공통 토큰

- `src/styles/layout.css`
  - 헤더, 본문 레이아웃, Navigator

- `src/styles/editor.css`
  - 편집기와 슬라이드 카드

- `src/styles/modal.css`
  - 프로젝트/테마/확인 모달

- `src/styles/enhancements.css`
  - WebP 상태 UI, lazy 관련 보강, HTML5 보강 스타일

## 4. 저장 구조

프로젝트는 아래 구조로 저장됩니다.

```text
data/projects/<projectId>/
  meta.json
  slide_data.json
  image_data/
    index.json
    originals/
    converted/
```

### 4.1 `meta.json`

포함 정보:

- `id`
- `name`
- `createdAt`
- `updatedAt`
- `lastSavedAt`
- `slideCount`
- `savedVersion`

### 4.2 `slide_data.json`

포함 정보:

- `savedVersion`
- `lastSavedAt`
- `settings`
- `slides`

### 4.3 구버전 호환

- 예전 `data/slide_data.json`, `data/image_data/` 구조는 legacy 경로로 취급
- 필요 시 `default` 프로젝트로 마이그레이션
- 구버전 이미지 경로는 로드 후 WebP backfill 대상으로 처리

## 5. 이미지 파이프라인

### 5.1 새 이미지 업로드

1. 브라우저에서 이미지 선택
2. `/api/projects/:projectId/images/upload`로 전송
3. 서버가 원본 저장 후 WebP 변환 job 생성
4. 프런트는 상태 polling
5. 완료 시 `fileUrl` 기준 이미지 반영

### 5.2 구버전 이미지 backfill

1. 구버전 프로젝트 또는 JSON import 로드
2. 슬라이드는 먼저 표시
3. 이미지 영역은 `변환 중` 상태로 표시
4. 이미지를 하나씩 WebP로 변환
5. 완료 후 자동 저장 또는 상태 갱신

## 6. Viewer / HTML 출력 구조

현재 출력 구조는 Viewer 중심이다.

- `Viewer`
  - 서버에 HTML 저장
  - 새 창으로 `/exports/SlideEditor_Web_Guide.html` 열기

- `HTML`
  - portable HTML 다운로드
  - 프로젝트명 기준 파일명 사용

주요 특징:

- HTML5 시맨틱 구조
- Navigator 포함
- 현재 위치 active 표시
- 이미지 확대 오버레이
- 코드블록 디자인과 코드 색상 테마 연동
- 다운로드 HTML self-contained 유지

## 7. 서버 구조

`scripts/server.js`는 아래 역할을 가진다.

- 정적 파일 서빙
- 프로젝트 목록 / 상세 / 저장 / 삭제 API
- 현재 프로젝트 상태 API
- 테마 파일 API
- HTML 저장 API
- 이미지 업로드 / 상태 / 파일 API
- WebP 변환 queue 처리

## 8. Docker 구조

### 8.1 기본 배포

- 이미지: `parkingplace/slide-editor:<version>` 또는 `latest`
- Compose 기준 이미지 pull 후 실행
- 데이터와 exports는 bind mount 사용

### 8.2 멀티아키텍처 릴리즈

현재 릴리즈 이미지는 다음 플랫폼을 목표로 한다.

- `linux/amd64`
- `linux/arm64`

이를 위해 아래 스크립트를 사용한다.

- `docker-multiarch-release.bat`
- `docker-multiarch-release.sh`

기본 명령:

```text
docker buildx build --platform linux/amd64,linux/arm64 ... --push .
```

의미:

- x86 리눅스 서버와 Apple Silicon Mac에서 같은 Docker 태그 사용 가능

## 9. 문서 및 버전 관리

주요 문서:

- `CHANGELOG.md`
- `docs/changelog/unreleased.md`
- `docs/changelog/releases/*.md`
- `docs/CONTRIBUTING.md`
- `README.md`

버전 기준:

- `version.json`
- Git 태그
- Docker 태그

세 값은 항상 같은 버전을 사용한다.
