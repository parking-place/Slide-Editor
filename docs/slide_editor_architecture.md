# Slide Editor 아키텍처 및 운영 개요

이 문서는 현재 Slide Editor의 구조와 실행 방식, 데이터 흐름, 유지보수 시 확인해야 할 포인트를 정리한 문서입니다.

## 1. 현재 시스템 개요

- 편집 UI: 브라우저 기반 단일 페이지 편집기
- 서버: `scripts/server.js` 기반 Node.js/Express 서버
- 기본 실행 경로: Docker Compose
- 대체 실행 경로: `node scripts/server.js`
- 주요 출력물: PPTX, HTML 가이드

## 2. 주요 디렉터리

- 루트
  - `SlideEditor.html`: 메인 엔트리
  - `Dockerfile`, `docker-compose.yml`: 배포 자산
  - `version.json`: 앱 표시 버전 기준 파일
- `src/`
  - `app.js`: 편집기 상태, 렌더링, 내보내기, 프로젝트/테마/브랜딩 로직
  - `style.css`: 에디터 UI 스타일
- `scripts/`
  - `server.js`: 저장, 프로젝트, 테마, HTML 출력 관련 API 서버
  - `split.ps1`, `split.py`, `patch.py`: 보조 유틸리티
- `data/`
  - 프로젝트 데이터
  - 테마 파일
  - 이미지 파일
- `exports/`
  - HTML 출력 결과물
- `docs/`
  - changelog, 운영 규칙, 구조 문서

## 3. 실행 구조

### 3.1 Docker 기준

- 기본 운영은 `docker-compose.yml` 기준입니다.
- 배포 이미지는 `parkingplace/slide-editor:latest` 또는 버전 태그를 사용합니다.
- `data`, `exports`는 bind mount로 유지됩니다.

### 3.2 Node 직접 실행

- `npm install`
- `node scripts/server.js`

직접 실행은 로컬 개발이나 빠른 확인용으로 사용할 수 있지만, 운영 기준은 Docker입니다.

## 4. 프런트엔드 구조

### 4.1 핵심 UI

- 헤더
  - 로고/버전
  - 프로젝트 상태 표시
  - 테마, 브랜딩, 프로젝트 관리, 저장, 내보내기 액션
- 본문
  - TOC 사이드바
  - 슬라이드 미리보기
  - 슬라이드 생성/수정 에디터
- 모달
  - 프로젝트 매니저
  - 테마 매니저
  - 브랜딩 설정
  - 커스텀 확인/알림 모달

### 4.2 핵심 로직

- `renderPreview()`
  - 현재 슬라이드 데이터를 기반으로 표지, TOC, 본문 미리보기를 다시 그립니다.
- `paginateTocData()`
  - TOC 페이지 수를 계산하고 페이지별로 분할합니다.
- 프로젝트 관련 함수
  - 프로젝트 목록 로딩
  - 생성, 열기, 다른 이름으로 저장
  - 이름 변경, 삭제
- 내보내기 관련 함수
  - `exportToPPTX()`
  - `exportToHTML()`
  - `viewWebGuide()`

## 5. 데이터 구조

앱의 핵심 상태는 아래 요소로 구성됩니다.

- `slidesData`
- `projectSettings`
- `activeTheme`
- `currentProject`

프로젝트 데이터는 현재 프로젝트 저장 구조를 사용하며, 프로젝트별 메타데이터와 슬라이드 데이터를 분리 관리합니다.

### 5.1 이미지 저장

- 서버 저장 시에는 이미지가 별도 파일로 분리 저장될 수 있습니다.
- 백업/내보내기 시에는 필요에 따라 portable 형태로 다시 묶습니다.

### 5.2 테마와 브랜딩

- 테마는 `.slidetheme` 파일로 관리합니다.
- 브랜딩 정보는 프로젝트 데이터에 포함됩니다.
- 따라서 같은 테마를 여러 프로젝트가 공유하되, 프로젝트명/부제/footer는 각 프로젝트별로 다르게 유지할 수 있습니다.

## 6. 서버 역할

`scripts/server.js`는 다음 역할을 담당합니다.

- 정적 파일 서빙
- 프로젝트 목록/상세 로드
- 프로젝트 저장
- 프로젝트 생성, 이름 변경, 삭제
- 테마 목록/불러오기/저장
- HTML 출력 저장

현재 운영 기준 서버는 PowerShell 서버가 아니라 Node.js 서버입니다.

## 7. 유지보수 포인트

1. 구조 변경 시 문서 동기화
   - `README.md`
   - `docs/CONTRIBUTING.md`
   - `docs/slide_editor_architecture.md`
   - changelog

2. 버전 정합성 유지
   - `version.json`
   - changelog release note
   - Git 태그
   - Docker 태그

3. 프로젝트 저장 구조 변경 시 확인할 것
   - 기존 프로젝트 데이터 마이그레이션 경로
   - 이미지 파일 경로 보존 여부
   - HTML/PPTX 내보내기 영향

4. TOC와 미리보기 레이아웃 변경 시 확인할 것
   - TOC 페이지 분할 기준
   - 사이드바/슬라이드 내부 스크롤 발생 여부
   - HTML/PPTX 쪽 동일성

5. 릴리즈 후 정리
   - 필요 없는 로컬 테스트 컨테이너 삭제
   - 이전 버전 이미지 및 dangling 이미지 삭제
   - 원격 서버에서도 불필요한 이미지 정리

