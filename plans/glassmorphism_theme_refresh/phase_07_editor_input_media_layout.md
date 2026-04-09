# Glassmorphism Phase 07

## 목표

슬라이드 추가 폼의 본문/미디어 영역을 사용성 중심으로 재배치하고, 이미지 업로드를 더 명확한 glass drop-zone 경험으로 전환합니다.

## 대상 파일

- `src/features/editor.js`
- `src/features/media.js`
- `src/features/html5-forms.js`
- `src/styles/editor.css`
- `docs/slide_editor_architecture.md`
- `docs/changelog/unreleased.md`

## 구현 범위

### 1. 본문 + 미디어 가로 2열화

- 새 슬라이드 작성 폼에서 `textarea`와 미디어 설정을 세로 스택 대신 2열 레이아웃으로 구성합니다.
- 모바일에서는 다시 1열로 자연스럽게 내려오도록 media query를 둡니다.

### 2. 미디어 설정 전체 드롭존화

- 현재 파일 input + 상태 텍스트 중심 구조를 하나의 drop-zone 패널로 통합합니다.
- 패널 전체를 클릭 가능한 업로드 버튼 겸 drag-and-drop 영역으로 사용합니다.
- `+` 아이콘과 함께 "이곳으로 이미지를 드래그해주세요" 성격의 안내 문구를 배치합니다.

### 3. 이미지 설명 필드 조건부 생성

- 이미지가 없는 상태에서는 caption input을 렌더링하지 않습니다.
- 파일 선택/드롭 이후에만 caption input이 생성되도록 렌더링 구조를 조정합니다.

### 4. 강조색 기반 glass drop-zone

- drop-zone은 일반 입력 박스가 아니라 강조색 border와 tint를 가진 glass panel로 처리합니다.
- dragover 상태에서는 강조색 glow, border, 배경 알파가 함께 변하도록 구성합니다.

## 검증 포인트

- 새 슬라이드 작성 폼이 데스크톱에서 가로 2열로 정렬되는지
- drop-zone 전체 클릭으로 파일 선택이 가능한지
- drag-and-drop 후 상태 문구와 caption field가 나타나는지
- 이미지가 없는 상태에서는 caption field가 숨겨져 있는지

## 완료 기준

- 새 슬라이드 폼은 본문/미디어 2열 구조를 가집니다.
- 미디어 영역은 전체가 drop-zone 역할을 합니다.
- caption 입력란은 이미지 선택 후에만 나타납니다.
