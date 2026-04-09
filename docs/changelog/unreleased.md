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
- 테마 모달에 `Glass Surface` 섹션과 live sample card를 추가해 glass 값을 즉시 조정하고 미리볼 수 있게 했습니다.
- glass 색상, alpha, blur, saturation, refraction, depth는 테마 저장 시 `.slidetheme`에 함께 기록되도록 연결했습니다.
- HTML 가이드 export에도 glass 토큰을 연결해, 헤더·Navigator·본문 카드·이미지 wrapper가 에디터와 같은 표면 언어를 공유하도록 맞췄습니다.
- 가이드 본문은 가독성을 우선해 shell 바깥보다 더 짙은 readable surface를 쓰도록 분리했습니다.
- 모바일 폭에서는 header, editor shell, guide shell의 blur/패딩/그림자를 한 단계 낮춰 과한 무게감을 줄이도록 조정했습니다.
- `backdrop-filter` 미지원 환경에서는 glass 표면이 semi-transparent solid fallback으로 내려가도록 기본 폴백을 추가했습니다.
- 라이트모드에서는 헤더 버튼, 가이드 헤더 제목, Navigator 빈 상태 문구와 현재 위치 하이라이트의 대비를 다시 조정해 너무 밝게 날아가던 텍스트와 아이콘을 보강했습니다.
- 좌상단 버전 표시는 pill 배지를 제거하고 더 작은 plain text 메타 정보로 축소했습니다.
- 라이트모드 배경의 좌상단 glow는 고정된 블루 대신 현재 강조색과 가까운 hue를 쓰도록 바꿨습니다.

- ???? ??/?? ?? ??? ??? ??? ?? ?? ??? ?? ??? ???????.
- ??? ??? ??? ?? glass ????? ???, ???? ??? ???? ??/?? ??? ???? ??????.

- ?? ?? ???? ??? ?? ??, ????/?? ????? ??? ?? ??? glass ??? ???? ?? ??????.
- ??? ?? ??? ????? ??? dark/bright glass ???? ????, ?? ??? ??? ?? ?????.
- `--glass-rgb` ?? ?? ?? RGB? ??? glass ?? ?????? ????? ?????? ??????.

## Fixed

- JSON Import 후 프로젝트 매니저를 불필요하게 닫아 버리던 흐름을 정리해, 현재 모달 문맥을 유지한 채 새 프로젝트 상태를 다시 렌더링하도록 보완했습니다.
