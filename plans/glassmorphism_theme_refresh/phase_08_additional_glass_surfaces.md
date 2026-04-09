# Glassmorphism Phase 08

## 목표

glass language를 헤더 바깥의 상호작용 요소와 dialog 내부까지 넓혀서, UI 전체가 같은 재질 체계를 공유하도록 만듭니다.

## 대상 파일

- `src/styles/layout.css`
- `src/styles/editor.css`
- `src/styles/modal.css`
- `src/features/export-enhancements.js`
- `docs/slide_editor_architecture.md`
- `docs/changelog/unreleased.md`

## 구현 범위

### 1. 액션 버튼 glass 확장

- 슬라이드 추가 `+` 버튼
- 변경사항 저장 버튼
- 수정 / 제거 버튼
- dialog 안의 Apply / Save / Open / Copy / Import / Create 버튼

위 요소들에 공통 glass shell 구조를 적용하되, variant별 강조색은 유지합니다.

### 2. dialog 본체 / 내부 정보 요소 glass 정리

- `custom-modal`, `theme-modal`, `branding-modal`, `project-modal`, `new-project-modal` 본체 배경을 glass 체계로 통일합니다.
- 내부 state card, meta card, list item, selected/highlight 영역도 glass surface 계층으로 정리합니다.
- 선택 상태 active 배경은 강조색을 유지합니다.

### 3. 섹션 커버 glass 분기

- 중제목 변경 시 생성되는 section cover는 현재 고정색에서 벗어나 glass cover로 변경합니다.
- 다크모드: 밝은 glass
- 라이트모드: 어두운 glass

### 4. 코드 블록 glass 처리

- 코드 블록 본문은 solid가 아니라 어두운 glass 계열로 유지합니다.
- 다만 코드 가독성이 깨지지 않도록 contrast는 충분히 확보합니다.
- 코드 블록 헤더와 복사 버튼은 다크/라이트 모드에 맞춰 별도로 조정합니다.

## 검증 포인트

- 버튼들이 같은 glass family 안에 있으면서도 역할별 색 구분이 되는지
- dialog 내부 카드와 선택 상태가 명확히 보이는지
- section cover가 모드에 따라 밝기만 다르게 바뀌는지
- 코드 블록이 glass 처리 이후에도 충분히 읽히는지

## 완료 기준

- 주요 인터랙션 버튼과 dialog 내부 UI가 모두 glass 체계를 공유합니다.
- section cover는 dark/light에 따라 다른 glass 밝기를 가집니다.
- 코드 블록과 복사 버튼이 모드별 대비를 유지합니다.
