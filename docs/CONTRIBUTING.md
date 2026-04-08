# HPE VME Editor — 개발 규칙 및 워크플로우 가이드

이 문서는 HPE VME Editor 프로젝트의 **Git 브랜치 전략, 버전 관리, Docker 릴리즈, 문서 업데이트 규칙**을 정의합니다.
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
vX1.X2.X3(a)
```

| 자리 | 의미 | 기본 규칙 |
|---|---|---|
| `X1` | Major | 메이저 버전. 전체 구조 변경이나 대규모 아키텍처 재설계 시에만 변경하며, **명시적인 변경 요청이 없으면 유지**한다. |
| `X2` | Minor | 마이너 버전. 여러 기능이 묶인 기능 업데이트 릴리즈에서 변경하며, **명시적인 변경 요청이 없으면 유지**한다. |
| `X3` | Patch | 패치 버전. 소규모 기능 추가, 버그 수정, 운영성 개선 등 작은 단위의 정식 패치 릴리즈에서 `+1` 한다. 메이저/마이너 버전이 올라가는 릴리즈에서는 `0`으로 초기화한다. |
| `(a)` | Hotfix suffix | 핫픽스 또는 `docs` 전용 릴리즈에서만 붙는 접미사. 알파벳 순서(`a`, `b`, `c` ...)로 증가하며, 새로운 패치 릴리즈가 나오면 제거된다. |

**해석 예시**

- `v0.7.0`: 메이저/마이너 변경 후의 기본 정식 릴리즈
- `v0.7.0a`: `v0.7.0` 이후의 첫 번째 핫픽스 또는 문서 전용 릴리즈
- `v0.7.0b`: `v0.7.0a` 다음 순번의 핫픽스 또는 문서 전용 릴리즈
- `v0.7.1`: 작은 기능 패치 또는 버그 수정이 포함된 다음 정식 패치 릴리즈. 이 시점에는 알파벳 suffix를 제거한다.

**버전 결정 원칙**

- 메이저와 마이너는 사용자가 명시적으로 올리자고 요청하지 않으면 유지한다.
- 작은 규모의 기능 패치 릴리즈는 `X3`만 올린다.
- 핫픽스, 운영 설정 수정, 문서 정리처럼 작은 후속 릴리즈는 같은 `X1.X2.X3`를 유지한 채 suffix만 증가시킨다.
- 패치 릴리즈(`X3 + 1`)가 발생하면 이전 hotfix suffix 흐름은 종료되고 suffix 없이 새 패치 버전을 사용한다.

### 2.2 릴리즈 절차

릴리즈는 반드시 다음 순서를 따른다:

```
1. VERSION_HISTORY.md 업데이트   ← 언릴리즈 → 릴리즈 섹션으로 이동
2. 피처 브랜치에 docs 커밋        ← git commit -m "docs: finalize VERSION_HISTORY for vX.X.X"
3. main에 --no-ff 머지            ← git merge feat/xxx --no-ff -m "release: vX.X.X - ..."
4. Git 태그 생성                  ← git tag vX1.X2.X3 또는 vX1.X2.X3a
5. Docker 이미지 빌드            ← 릴리즈 버전과 동일한 태그 사용
6. Docker Hub push               ← Docker 이미지 태그는 Git 릴리즈 버전과 반드시 동일
```

**Docker 릴리즈 규칙**

- Docker 이미지 태그는 반드시 **Git 릴리즈 버전과 동일한 문자열**을 사용한다.
- 예: Git 릴리즈가 `v0.6.1`이면 Docker 이미지 태그도 `v0.6.1`이어야 한다.
- 예: Git 릴리즈가 `v0.7.0a`이면 Docker 이미지 태그도 `v0.7.0a`이어야 한다.
- 공식 릴리즈에는 코드/문서 릴리즈와 Docker Hub 배포를 **같은 배포 단위**로 취급한다.

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
## [vX1.X2.X3] 또는 [vX1.X2.X3a] - YYYY-MM-DD
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
| 릴리즈 전 | 언릴리즈 전체를 `## [vX1.X2.X3]` 또는 `## [vX1.X2.X3a]` 릴리즈 항목으로 이동, 언릴리즈 `*(현재 없음)*` 으로 초기화 |
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
- [ ] 릴리즈 작업이라면 Git 태그와 Docker 이미지 태그가 동일한 버전명으로 준비되었는가?

---

## 6. AI 어시스턴트(Antigravity) 협업 규칙

- AI는 **항상 커밋 전 `VERSION_HISTORY.md` 언릴리즈 업데이트를 먼저** 수행한다.
- 릴리즈 요청 시 반드시 **레이블링된 버전 번호**를 확인 후 진행한다.
- 릴리즈 요청 시 Docker 이미지를 빌드한 뒤 Docker Hub에 push하며, **Docker 태그는 릴리즈 버전과 동일하게** 맞춘다.
- 계획(implementation_plan.md) → 실행(task.md) → 완료(walkthrough.md) 순서를 유지한다.
- 새 기능 브랜치는 항상 최신 `main`에서 분기(`git checkout main → checkout -b`)한다.
- `main`에 직접 커밋하는 것은 긴급 hotfix를 제외하고 금지한다.
