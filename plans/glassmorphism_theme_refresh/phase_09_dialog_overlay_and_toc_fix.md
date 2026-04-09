# Glassmorphism Phase 09

## 목표

dialog 주변 처리 방식을 더 세련되게 다듬고, 동일 소제목/제목 그룹에서 Navigator active가 사라지는 버그를 구조적으로 수정합니다.

## 대상 파일

- `src/styles/modal.css`
- `src/features/editor.js`
- `src/features/html5-forms.js`
- `src/features/export-enhancements.js`
- `src/features/outline.js`
- `docs/slide_editor_architecture.md`
- `docs/changelog/unreleased.md`

## 구현 범위

### 1. dialog 주변 overlay 조정

- dialog 바깥쪽 blur를 제거합니다.
- dialog 바깥 dark overlay도 약하게 줄이거나 제거합니다.
- 대신 dialog 본체 box-shadow를 더 강하게 줘서 배경과 분리합니다.

### 2. 동일 소제목 / 동일 제목 그룹 active 유지 버그 수정

- Navigator 목록은 현재처럼 중복 제목을 1개로 병합합니다.
- 그러나 scroll observer는 "개별 slide -> 대표 toc item" 매핑을 유지해야 합니다.
- 동일 key를 갖는 여러 슬라이드가 모두 같은 toc item id를 참조하도록 맵을 고정합니다.
- 따라서 어느 슬라이드가 visible이어도 동일 대표 항목이 active 상태를 유지해야 합니다.

### 3. editor / phase9 TOC 로직 정합화

- 현재 `editor.js`와 `html5-forms.js`에 유사한 TOC 렌더/observer 로직이 있으므로,
  실제 활성 경로와 중복 로직을 확인한 뒤 같은 매핑 규칙으로 맞춥니다.
- export/guide 쪽 Navigator도 동일 병합 규칙을 쓰는지 점검합니다.

## 검증 포인트

- 같은 소제목/제목을 공유하는 연속 슬라이드를 스크롤해도 TOC active가 유지되는지
- TOC 목록은 중복으로 늘어나지 않는지
- dialog overlay가 덜 무겁고, 대신 본체 shadow가 더 분명한지

## 완료 기준

- dialog 주변 blur/darkening이 줄고 shadow 중심 분리가 적용됩니다.
- 중복 제목 그룹에서 어느 슬라이드를 보고 있어도 같은 TOC 항목이 active로 유지됩니다.
