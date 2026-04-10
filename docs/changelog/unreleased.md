# Unreleased

다음 릴리즈에 포함될 변경 사항을 여기에 기록합니다.

## Added

- 없음

## Changed

- `local-server-up.bat`를 Windows 로컬 테스트 전용 배치 파일로 전환하고 Git 추적 대상에서 제외했습니다.

## Fixed

- 로컬 Node 서버 실행 시 삭제되었거나 손상된 프로젝트가 `index.json`과 `app_state.json`에 남아 있으면 초기 프로젝트 로드가 실패하던 문제를 수정했습니다.
- 프로젝트 목록 조회 시 `meta.json` 또는 `slide_data.json`이 없는 오래된 항목을 자동으로 정리하도록 보완했습니다.
