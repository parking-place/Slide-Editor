# Slide Editor - Development Rules and Workflow

이 문서는 Slide Editor 프로젝트의 브랜치 전략, 버전 규칙, changelog 운영, Docker 릴리즈 절차를 정의합니다.

---

## 1. Core Principles

- 모든 작업은 `main`에서 분기한 전용 브랜치에서 진행합니다.
- 릴리즈 기록은 이제 단일 `VERSION_HISTORY.md`가 아니라 hybrid changelog 구조로 관리합니다.
- `version.json`은 에디터 UI에 표시되는 현재 버전의 단일 기준 파일입니다.
- Git 릴리즈 태그와 Docker 이미지 태그는 항상 같은 문자열을 사용합니다.
- 로컬과 원격 서버 모두에서 더 이상 필요 없는 테스트 컨테이너와 이전 버전 이미지는 남겨두지 않습니다.

---

## 2. Branch Strategy

### 2.1 Main branch

- `main`은 항상 배포 가능한 상태를 유지합니다.
- 공식 릴리즈와 hotfix 릴리즈는 `main` 기준으로 태그를 생성합니다.

### 2.2 Working branches

- 기능 개발: `feat/<topic>`
- 버그 수정: `fix/<topic>`
- 핫픽스: `hotfix/<topic>`
- 문서 전용 정리: `docs/<topic>`

예시:

```text
feat/project-only-storage
fix/html-export-images
hotfix/hybrid-changelog
docs/readme-refresh
```

---

## 3. Commit Rules

Conventional Commits를 사용합니다.

허용 타입:

- `feat`
- `fix`
- `docs`
- `chore`
- `release`
- `merge`

예시:

```text
feat: add project-level image storage
fix: inline images for HTML export
docs: migrate version history to hybrid changelog
release: v0.8.0a - hybrid changelog migration
```

---

## 4. Versioning Rules

버전 형식:

```text
vX1.X2.X3
vX1.X2.X3a
```

의미:

- `X1`: major
- `X2`: minor
- `X3`: patch
- `a`, `b`, `c`...: hotfix 또는 docs-only hotfix suffix

해석 예시:

- `v0.8.0`: 정식 마이너 릴리즈
- `v0.8.0a`: `v0.8.0` 이후 첫 번째 핫픽스 또는 문서 구조 hotfix 릴리즈
- `v0.8.1`: 다음 정식 패치 릴리즈

원칙:

- 사용자가 메이저/마이너 상승을 명시적으로 요청하지 않으면 유지합니다.
- 작은 기능 보강이나 버그 수정은 patch 릴리즈를 사용합니다.
- 릴리즈 후속 문서 정리, 운영 정리, 구조 보강은 hotfix suffix 릴리즈를 사용할 수 있습니다.

---

## 5. Version File

- 루트 `version.json`은 현재 버전의 단일 기준입니다.
- 릴리즈와 hotfix 릴리즈 때는 반드시 `version.json`을 최종 릴리즈 버전으로 갱신합니다.
- 개발 중인 피처 브랜치에서는 릴리즈가 확정되기 전까지 `version.json`을 미리 올리지 않습니다.
- 릴리즈 후에는 브라우저 또는 HTTP 요청으로 버전 노출값까지 확인합니다.

---

## 6. Hybrid Changelog Structure

현재 changelog 구조는 다음과 같습니다.

```text
CHANGELOG.md
docs/
  changelog/
    unreleased.md
    releases/
      v0.8.0a.md
      v0.8.0.md
    archive/
      VERSION_HISTORY_legacy_snapshot.md
```

각 파일의 역할:

- `CHANGELOG.md`: changelog 진입점, 최신 릴리즈 링크, 구조 설명
- `docs/changelog/unreleased.md`: 개발 중 변경 사항을 적는 유일한 작업 파일
- `docs/changelog/releases/vX.Y.Z.md`: 배포된 릴리즈별 고정 문서
- `docs/changelog/archive/VERSION_HISTORY_legacy_snapshot.md`: 단일 문서 시절 이력 보존본
- `docs/VERSION_HISTORY.md`: 새 구조로 안내하는 호환용 포인터 문서

---

## 7. Changelog Update Rules

### 7.1 Normal development

기능 작업 중에는 다음 파일만 업데이트합니다.

- `docs/changelog/unreleased.md`
- changelog 문서의 설명과 bullet은 항상 한국어로 작성합니다.

형식:

```markdown
# Unreleased

## Added
- ...

## Changed
- ...

## Fixed
- ...
```

### 7.2 Release preparation

릴리즈 직전에는:

1. `docs/changelog/unreleased.md` 내용을 검토합니다.
2. 새 릴리즈 파일 `docs/changelog/releases/vX.Y.Z.md`를 만듭니다.
3. `unreleased.md`를 템플릿 상태로 초기화합니다.
4. `CHANGELOG.md`의 최신 릴리즈 링크를 갱신합니다.
5. `version.json`을 같은 버전으로 맞춥니다.

### 7.3 Historical releases

- 이미 배포된 릴리즈 파일은 되도록 수정하지 않습니다.
- 과거 단일 문서형 이력은 archive snapshot으로 보존합니다.
- 기존 링크 호환을 위해 `docs/VERSION_HISTORY.md`는 포인터 역할만 유지합니다.

---

## 8. Release Procedure

공식 릴리즈와 hotfix 릴리즈는 아래 순서를 따릅니다.

```text
1. changelog 준비
   - docs/changelog/unreleased.md 검토
   - docs/changelog/releases/vX.Y.Z.md 생성
   - CHANGELOG.md 최신 링크 갱신

2. version.json 업데이트

3. 작업 브랜치 커밋
   - git commit -m "docs: ..." 또는 "fix: ..."

4. main에 --no-ff 머지
   - git merge hotfix/xxx --no-ff -m "release: vX.Y.Z - ..."

5. Git 태그 생성
   - git tag vX.Y.Z

6. Docker 이미지 빌드

7. Docker Hub push

8. 원격 서버 배포

9. 로컬/원격 Docker 정리
```

릴리즈 머지 메시지 예시:

```text
release: v0.8.0a - hybrid changelog migration
```

---

## 9. Non-release Merge Procedure

릴리즈 없이 기능만 `main`에 머지할 때:

1. `docs/changelog/unreleased.md`에 변경 사항 유지
2. `main`에 `--no-ff` 머지
3. 태그 생성 생략
4. `version.json` 변경 생략

예시:

```text
git merge feat/xxx --no-ff -m "merge: feat/xxx into main (unreleased)"
```

---

## 10. Docker Release Rules

- Docker 태그는 Git 릴리즈 버전과 동일한 문자열을 사용합니다.
- 필요 시 `latest`도 함께 갱신할 수 있지만, 버전 태그는 반드시 별도로 남깁니다.
- 배포 후 새 버전이 정상 동작하면 불필요한 테스트용 컨테이너와 이전 버전 이미지를 정리합니다.
- dangling 이미지(`<none>`)와 재사용 계획이 없는 임시 로컬 빌드 이미지도 삭제합니다.
- 원격 서버에서도 운영에 필요 없는 테스트 컨테이너, 이전 이미지, dangling 이미지를 정리합니다.
- 단, 현재 운영 중인 컨테이너와 명시적으로 보존하기로 한 롤백 이미지는 자동 삭제하지 않습니다.

---

## 11. Documentation Update Rules

다음 문서는 상황에 맞게 함께 유지합니다.

- `CHANGELOG.md`
- `docs/changelog/unreleased.md`
- `docs/changelog/releases/*.md`
- `docs/CONTRIBUTING.md`
- `docs/slide_editor_architecture.md`
- `README.md`

기준:

- 구조가 바뀌면 `README.md`와 `docs/slide_editor_architecture.md`의 설명도 갱신합니다.
- 릴리즈 절차가 바뀌면 `docs/CONTRIBUTING.md`를 먼저 갱신합니다.
- 버전 기준이 바뀌면 `version.json`, changelog release note, Docker tag가 모두 일치해야 합니다.

---

## 12. Release Checklist

릴리즈 또는 hotfix 직전에 아래 항목을 확인합니다.

- [ ] `docs/changelog/unreleased.md`가 최신 상태인가?
- [ ] 새 릴리즈 파일이 생성되었는가?
- [ ] `CHANGELOG.md`의 최신 릴리즈 링크가 갱신되었는가?
- [ ] `version.json`이 최종 릴리즈 버전과 일치하는가?
- [ ] Git 태그와 Docker 이미지 태그가 동일한가?
- [ ] 로컬/원격 Docker 정리 계획이 반영되었는가?
- [ ] 필요 시 `README.md`와 `docs/slide_editor_architecture.md`도 갱신되었는가?

---

## 13. AI Assistant Rules

- AI는 changelog 작업 시 `docs/changelog/unreleased.md`를 기본 편집 대상으로 사용합니다.
- AI는 changelog의 `unreleased`와 release note 설명을 항상 한국어로 작성합니다.
- 릴리즈 요청 시 새 릴리즈 파일과 `CHANGELOG.md`, `version.json`을 함께 갱신합니다.
- 릴리즈 요청 시 Git 태그와 Docker 이미지 태그를 같은 버전으로 맞춥니다.
- 배포 후 로컬과 원격에서 더 이상 필요 없는 테스트 컨테이너, 이전 버전 이미지, dangling 이미지를 정리합니다.
- 과거 이력을 제거하지 말고 archive 또는 포인터 방식으로 보존합니다.
