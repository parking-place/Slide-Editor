# Unreleased

다음 릴리즈에 포함할 변경 사항을 여기에 기록합니다.

## Added

- 프로젝트 목록 헤더의 `+` 버튼으로 여는 `New Project` 다이얼로그를 추가했습니다.
- `New Project` 다이얼로그에서 새 프로젝트 생성과 JSON 데이터 Import를 분리해 시작할 수 있도록 정리했습니다.
- 글라스모피즘 테마 확장을 위한 `glass` 테마 스키마와 CSS 토큰 기본 구조를 추가했습니다.

## Changed

- 프로젝트 매니저 2차 UI 개편을 반영해 메인 액션을 `Current Project`와 `Selected Project` 상태에 맞게 다시 배치했습니다.
- 현재 프로젝트를 선택했을 때는 `Save`, `Copy`, `Export`만 보이도록 정리했습니다.
- 다른 프로젝트를 선택했을 때는 `Open`, `Copy`만 보이도록 정리했습니다.
- 기존 `Save As` 흐름은 `Copy` 동작으로 대체했고, 기본 복제 이름 규칙을 `_copy` 형식으로 맞췄습니다.
- `New`, `Import`, `Backup JSON`이 섞여 있던 하단 툴 박스를 제거하고, 역할에 맞는 별도 UI로 이동했습니다.
- `Current Project`와 `Selected Project` 카드의 메타 정보를 `ID`, `page`, `Saved Version`, `Last Saved` 4개 항목으로 통일했습니다.
- `Last Saved` 값은 이후 서버 메타데이터 연동 전까지 `Nodata` placeholder로 먼저 표시합니다.
- 프로젝트 목록의 상태 표시는 별, 체크, 휴지통 아이콘 기준으로 다시 정렬했고, 카드와 다이얼로그 액션 버튼의 아이콘 스타일도 함께 맞췄습니다.
- 기본 제공 `.slidetheme` 파일에 dark/light 공용 glass 기본값을 추가하고, 구버전 테마 로드 시 자동 fallback 되도록 정리했습니다.
- 에디터 배경에 테마 기반 그라데이션을 추가하고, 헤더·Navigator·슬라이드 카드·편집 패널에 중간 강도의 glass shell을 적용하기 시작했습니다.
- 입력 필드는 완전한 유리층으로 바꾸지 않고, shell 안의 읽기 중심 solid surface로 유지하도록 정리했습니다.

## Fixed

- JSON Import 후 프로젝트 매니저를 불필요하게 닫아 버리던 흐름을 정리해, 현재 모달 문맥을 유지한 채 새 프로젝트 상태를 다시 렌더링하도록 보완했습니다.
