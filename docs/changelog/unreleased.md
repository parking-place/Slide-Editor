# Unreleased

다음 릴리즈에 포함할 변경 사항을 여기에 기록합니다.

## Added

- 구버전 JSON 임포트와 구버전 프로젝트 로드 시, 이미지를 먼저 `변환 중` 상태로 표시한 뒤 순차적으로 WebP로 백필 변환하고 완료 알림을 띄우는 호환 로직을 추가했습니다.

- 프로젝트별 비동기 WebP 이미지 업로드 API와 이미지 자산 상태 조회 API를 추가했습니다.
- 업로드 직후 슬라이드 미리보기에서 이미지 변환 진행 상태를 표시하고, 변환 완료 시 자동으로 WebP 이미지를 반영하는 페이즈 2 UI 오버레이를 추가했습니다.

## Changed

- 브랜딩, JSON 임포트, 백업 기능을 프로젝트 매니저 안으로 통합하고 헤더 중복 액션을 정리했습니다.
- 브랜딩의 프로젝트명은 항상 현재 프로젝트 저장 이름과 동기화되도록 정리해 이름 관련 중복 편집 경로를 제거했습니다.
- JSON 임포트 시 파일 안의 브랜딩 프로젝트명을 우선 사용해 서버 프로젝트로 저장하고 바로 열도록 흐름을 바꿨습니다.
- JSON 백업 파일명은 `프로젝트명_data_YYMMDDhhmmss.json` 형식으로 생성되도록 변경했습니다.
- 구조 분석 문서를 현재 모듈형 `src` 구조, 프로젝트 저장 포맷, WebP 변환 파이프라인, `savedVersion` 메타데이터 흐름 기준으로 최신화했습니다.
- 데이터 저장 및 백업 JSON에 `savedVersion`을 함께 기록하고, 프로젝트 매니저에서 프로젝트별 저장 버전을 표시하도록 개선했습니다. 버전 정보가 없는 구버전 프로젝트는 `old`로 표시됩니다.
- `src/features` 하위 기본 기능 파일 이름을 `projects.js`, `editor.js`, `export.js`, `theme.js` 중심으로 정리하고, 후행 보강 레이어는 `export-enhancements.js`, `html5-semantics.js`, `html5-forms.js`처럼 역할이 드러나도록 재정렬했습니다.
- 기본 `app.js`를 `src/core/state.js`, `src/features/projects-base.js`, `editor-base.js`, `export-base.js`, `theme-base.js`로 나눠 전역 상태와 기능 흐름을 역할별 파일로 재배치했습니다.
- `app.js` 끝에 통합돼 있던 미디어 처리, HTML5 보강, export 후행 레이어를 `src/features` 하위 기능 파일로 분리해 로드 순서와 책임 범위를 명확히 정리했습니다.
- `style.css`를 로더 파일로 축소하고 `src/styles/base.css`, `layout.css`, `editor.css`, `modal.css`, `enhancements.css`로 분리해 CSS 책임을 모듈 단위로 정리했습니다.
- `src`의 페이즈별 JavaScript/CSS 오버레이 파일을 메인 `app.js`, `style.css`로 통합하고, HTML 로드 경로를 단일 엔트리 기준으로 정리했습니다.

- 프로젝트 이미지 저장 구조에 `originals`, `converted`, `index.json` 기반 자산 메타데이터 저장소를 도입했습니다.
- 슬라이드 추가 및 편집 시 이미지 업로드 흐름이 서버 변환 파이프라인과 연동되도록 확장했습니다.
- 미리보기 슬라이드에 `content-visibility`, 이미지 `loading="lazy"` 및 `decoding="async"`를 적용하고, 화면 밖 이미지 소스를 지연 복원하는 페이즈 3 lazy 렌더링을 추가했습니다.
- 에디터 레이아웃에 `header`, `main`, `section`, `dialog`, `figure`, `figcaption` 기반 HTML5 시맨틱 구조를 적용하고 주요 모달을 `dialog` 중심으로 전환했습니다.
- HTML 가이드 내보내기와 다운로드 흐름을 HTML5 시맨틱 구조 기준으로 재정의하고, WebP 우선, 실패 시 원본 fallback, portable 백업용 인라인 이미지 규칙을 정리했습니다.
- 슬라이드 작성/수정 UI를 HTML5 `form`/`fieldset` 기반으로 재구성하고, 주요 입력 필드에 기본 검증 속성을 추가했습니다.
- 미디어 설정 영역에 `details`/`summary`를 적용하고, 비율 표시를 `output`, 업로드 상태를 `progress` 기반으로 확장했습니다.
- 주요 `dialog` 모달에 포커스 복귀와 접근성 라벨을 추가하고, TOC 항목의 키보드 탐색을 보강했습니다.
- TOC 사이드바를 HTML `template` 기반으로 다시 렌더링하도록 바꿔 반복 마크업 구조를 정리했습니다.
- 편집기 미리보기와 export HTML에 공통 아웃라인 메타데이터를 부여해 구조 동기화 기반을 추가했습니다.

## Fixed

- 이미지 업로드 직후 변환 완료 전까지 미리보기 영역이 비어 보이던 문제를 상태 표시 박스로 보완했습니다.
- 가이드 보기에서 네비게이터 현재 위치 하이라이트와 이미지 클릭 확대 기능이 빠졌던 회귀를 복구했습니다.
