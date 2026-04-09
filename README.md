# Slide Editor

[![Version](https://img.shields.io/badge/version-v0.11.0-blue?style=for-the-badge)](#)
[![Docker](https://img.shields.io/badge/docker-supported-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](#)
[![Powered by Codex](https://img.shields.io/badge/powered%20by-Codex-111827?style=for-the-badge)](#)

브라우저에서 슬라이드를 편집하고, 프로젝트 단위로 저장하며, 같은 데이터로 HTML 가이드를 미리보기와 다운로드까지 처리하는 경량 문서 제작 도구입니다.

현재 버전은 `nvidia_light` 기본 테마, 프로젝트별 저장 구조, 비동기 WebP 이미지 변환, Viewer 기반 HTML 출력, glass theme 편집 UI를 중심으로 동작합니다.

## 주요 기능

- 프로젝트 생성, 열기, 다른 이름으로 저장, 이름 변경, 삭제
- 프로젝트 매니저 안에서 브랜딩, JSON 임포트, JSON 백업 관리
- 슬라이드 추가, 수정, 삭제
- 이미지 업로드 후 비동기 WebP 변환
- 구버전 데이터 로드 시 순차 WebP 백필 변환
- 좌측 Navigator 기반 슬라이드 탐색
- Viewer 새 창 보기 및 HTML 다운로드
- 테마 파일(`.slidetheme`) 불러오기/저장
- `Glass Surface`와 `noiseOpacity`를 포함한 glass 테마 편집
- Docker 기반 배포 및 Node 로컬 서버 실행

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

보조 실행 스크립트도 사용할 수 있습니다.

- Windows: `docker-compose-up.bat`
- Linux/macOS: `chmod +x docker-compose-up.sh && ./docker-compose-up.sh`

### 대체 방식: Node 서버 직접 실행

```bash
npm install
node scripts/server.js
```

Windows에서는 `local-server-up.bat`로 바로 실행할 수 있습니다.

## 데이터와 볼륨

Docker 기본 마운트 경로는 아래와 같습니다.

- `./data -> /app/data`
- `./exports -> /app/exports`

주요 데이터는 아래처럼 저장됩니다.

- `data/projects/<projectId>/slide_data.json`
- `data/projects/<projectId>/meta.json`
- `data/projects/<projectId>/image_data/`
- `data/themes/`
- `exports/`

## 프로젝트 저장 구조

각 프로젝트는 독립 디렉터리로 저장됩니다.

```text
data/projects/<projectId>/
  meta.json
  slide_data.json
  image_data/
    index.json
    originals/
    converted/
```

`slide_data.json`에는 편집 데이터와 `savedVersion`이 함께 저장되며, 프로젝트 매니저에서 해당 저장 버전을 표시합니다. 저장 버전 정보가 없는 구버전 데이터는 `old`로 표시됩니다.

## 이미지 처리 방식

- 새 이미지 업로드 시 서버로 전송한 뒤 WebP로 비동기 변환합니다.
- 변환 중에는 슬라이드 이미지 영역에 상태 UI가 표시됩니다.
- 변환이 끝나면 자동으로 WebP 이미지가 반영됩니다.
- 구버전 JSON이나 예전 프로젝트를 불러오면 먼저 프로젝트를 표시한 뒤, 이미지를 하나씩 WebP로 백필 변환합니다.
- 모든 백필 변환이 끝나면 완료 알림을 표시합니다.

## 가이드 출력

현재 출력 경로는 HTML 가이드 중심입니다.

- `Viewer`: 서버에 저장한 Slide Viewer HTML을 새 창에서 미리보기
- `HTML`: 현재 프로젝트명 기준 파일명으로 가이드 다운로드
- `Backup JSON`: 현재 프로젝트 데이터를 portable JSON으로 다운로드

가이드 HTML은 다음 특성을 가집니다.

- HTML5 시맨틱 구조 사용
- Viewer 전용 Navigator 제공
- 현재 위치 하이라이트
- 이미지 클릭 확대
- WebP 우선 사용, 필요 시 fallback 적용
- 단일 HTML 다운로드 시 이미지, CSS, JS를 한 파일 안에 포함
- 단일 HTML 다운로드 시 외부 폰트 링크는 유지하고, 오프라인에서는 시스템 폰트로 fallback
- 단일 HTML 다운로드 시 마크다운/신텍스 파서 라이브러리는 포함하지 않고 결과 HTML만 저장

## Docker 이미지

기본 배포 이미지는 아래 태그를 사용합니다.

```text
parkingplace/slide-editor:latest
```

버전 고정이 필요하면 릴리즈 태그를 사용합니다.

```text
parkingplace/slide-editor:v0.11.0
```

## 프로젝트 구조

```text
Slide-Editor/
├─ src/                     # 프런트엔드 코드
├─ src/core/                # 전역 상태와 공통 유틸
├─ src/features/            # 기능별 모듈
├─ src/styles/              # 스타일 모듈
├─ scripts/                 # Node 서버
├─ data/                    # 프로젝트/테마 데이터
├─ exports/                 # HTML 가이드 출력물
├─ docs/                    # changelog, 규칙, 구조 문서
├─ plans/                   # 작업 계획 문서
├─ SlideEditor.html         # 메인 HTML 엔트리
├─ Dockerfile
├─ docker-compose.yml
├─ docker-compose-up.bat
├─ docker-compose-up.sh
├─ local-server-up.bat
└─ version.json
```

## 기술 스택

- Frontend: HTML, CSS, Vanilla JavaScript
- Server: Node.js, Express
- Image pipeline: Sharp
- Parsing/UI: Marked.js, Highlight.js
- Runtime: Docker, Docker Compose

## 문서

- changelog 진입점: [CHANGELOG.md](./CHANGELOG.md)
- 개발/릴리즈 규칙: [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)
- 구조 분석 문서: [docs/slide_editor_architecture.md](./docs/slide_editor_architecture.md)

## 릴리즈 원칙

- `version.json`, Git 태그, Docker 태그는 같은 버전을 사용합니다.
- 릴리즈 전에는 `docs/changelog/unreleased.md`를 정리하고 릴리즈 노트를 생성합니다.
- 릴리즈 후에는 Docker Hub 이미지와 원격 서버 배포를 같은 버전 기준으로 맞춥니다.
