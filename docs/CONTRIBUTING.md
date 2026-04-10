# Slide Editor 개발 및 릴리즈 규칙

이 문서는 Slide Editor 프로젝트의 브랜치 전략, 버전 규칙, changelog 운영, Docker 릴리즈 절차를 정의합니다.

## 1. 기본 원칙

- 모든 작업은 `main`에서 분기한 작업 브랜치에서 진행합니다.
- 릴리즈 이력은 hybrid changelog 구조로 관리합니다.
- `version.json`은 현재 버전의 단일 기준 파일입니다.
- Git 릴리즈 태그와 Docker 태그는 항상 같은 문자열을 사용합니다.
- 로컬과 원격 서버에서 더 이상 필요 없는 테스트 컨테이너와 미사용 이미지는 정리합니다.

## 2. 브랜치 규칙

- 기능 개발: `feat/<topic>`
- 버그 수정: `fix/<topic>`
- 핫픽스: `hotfix/<topic>`
- 문서 전용: `docs/<topic>`

예:

```text
feat/project-manager-refresh
fix/html-export-images
hotfix/viewer-code-theme
docs/readme-refresh
```

## 3. 커밋 규칙

Conventional Commits를 사용합니다.

사용 타입:

- `feat`
- `fix`
- `docs`
- `chore`
- `release`
- `merge`

예:

```text
feat: add project-level image storage
fix: restore viewer navigator behavior
docs: refresh architecture overview
release: v0.12.0
```

## 4. 버전 규칙

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

원칙:

- 메이저/마이너 변경 요청이 없으면 유지합니다.
- 작은 기능 추가나 수정은 patch 또는 hotfix 규칙을 따릅니다.
- Git 태그, `version.json`, Docker 태그는 항상 동일해야 합니다.

## 5. Changelog 구조

```text
CHANGELOG.md
docs/
  changelog/
    unreleased.md
    releases/
      v0.12.0.md
    archive/
      VERSION_HISTORY_legacy_snapshot.md
```

역할:

- `CHANGELOG.md`: changelog 진입점
- `docs/changelog/unreleased.md`: 현재 작업 중 변경 사항 기록
- `docs/changelog/releases/vX.Y.Z.md`: 릴리즈 노트
- `docs/changelog/archive/...`: 예전 단일 문서 snapshot

## 6. Changelog 작성 규칙

일반 개발 중에는 `docs/changelog/unreleased.md`만 업데이트합니다.

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

중요:

- 커밋 전에 changelog를 먼저 업데이트합니다.
- 릴리즈 시에는 `unreleased.md` 내용을 릴리즈 노트로 이동하고 다시 초기화합니다.

## 7. 릴리즈 절차

1. `docs/changelog/unreleased.md` 정리
2. `docs/changelog/releases/vX.Y.Z.md` 생성
3. `CHANGELOG.md` 최신 버전 갱신
4. `version.json` 갱신
5. 작업 브랜치 커밋
6. `main`에 `--no-ff` 머지
7. Git 태그 생성
8. Docker 이미지 빌드 및 push
9. 원격 서버 배포
10. 로컬/원격 Docker 정리

## 8. 비릴리즈 머지 절차

릴리즈 없이 기능만 `main`에 머지할 때:

1. `docs/changelog/unreleased.md` 유지
2. `main`에 `--no-ff` 머지
3. 태그 생성 없음
4. `version.json` 변경 없음

예:

```text
git merge feat/xxx --no-ff -m "merge: feat/xxx into main (unreleased)"
```

## 9. Docker 릴리즈 규칙

- Docker 태그는 Git 릴리즈 버전과 동일해야 합니다.
- `latest`는 최신 안정 릴리즈를 가리킵니다.
- 정식 릴리즈 이미지는 멀티아키텍처 기준으로 배포합니다.

대상 플랫폼:

- `linux/amd64`
- `linux/arm64`

권장 명령:

```powershell
docker buildx build `
  --platform linux/amd64,linux/arm64 `
  -t parkingplace/slide-editor:vX.Y.Z `
  -t parkingplace/slide-editor:latest `
  --push .
```

보조 스크립트:

- `docker-multiarch-release.bat`
- `docker-multiarch-release.sh`

## 10. 문서 최신화 규칙

다음 문서는 상황에 맞게 함께 갱신합니다.

- `CHANGELOG.md`
- `docs/changelog/unreleased.md`
- `docs/changelog/releases/*.md`
- `docs/CONTRIBUTING.md`
- `docs/slide_editor_architecture.md`
- `README.md`

원칙:

- 구조가 바뀌면 `README.md`와 구조 문서를 같이 갱신합니다.
- 릴리즈 절차가 바뀌면 `docs/CONTRIBUTING.md`를 먼저 갱신합니다.
- 버전 기준이 바뀌면 `version.json`, changelog, Docker 태그를 함께 맞춥니다.

## 11. 릴리즈 체크리스트

- [ ] `docs/changelog/unreleased.md`가 최신 상태인가?
- [ ] 릴리즈 노트를 생성했는가?
- [ ] `CHANGELOG.md` 최신 버전을 갱신했는가?
- [ ] `version.json`을 갱신했는가?
- [ ] Git 태그와 Docker 태그가 동일한가?
- [ ] 멀티아키텍처 Docker 이미지 push를 수행했는가?
- [ ] 원격 서버 배포를 수행했는가?
- [ ] 로컬/원격 Docker 정리를 했는가?

## 12. AI 협업 규칙

- AI는 changelog 작업 시 `docs/changelog/unreleased.md`를 기본 편집 대상으로 사용합니다.
- AI는 changelog와 릴리즈 노트를 항상 한국어로 작성합니다.
- 커밋 전에 changelog를 먼저 업데이트합니다.
- 릴리즈 요청 시 Git 태그와 Docker 태그를 같은 버전으로 맞춥니다.
- 릴리즈 후 로컬과 원격에서 미사용 Docker 이미지를 정리합니다.
