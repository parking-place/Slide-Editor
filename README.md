# 🎨 Slide Editor

[![Powered by Antigravity](https://img.shields.io/badge/Powered%20by-Antigravity-blueviolet?style=for-the-badge)](https://antigravity.google)
[![Version](https://img.shields.io/badge/version-v0.6.0c-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](#)

> **"이 프로젝트의 모든 코드와 리브랜딩, 아키텍처 설계는 Google DeepMind 기반의 최첨단 AI 코딩 어시스턴트인 [Antigravity](https://antigravity.google)를 통해 설계되고 제작되었습니다."**

**Slide Editor**는 웹 브라우저 환경에서 동작하는 전문적인 슬라이드 및 웹 가이드 제작 도구입니다. 복잡한 설치 없이 로컬 웹 서버만으로 즉시 구동되며, 사용자가 작성한 문서를 **고품질 PPTX 파일**과 **인터랙티브 HTML 웹 가이드** 두 가지 포맷으로 동시에 내보낼 수 있는 강력한 기능을 제공합니다.

---

## ✨ 주요 기능 (Key Features)

* **멀티 포맷 내보내기**: 작성된 하나의 문서를 파워포인트(`.pptx`)와 단일 HTML 웹 가이드로 원클릭 자동 생성.
* **강력한 테마 시스템**: 🎨 내장된 `커스텀 테마 빌더`로 28개 이상의 다크/라이트 기업 브랜드 테마 제공 및 자유로운 컬러·폰트 수정 가능 (`.slidetheme` 파일 관리).
* **동적 TOC (웹 가이드)**: 좌측에 스크롤에 반응하는 목차형 네비게이터를 제공하며, 테마 옵션과 연동된 완벽한 반응형 뷰 지원.
* **개발자 친화적 에디터**: Markdown 유사 문법, 코드 블록 구문 강조(`highlight.js`), 클릭하여 복사 기능 등 기술 문서 작성에 최적화된 편의 기능 탑재.
* **자동 문서 호환**: 구버전 데이터 구조(배열)를 신규 데이터 포맷(객체 래퍼)으로 원활하게 자동 호환 및 마이그레이션.

---

## 🚀 시작하기 (Getting Started)

이 프로젝트는 브라우저 보안 정책 상 로컬 파일을 읽고 쓰기 위해 웹 서버 구동이 필요합니다.

### 1단계: 프로젝트 클론
```bash
git clone https://github.com/parking-place/Slide-Editor.git
cd Slide-Editor
```

### 2단계: 로컬 서버 실행
프로젝트 루트 폴더에 포함된 구동 스크립트를 실행하여 로컬 서버를 올립니다.

* **Windows의 경우**: `에디터_웹서버_실행.bat` 파일을 더블 클릭하여 실행합니다. 
* **수동 실행 필요 시 (Terminal)**:
  ```powershell
  # 파워쉘에서 실행 권한이 필요할 수 있습니다
  ./local_server.ps1
  ```

### 3단계: 시작
스크립트가 정상적으로 구동되면 브라우저에 배너와 함께 서버 주소가 출력되며, 보통 `http://localhost:8000/SlideEditor.html` 로 자동 진입하여 바로 에디터를 사용할 수 있습니다.

---

## 📂 프로젝트 구조 (Directory Structure)

```text
📦 Slide-Editor
┣ 📂 src/             # 에디터 구동을 위한 코어 소스코드 (app.js, style.css)
┣ 📂 data/            # 유저 작성 콘텐츠(slide_data.json) 및 테마 설정(.slidetheme) 저장소
┣ 📂 docs/            # 기여 가이드 및 릴리즈 버전 히스토리 (VERSION_HISTORY.md)
┣ 📂 exports/         # 다운로드된 pptx 및 html 가이드 결과물 보관 장소
┣ 📂 scripts/         # 빌드, 데이터 분할 등의 보조용 유틸리티/스크립트 저장소
┣ 📜 SlideEditor.html # 에디터 메인 파일 (HTML UI 및 서드파티 라이브러리 로드)
┣ 📜 local_server.ps1 # 자동 API 및 로컬 웹 서버 실행 구동 엔진
┗ 📜 에디터_웹서버_실행.bat # 사용자 친화적 1-Click 실행 배치 파일
```

---

## 🤝 기여하기 (Contributing)

이 프로젝트는 **Github Flow** 워크플로우를 엄격히 준수합니다. 기여하고자 하신다면, 아래 규정을 참고해주세요.
1. 모든 기능 추가 및 버그 수정은 `main` 브랜치에서 분기한 새로운 피처/버그 브랜치 (`feat/xxx`, `fix/xxx`)에서 진행되어야 합니다.
2. 커밋 전 반드시 `docs/VERSION_HISTORY.md`의 `언릴리즈` 섹션을 최신화해야 합니다.
3. 머지 시에는 Fast-forward가 아닌 명시적 머지(`--no-ff`)를 사용하여 히스토리를 유지합니다.

자세한 Git 정책 및 변경 승인 절차는 [CONTRIBUTING.md](./docs/CONTRIBUTING.md) 기여 가이드라인을 확인해 주십시오.

---

## 🛠️ 기술 스택 (Tech Stack)

* **언어**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3
* **서버**: Python 3 (http.server), PowerShell
* **서드파티**: [PptxGenJS](https://gitbrent.github.io/PptxGenJS/), [Marked.js](https://marked.js.org/), [Highlight.js](https://highlightjs.org/)
