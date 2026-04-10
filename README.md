# Slide Editor

[![Version](https://img.shields.io/badge/version-v0.12.0-blue?style=for-the-badge)](#)
[![Docker](https://img.shields.io/badge/docker-supported-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](#)
[![Powered by Codex](https://img.shields.io/badge/powered%20by-Codex-111827?style=for-the-badge)](#)

브라우저에서 슬라이드를 편집하고 프로젝트 단위로 저장한 뒤, 같은 데이터로 Viewer 미리보기와 HTML 다운로드까지 처리하는 문서 제작 도구입니다.

현재 버전은 프로젝트별 저장 구조, 비동기 WebP 이미지 변환, Viewer 중심 HTML 출력, glass 기반 UI, 멀티아키텍처 Docker 릴리즈 흐름을 기준으로 동작합니다.

## 주요 기능

- 프로젝트 생성, 열기, 복제, 이름 변경, 삭제
- 프로젝트 매니저에서 백업 JSON export / JSON import
- 슬라이드 추가, 수정, 삭제
- 이미지 업로드 시 비동기 WebP 변환
- 구버전 데이터 로드 시 순차 WebP backfill
- Navigator 기반 슬라이드 탐색
- Viewer 새 창 미리보기
- 프로젝트명 기준 HTML 다운로드
- `.slidetheme` 기반 테마 편집
- Docker 기반 배포

## 빠른 시작

### 권장 방식: Docker Compose

```bash
git clone https://github.com/parking-place/Slide-Editor.git
cd Slide-Editor
docker compose pull
docker compose up -d
```

브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:8000/SlideEditor.html
```

보조 실행 스크립트:

- Windows: `docker-compose-up.bat`
- Linux/macOS: `chmod +x docker-compose-up.sh && ./docker-compose-up.sh`

### 대체 방식: Node 서버 직접 실행

```bash
npm install
node scripts/server.js
```

주의:

- Windows용 `local-server-up.bat`는 Git에 포함하지 않는 로컬 테스트 전용 파일입니다.

## Docker 이미지

기본 이미지:

```text
parkingplace/slide-editor:latest
```

버전 고정:

```text
parkingplace/slide-editor:v0.12.0
```

멀티아키텍처 지원:

- `linux/amd64`
- `linux/arm64`

즉, 일반 x86 리눅스 서버와 Apple Silicon Mac의 Docker Desktop에서 같은 태그를 그대로 사용할 수 있습니다.

## 데이터 구조

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

주요 경로:

- `data/projects/`
- `data/themes/`
- `exports/`

Docker 기본 마운트:

- `./data -> /app/data`
- `./exports -> /app/exports`

## 이미지 처리 방식

- 새 이미지 업로드 시 서버로 전송 후 WebP로 비동기 변환합니다.
- 변환 중에는 슬라이드 이미지 영역에 상태 UI를 표시합니다.
- 변환 완료 후 자동으로 WebP 이미지가 반영됩니다.
- 구버전 JSON 또는 이전 프로젝트를 열면 이미지들을 순차적으로 WebP로 backfill 합니다.

## Viewer / HTML 출력

- `Viewer`: 서버에 HTML을 저장한 뒤 새 창으로 미리보기
- `HTML`: 현재 프로젝트명 기준으로 가이드 HTML 다운로드
- `Backup JSON`: portable JSON 백업 다운로드

HTML 출력 특성:

- HTML5 시맨틱 구조 사용
- Navigator 포함
- 현재 위치 하이라이트
- 이미지 확대
- WebP 우선 사용
- 다운로드용 HTML은 self-contained 형태 유지

## 릴리즈

- `version.json`, Git 태그, Docker 태그는 같은 버전을 사용합니다.
- 릴리즈 전에는 `docs/changelog/unreleased.md`를 정리하고 릴리즈 노트를 생성합니다.
- 릴리즈 후에는 Docker Hub 이미지와 원격 서버 배포를 같은 버전 기준으로 맞춥니다.
- 멀티아키텍처 릴리즈는 아래 스크립트로 수행할 수 있습니다.

```bash
./docker-multiarch-release.sh v0.12.0
```

```bat
docker-multiarch-release.bat v0.12.0
```

## 문서

- changelog 진입점: [CHANGELOG.md](./CHANGELOG.md)
- 개발/릴리즈 규칙: [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)
- 구조 문서: [docs/slide_editor_architecture.md](./docs/slide_editor_architecture.md)
