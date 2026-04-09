# Unreleased

다음 릴리즈에 포함할 변경 사항을 여기에 기록합니다.

## Added

- 프로젝트별 비동기 WebP 이미지 업로드 API와 이미지 자산 상태 조회 API를 추가했습니다.
- 업로드 직후 슬라이드 미리보기에서 이미지 변환 진행 상태를 표시하고, 변환 완료 시 자동으로 WebP 이미지를 반영하는 페이즈 2 UI 오버레이를 추가했습니다.

## Changed

- 프로젝트 이미지 저장 구조에 `originals`, `converted`, `index.json` 기반 자산 메타데이터 저장소를 도입했습니다.
- 슬라이드 추가 및 편집 시 이미지 업로드 흐름이 서버 변환 파이프라인과 연동되도록 확장했습니다.
- 미리보기 슬라이드에 `content-visibility`, 이미지 `loading="lazy"` 및 `decoding="async"`를 적용하고, 화면 밖 이미지 소스를 지연 복원하는 페이즈 3 lazy 렌더링을 추가했습니다.
- 에디터 레이아웃에 `header`, `main`, `section`, `dialog`, `figure`, `figcaption` 기반 HTML5 시맨틱 구조를 적용하고 주요 모달을 `dialog` 중심으로 전환했습니다.
- HTML 가이드 내보내기와 다운로드 흐름을 HTML5 시맨틱 구조 기준으로 재정의하고, WebP 우선, 실패 시 원본 fallback, portable 백업용 인라인 이미지 규칙을 정리했습니다.

## Fixed

- 이미지 업로드 직후 변환 완료 전까지 미리보기 영역이 비어 보이던 문제를 상태 표시 박스로 보완했습니다.
