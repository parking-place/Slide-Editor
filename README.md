# 🎨 Slide Editor

[![Powered by Antigravity](https://img.shields.io/badge/Powered%20by-Antigravity-blueviolet?style=for-the-badge)](https://antigravity.google)
[![Powered by Codex](https://img.shields.io/badge/Powered%20by-Codex-111111?style=for-the-badge)](#)
[![Version](https://img.shields.io/badge/version-v0.7.0c-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](#)

> **이 프로젝트의 설계, 구현, 리브랜딩, 문서화에는 Antigravity와 Codex를 포함한 AI 코딩 어시스턴트가 적극적으로 활용되었습니다.**

**Slide Editor**는 브라우저에서 동작하는 슬라이드 및 웹 가이드 제작 도구입니다. 하나의 원본 문서를 기반으로 **PPTX 파일**과 **인터랙티브 HTML 웹 가이드**를 함께 생성할 수 있으며, 테마 시스템과 브랜딩 설정, 이미지 포함 슬라이드 편집, 서버 저장 기능까지 포함합니다.

---

## ✨ 주요 기능

- **멀티 포맷 내보내기**: 슬라이드 데이터를 PPTX와 단일 HTML 웹 가이드로 내보냅니다.
- **테마 및 브랜딩 관리**: `.slidetheme` 파일 기반 테마와 프로젝트별 브랜딩 텍스트를 분리 관리합니다.
- **동적 TOC 가이드**: 웹 가이드에 스크롤 반응형 TOC 네비게이터를 포함합니다.
- **개발 문서 친화 편집**: Markdown 유사 문법, 코드 블록 하이라이팅, 복사 버튼 등을 제공합니다.
- **이미지 데이터 분리 저장**: 서버 저장 시 이미지는 `/data/image_data`에 별도 파일로 저장해 `slide_data.json`의 부하를 줄입니다.
- **구버전 데이터 호환**: 예전 배열형 JSON 및 인라인 base64 이미지 데이터도 계속 불러올 수 있습니다.

---

## 🚀 시작하기

### 권장 방식: Docker Compose

1. 저장소를 클론합니다.

```bash
git clone https://github.com/parking-place/Slide-Editor.git
cd Slide-Editor
```

2. 운영체제에 맞는 실행 스크립트를 사용합니다.

- Windows: `docker-compose-up.bat`
- Linux/macOS: `chmod +x docker-compose-up.sh && ./docker-compose-up.sh`

3. 또는 직접 실행할 수도 있습니다.

```bash
docker compose pull
docker compose up -d
```

4. 브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:8000/SlideEditor.html
```

### 데이터 영속성

- `./data -> /app/data`
- `./exports -> /app/exports`

`slide_data.json`, 테마 파일, 분리된 이미지 파일(`data/image_data`)은 호스트 볼륨에 유지됩니다.

### Docker Hub 이미지

기본 배포 이미지는 아래 태그를 사용합니다.

```text
parkingplace/slide-editor:latest
```

버전 고정이 필요하면 릴리즈 태그(`parkingplace/slide-editor:v0.7.0b` 등)를 사용할 수 있습니다.

---

## 🧰 대체 실행 방식

현재 기본 실행 경로는 Docker 기반입니다. 다만 참고용 또는 레거시 호환 용도로 아래 스크립트들이 남아 있습니다.

- `scripts/server.js`: Node.js/Express 기반 크로스플랫폼 서버
- `scripts/local_server.ps1`: 초기 Windows PowerShell 서버

직접 Node 서버를 실행하려면 의존성을 설치한 뒤 실행합니다.

```bash
npm install
node scripts/server.js
```

---

## 📂 프로젝트 구조

```text
Slide-Editor/
├─ src/                    # 프론트엔드 핵심 코드 (app.js, style.css)
├─ scripts/                # 서버/유틸리티 스크립트
├─ data/
│  ├─ slide_data.json      # 기본 슬라이드 데이터
│  ├─ themes/              # .slidetheme 파일 저장소
│  └─ image_data/          # 서버 저장 시 분리되는 이미지 파일
├─ exports/                # 생성된 HTML 가이드 저장 위치
├─ docs/                   # 기여 규칙, 버전 이력, 분석 문서
├─ SlideEditor.html        # 메인 HTML 엔트리
├─ Dockerfile              # 배포용 이미지 빌드 정의
├─ docker-compose.yml      # 컨테이너 실행 정의
├─ docker-compose-up.bat   # Windows용 실행 스크립트
└─ docker-compose-up.sh    # Linux/macOS용 실행 스크립트
```

---

## 🛠 기술 스택

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), CSS3
- **Runtime Server**: Node.js + Express
- **Container**: Docker, Docker Compose
- **Libraries**: PptxGenJS, Marked.js, Highlight.js, Font Awesome

---

## 🤝 기여하기

이 프로젝트는 `Github Flow`와 문서화 중심 워크플로우를 따릅니다.

- 모든 작업은 `main`에서 분기한 전용 브랜치에서 진행합니다.
- 커밋 전 `docs/VERSION_HISTORY.md`의 언릴리즈 섹션을 먼저 갱신합니다.
- 릴리즈 및 hotfix 버전은 `docs/CONTRIBUTING.md`의 `vX1.X2.X3(a)` 규칙을 따릅니다.
- 공식 릴리즈 시 Git 태그와 Docker 이미지 태그를 동일하게 맞춥니다.

자세한 규칙은 [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)를 참고해 주세요.
