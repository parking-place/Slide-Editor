# 버전 관리 기록 (Version History)

이 문서는 HPE VME Editor 프로젝트의 버전 업데이트 내역을 기록하는 문서입니다. 이 프로젝트는 **Github Flow** 전략(main 브랜치를 기준으로 기능 개발 브랜치를 파생하고 병합하는 형태)을 따릅니다.

---

# 🚀 릴리즈 (Released - main 브랜치)
*메인 리포지토리에 병합(Merge)되어 공식적으로 배포된 확실하고 안정적인 버전 내역입니다.*

## [v0.5.5b] - 2026-04-07
### Fixed
- **웹 가이드 및 에디터 네비게이터 테마 연동 오류 수정**: TOC(목차) 네비게이터의 활성화 색상 및 호버 배경색이 테마 색상이 아닌 하드코딩된 특정 색상(`rgba(0, 230, 118)` 등)으로 고정되어 있던 문제 수정.
- 에디터 CSS(`style.css`)에 `--hpe-green-alpha` 변수를 추가하여 반투명 배경색 동적 지원 연동 완비.
- 웹 가이드(`app.js`)의 정적 HTML 생성기에도 하드코딩된 RGB 코드 대신 `${accentColor}` 및 `${darkAccent}` 반영.
- 웹 가이드 본문 내의 Table of Contents(목차) HTML 생성 시 하드코딩된 테마색상 교체 및 연동 완료.

## [v0.5.5a] - 2026-04-07
### Added
- **테마 마크다운 코드 색상 분리**: 테마의 기본 강조색(`accent`)과 별도로 인라인 코드 블록, 마크다운 코드 래퍼 라벨/테두리 색상을 별도 지정할 수 있는 `codeColor` 변수 도입.
- **다크/라이트 모드 테마 종속화**: 에디터 상단의 모드 전환 토글 버튼을 제거하고, 테마 관리의 `isDarkMode` 속성으로 통합. 테마에 따라 다크/라이트 모드가 자동으로 전환되도록 구조 변경.
- **테마 UI 항목 추가**: 색상 편집 모달 라인업에 `코드 텍스트색 (Code Color)` 항목과 `다크 모드 기본 렌더링` 체크박스를 추가 및 실시간 프리뷰 기능 적용.
- **기본 테마 업데이트**: `hpe_default`, `hpe_light`, `hpe_blue` `.slidetheme` 설정 파일에 `codeColor` 및 `isDarkMode` 항목 기본값 업데이트 적용 완료.

## [v0.5.5] - 2026-04-07
### Added
- **커스텀 테마 빌더**: 색상 팔레트(에디터/PPTX/웹가이드)와 폰트를 독립된 `.slidetheme` 파일로 정의하고 불러올 수 있는 테마 관리 시스템 구현.
- **`.slidetheme` 파일 포맷**: `colors`, `pptx`, `webGuide`, `fonts` 4개 섹션으로 구성된 JSON 기반 테마 파일 규격 정의.
- **기본 테마 3종 제공**: `hpe_default` (다크 그린), `hpe_light` (라이트), `hpe_blue` (다크 블루) `.slidetheme` 파일 생성 (`data/themes/`).
- **테마 관리 모달 UI**: 상단 헤더의 `🎨 테마 관리` 버튼으로 열리는 2열 모달 (좌: 목록, 우: 편집기). 색상 픽커(`input[type=color]`) + HEX 텍스트 입력 양방향 실시간 동기화.
- **테마 서버 API 3종**: `local_server.ps1`에 `/api/themes` GET(목록), `/api/themes/{name}` GET(파일), POST(저장) 엔드포인트 추가.
- **테마 내보내기/불러오기**: `.slidetheme` 파일 브라우저 다운로드 및 파일 선택 불러오기 지원.

### Changed
- **`vme_data.json` 구조 변경**: 슬라이드 배열(`[]`)에서 `{ settings, slides }` 래퍼 객체로 확장. `settings.activeTheme`(선택된 테마명)과 `settings.branding`(프로젝트명·부제·footer) 영역 추가.
- **구버전 데이터 자동 호환**: `parseLoadedData()` 함수 도입. 구버전 배열 형식 → 슬라이드만 교체(기존 settings 유지), 신버전 래퍼 구조 → 완전 복원(Deep merge).
- **`generateHTMLContent()` 파라미터화**: 웹 가이드 출력물의 헤더 배경, 강조색, footer 문구, 제목/부제를 `activeTheme.webGuide`와 `projectSettings.branding`으로 동적 주입.
- **`exportToPPTX()` 파라미터화**: 슬라이드 마스터 배경, 강조색, 폰트, footer 문구, 표지 텍스트를 `activeTheme.pptx`와 `projectSettings.branding`으로 동적 주입.
- **브랜딩 정보 데이터 분리**: 프로젝트명·부제·footer 문구는 `.slidetheme` 파일이 아닌 `vme_data.json`(settings.branding)에 저장하여 프로젝트별 독립 관리.
- **헤더 버튼 UI 소형화**: 소형 버튼 시스템(`.btn-hdr`) 도입. 패딩 축소(5px 11px), 높이 30px, 12px 폰트. 색상 variant(`--amber`, `--indigo`, `--purple`, `--blue`, `--green`) 클래스 체계화. 구분선(`.hdr-divider`) 추가.
- **브랜딩 모달 분리**: 테마 모달에서 브랜딩 섹션 완전 제거, 독립된 `브랜딩` 버튼 및 전용 모달 UI로 분리. 프로젝트명·부제·Footer 세 필드와 적용 대상 힌트 제공.
- **웹 가이드 다크/라이트 모드 동기화**: `가이드 보기` / `HTML 다운로드` 실행 시점의 에디터 모드(`light-mode` 클래스 유무)를 감지하여 웹 가이드 `<body>` 클래스에 동일하게 적용.

## [v0.5.4] - 2026-04-07
### Added
- **코드 블록 구문 강조 (Syntax Highlighting)**: `highlight.js 11.10.0` + `atom-one-dark` 테마를 도입하여 `bash`, `powershell`, `sql`, `python` 등 언어별 문법 색상 강조 적용.
- **원클릭 복사 버튼**: 코드 블록 상단에 언어 레이블과 함께 '복사' 버튼 배치. 클릭 시 "복사됨!" 2초 피드백 후 원복. `navigator.clipboard` API + `execCommand` fallback 지원.
- **코드 블록 래퍼 UI**: 언어명·복사 버튼을 포함한 헤더 바와 코드 영역으로 구성된 `.code-block-wrapper` 컴포넌트 적용. 다크/라이트 모드 모두 대응.
- **웹 가이드 – 테마 전환 플로팅 버튼**: 헤더 인라인 버튼 → 우측 하단 원형 플로팅 버튼(bottom: 90px)으로 변경. 스크롤 위치와 무관하게 항상 접근 가능.
- **웹 가이드 – 동적 TOC 네비게이터**: 좌측 고정 사이드바(`guide-toc`) 추가. 대제목/중제목/소제목 계층 트리 렌더링, IntersectionObserver 스크롤 하이라이팅.
- **웹 가이드 – 다크모드 기본 적용**: `<body class="dark-mode">` 로 변경하여 최초 로드 시 다크 테마로 표시.

### Changed
- **HTML 내보내기 동기화**: 내보낸 웹 가이드에도 hljs CDN, 코드 블록 UI, 복사 버튼, TOC 네비게이터 전부 포함.

## [v0.5.3] - 2026-04-07
### Added
- **동적 목차(TOC) 사이드바 네비게이터**: 에디터 좌측에 `Navigator` 사이드바가 고정 노출되도록 레이아웃 도입. 항목 클릭 시 해당 슬라이드로 부드럽게 자동 스크롤(`scrollIntoView`) 연동.
- **IntersectionObserver 연동**: 사용자가 본문을 스크롤할 때 현재 화면에 보이는 슬라이드에 맞는 TOC 항목이 자동으로 하이라이트(`.active`).
- **2단 배치 레이아웃**: 기존 1단(`max-width: 1000px`) 구성에서 `layout-wrapper`(최대 너비 1400px) 기준 2단 분할 구조로 확장.
- **다크모드/라이트모드 대응**: TOC 사이드바도 테마 전환에 완전히 반응하도록 색상 대응 설계.

### Changed
- **프로젝트 디렉토리 구조 리팩토링**: 확장성과 유지 관리를 위해 `data`, `docs`, `scripts`, `exports` 폴더를 신설하고 모든 리소스 목적별 분리 조치.
- **경로 무결성 패치**: 구조화로 인해 깨지는 API fetch, 서버 스크립트 실행 참조 경로(`local_server.ps1`, `patch.py`, `에디터_웹서버_실행.bat` 등)를 올바르게 동기화.
- CSS와 JS를 `src/style.css`, `src/app.js`로 모듈화하여 `HPE_VME_Editor.html` 코드를 단순화.

### Fixed
- **같은 소제목 중복 표시 문제**: 같은 대제목+중제목+소제목 조합의 복합키를 사용하여 Navigator에서 중복 항목을 하나로 합치도록 수정.
- **Navigator 사이드바 자동 스크롤 제거**: 본문 스크롤 시 Navigator의 활성 항목 표시는 유지하되, 사이드바 자체가 강제로 스크롤되는 동작 제거.

## [v0.5.1] - 2026-04-07
### Added
- **UI 및 엔진 업데이트**: 슬라이드 내 텍스트와 이미지 요소가 모두 존재할 때 가로 분할 비율을 세밀하게 조절할 수 있는 범위형 슬라이더(Range Slider) UI를 에디터 입력 폼에 추가 (기본 50:50, 최소 20:80 ~ 최대 80:20 지원).
- 수동 설정된 레이아웃 비율(`textRatio`)이 라이브 프리뷰 화면뿐 아니라 웹 기반 가이드(HTML)와 파일 다운로드(PPTX) 결과물 렌더링 엔진에도 동적으로 수치 배분 연동되도록 알고리즘 고도화.
- 하위 호환성 강화: 기존 데이터 로드 시 비율 정보가 없으면 기본값인 50%로 자동 마이그레이션.

## [v0.5.0] - 2026-04-07
### Added
- HPE VME Editor 템플릿의 초기 핵심 기능(PPTX생성, HTML생성 기능 포함) 구현 완료본
- `vme_editor_analysis.md` 기능 분석 문서
- 로컬 웹 서버 실행용 배치, 파워쉘 스크립트 및 Python 코드
- `.gitignore` (데이터 및 자동생성 웹가이드 제외 처리)

### Changed
- Git 버전 관리 시스템 도입 및 첫 커밋 (Github Flow 전략 시작)

---

# 🚧 언릴리즈 (Unreleased - feature 브랜치)
*현재 작업 중이거나 아직 메인 브랜치에 병합되지 않은 새로운 기능들의 내역입니다.*

## [feat/brand-themes] - 2026-04-07
### Added
- **브랜드 테마 28종 추가**: 브랜드 아이덴티티가 강한 IT 기업 14개의 공식 브랜드 컬러를 기반으로 다크/라이트 모드 각각 1종씩, 총 28개의 `.slidetheme` 파일 신규 제공.
  - **Google** (`google_dark` / `google_light`): 구글 브랜드 블루 `#4285F4` 기반
  - **Microsoft** (`microsoft_dark` / `microsoft_light`): MS 브랜드 블루 `#00A4EF` / `#0078D4` 기반
  - **Apple** (`apple_dark` / `apple_light`): Apple 시스템 블루 `#0A84FF` / `#007AFF`, 순수 블랙 배경
  - **AWS** (`aws_dark` / `aws_light`): AWS Squid Ink 다크 배경 + 오렌지 `#FF9900` 강조색
  - **GitHub** (`github_dark` / `github_light`): GitHub 공식 다크/라이트 팔레트 (`#58a6ff` / `#0969da`)
  - **Netflix** (`netflix_dark` / `netflix_light`): Netflix 시그니처 레드 `#E50914` + 순수 블랙 배경
  - **Spotify** (`spotify_dark` / `spotify_light`): Spotify 그린 `#1DB954` + 딥 블랙 배경
  - **IBM** (`ibm_dark` / `ibm_light`): IBM Carbon Design System 공식 팔레트 (`#0f62fe` / `#0043ce`)
  - **NVIDIA** (`nvidia_dark` / `nvidia_light`): NVIDIA 시그니처 그린 `#76B900` + 딥 블랙 배경
  - **Meta** (`meta_dark` / `meta_light`): Meta/Facebook 브랜드 블루 `#1877F2` 기반
  - **AMD** (`amd_dark` / `amd_light`): AMD 시그니처 레드 `#ED1C24` 기반
  - **Intel** (`intel_dark` / `intel_light`): Intel 브랜드 블루 `#0071C5` 기반
  - **GitLab** (`gitlab_dark` / `gitlab_light`): GitLab Tanuki 오렌지 `#FC6D26` / `#e24329` 기반
  - **Claude** (`claude_dark` / `claude_light`): Anthropic 시그니처 코퍼(Copper) `#D4784F` + 웜 다크/크림 배경
