# Slide Editor

[![Version](https://img.shields.io/badge/version-v0.9.1-blue?style=for-the-badge)](#)
[![Docker](https://img.shields.io/badge/docker-supported-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](#)

브라우저에서 슬라이드를 편집하고, 같은 원본 데이터를 기준으로 PPTX와 HTML 가이드를 함께 만드는 편집 도구입니다.  
프로젝트 단위 저장, 테마/브랜딩 관리, 이미지 포함 슬라이드 편집, 웹 가이드 미리보기와 내보내기를 지원합니다.

## 주요 기능

- 프로젝트 생성, 열기, 다른 이름으로 저장, 이름 변경, 삭제
- 슬라이드 작성/수정, 이미지 업로드, 드래그앤드롭 이미지 업로드
- 테마 파일(`.slidetheme`) 불러오기/저장
- 브랜딩 정보 관리
- PPTX 내보내기
- HTML 가이드 미리보기 및 내보내기
- Docker 기반 실행 및 Node 서버 직접 실행 지원

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

운영체제별 보조 실행 스크립트도 사용할 수 있습니다.

- Windows: `docker-compose-up.bat`
- Linux/macOS: `chmod +x docker-compose-up.sh && ./docker-compose-up.sh`

### 대체 방식: Node 서버 직접 실행

```bash
npm install
node scripts/server.js
```

Node 직접 실행도 가능하지만, 기본 운영 기준은 Docker Compose입니다.

## 데이터와 저장 경로

- `./data -> /app/data`
- `./exports -> /app/exports`

주요 저장 데이터:

- 프로젝트 데이터
- 테마 파일
- 분리 저장된 이미지 파일
- HTML 내보내기 결과물

## Docker 이미지

기본 배포 이미지는 아래 태그를 사용합니다.

```text
parkingplace/slide-editor:latest
```

버전 고정이 필요하면 릴리즈 태그(`parkingplace/slide-editor:v0.9.1` 등)를 사용할 수 있습니다.

## 프로젝트 구조

```text
Slide-Editor/
├─ src/                     # 프런트엔드 코드
├─ scripts/                 # Node 서버 및 보조 스크립트
├─ data/                    # 프로젝트/테마/이미지 데이터
├─ exports/                 # HTML 내보내기 결과물
├─ docs/                    # changelog, 운영 규칙, 아키텍처 문서
├─ plans/                   # 작업 계획 문서
├─ SlideEditor.html         # 메인 HTML 엔트리
├─ Dockerfile               # Docker 이미지 빌드 정의
├─ docker-compose.yml       # Docker Compose 실행 정의
├─ docker-compose-up.bat    # Windows용 Docker 실행 스크립트
└─ docker-compose-up.sh     # Linux/macOS용 Docker 실행 스크립트
```

## 기술 스택

- Frontend: HTML, CSS, Vanilla JavaScript
- Server: Node.js, Express
- Export: PptxGenJS, Marked.js, Highlight.js
- Runtime: Docker, Docker Compose

## 문서

- changelog 진입점: [CHANGELOG.md](./CHANGELOG.md)
- 개발/릴리즈 규칙: [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)
- 아키텍처/운영 개요: [docs/slide_editor_architecture.md](./docs/slide_editor_architecture.md)

## 릴리즈 원칙

- `version.json`, Git 태그, Docker 태그는 같은 버전을 사용합니다.
- changelog는 hybrid 구조로 관리합니다.
- changelog 설명은 항상 한국어로 작성합니다.

