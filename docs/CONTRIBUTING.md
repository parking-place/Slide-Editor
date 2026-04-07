# HPE VME Editor — 개발 규칙 및 워크플로우 가이드

이 문서는 HPE VME Editor 프로젝트의 **Git 브랜치 전략, 버전 관리, 문서 업데이트 규칙**을 정의합니다.
AI 어시스턴트(Antigravity)와 협업 시에도 이 규칙을 동일하게 적용합니다.

---

## 1. Git 브랜치 전략 (Github Flow)

```
main
 ├── feat/dynamic-toc        ← 기능 개발 브랜치 예시
 ├── feat/syntax-highlight   ← 기능 개발 브랜치 예시
 └── fix/some-bug            ← 버그픽스 브랜치 예시
```

### 1.1 브랜치 명명 규칙

| 접두사 | 용도 | 예시 |
|---|---|---|
| `feat/` | 신규 기능 개발 | `feat/dynamic-toc` |
| `fix/` | 버그 수정 | `fix/toc-duplicate` |
| `chore/` | 리팩토링, 구조 변경 | `chore/restructure` |
| `docs/` | 문서만 수정 | `docs/update-analysis` |

### 1.2 브랜치 생성 규칙

- 모든 작업은 **`main`에서 분기**한 전용 브랜치에서 진행한다.
- 브랜치 생성 시 목적이 명확한 이름을 사용한다.
- **`main`에 직접 커밋하지 않는다.**

```bash
# 새 기능 브랜치 생성 예시
git checkout main
git checkout -b feat/my-feature
```

### 1.3 커밋 메시지 규칙 (Conventional Commits)

```
<타입>: <요약>
```

| 타입 | 용도 |
|---|---|
| `feat` | 신규 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 업데이트 |
| `chore` | 빌드, 설정, 구조 변경 |
| `release` | 버전 릴리즈 머지 |
| `merge` | 피처 머지 (비릴리즈) |

**예시:**
```
feat: add dynamic TOC navigator sidebar with IntersectionObserver
fix: deduplicate TOC nav items and remove sidebar auto-scroll
docs: update VERSION_HISTORY for v0.5.4 release
release: v0.5.4 - Syntax Highlighting & Web Guide UI
```

---

## 2. 버전 관리 규칙

### 2.1 버전 번호 체계

```
v{Major}.{Minor}.{Patch}
```

| 자리 | 의미 | 올리는 시점 |
|---|---|---|
| Major | 전체 구조 변경 | 대규모 아키텍처 재설계 |
| Minor | 주요 기능 추가 | 새로운 UX 기능 묶음 출시 |
| Patch | 버그 수정 / 소기능 | 버그픽스, UI 미세 조정 |

### 2.2 릴리즈 절차

릴리즈는 반드시 다음 순서를 따른다:

```
1. VERSION_HISTORY.md 업데이트   ← 언릴리즈 → 릴리즈 섹션으로 이동
2. 피처 브랜치에 docs 커밋        ← git commit -m "docs: finalize VERSION_HISTORY for vX.X.X"
3. main에 --no-ff 머지            ← git merge feat/xxx --no-ff -m "release: vX.X.X - ..."
4. Git 태그 생성                  ← git tag vX.X.X
```

### 2.3 비릴리즈 머지 절차

기능이 완성됐지만 아직 공식 릴리즈 버전을 올리지 않고 머지만 할 때:

```
1. VERSION_HISTORY.md 언릴리즈 섹션에 기능 내역 기록 유지
2. main에 --no-ff 머지            ← git merge feat/xxx --no-ff -m "merge: feat/xxx into main (unreleased)"
3. 태그 생성 생략
```

---

## 3. 버전 문서 (VERSION_HISTORY.md) 작성 규칙

### 3.1 구조

```markdown
# 🚀 릴리즈 (Released - main 브랜치)
## [vX.X.X] - YYYY-MM-DD
### Added   ← 신규 기능
### Changed ← 기존 동작 변경
### Fixed   ← 버그 수정

---

# 🚧 언릴리즈 (Unreleased - feature 브랜치)
## [Unreleased] (feat/branch-name)
### Added / Changed / Fixed
```

### 3.2 업데이트 타이밍 규칙

> **커밋 전 반드시 VERSION_HISTORY.md를 먼저 업데이트한다.**

| 상황 | 동작 |
|---|---|
| 피처 브랜치에서 새 기능 완성 후 커밋 | 언릴리즈 섹션에 항목 추가 후 커밋 |
| 버그 수정 후 커밋 | 언릴리즈의 `### Fixed`에 항목 추가 후 커밋 |
| 릴리즈 전 | 언릴리즈 전체를 `## [vX.X.X]` 릴리즈 항목으로 이동, 언릴리즈 `*(현재 없음)*` 으로 초기화 |
| 비릴리즈 머지 | 언릴리즈 섹션 유지 (변경 없음) |

---

## 4. 분석 문서 (vme_editor_analysis.md) 업데이트 규칙

### 4.1 업데이트가 필요한 시점

- **신규 모듈/함수 추가** 시 `5.x절`에 해당 함수 설명 추가
- **디렉토리 구조 변경** 시 `2절 디렉토리 구조` 업데이트
- **라이브러리 추가** 시 `3절 주요 라이브러리` 테이블 행 추가
- **아키텍처 수준의 변경** 시 `6절 고려사항` 내용 보완

### 4.2 업데이트 타이밍

릴리즈 커밋 또는 피처 브랜치 최종 커밋 시점에 함께 업데이트한다.
분석 문서 단독 커밋은 `docs:` 타입을 사용한다.

```bash
git commit -m "docs: update analysis for feat/syntax-highlight"
```

---

## 5. 커밋 전 체크리스트

기능 개발을 마치고 커밋하기 전 다음 항목을 확인한다:

- [ ] `VERSION_HISTORY.md` 언릴리즈 섹션에 변경 내역이 기재되어 있는가?
- [ ] 신규 함수/모듈을 추가했다면 `vme_editor_analysis.md`가 갱신되었는가?
- [ ] 커밋 메시지가 Conventional Commits 규칙을 따르는가?
- [ ] 브랜치가 `main`이 아닌 피처 브랜치인가?

---

## 6. AI 어시스턴트(Antigravity) 협업 규칙

- AI는 **항상 커밋 전 `VERSION_HISTORY.md` 언릴리즈 업데이트를 먼저** 수행한다.
- 릴리즈 요청 시 반드시 **레이블링된 버전 번호**를 확인 후 진행한다.
- 계획(implementation_plan.md) → 실행(task.md) → 완료(walkthrough.md) 순서를 유지한다.
- 새 기능 브랜치는 항상 최신 `main`에서 분기(`git checkout main → checkout -b`)한다.
- `main`에 직접 커밋하는 것은 긴급 hotfix를 제외하고 금지한다.
