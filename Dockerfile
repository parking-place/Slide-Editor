# ── Stage: 프로덕션 이미지 ──────────────────────────────────────
FROM node:22-alpine

LABEL maintainer="Slide Editor"
LABEL description="Slide Editor cross-platform server"

WORKDIR /app

# 1) 의존성 파일만 먼저 복사 → npm install (레이어 캐시 최적화)
COPY package.json ./
RUN npm install --omit=dev

# 2) 앱 소스 복사
COPY SlideEditor.html ./
COPY version.json ./
COPY src/ ./src/
COPY scripts/server.js ./scripts/

# 3) 기본 테마 파일 복사
#    런타임 data 볼륨이 /app/data 를 덮어써도 기본 테마를 복구할 수 있도록
#    별도 번들 디렉터리에 함께 보관합니다.
COPY data/themes/ ./builtin_themes/

# 4) 볼륨 마운트 대상 디렉토리 미리 생성
#    (호스트 볼륨이 마운트되면 이 내용은 덮어씌워지지만,
#     볼륨 없이 단독 실행 시에도 폴더가 존재해야 함)
RUN mkdir -p /app/exports /app/data

# 5) node:alpine 기본 사용자가 node이므로 root를 명시적으로 지정합니다.
#    bind mount 된 data/exports 디렉토리가 root 소유로 생성되는 환경에서는
#    그렇지 않으면 저장 API가 EACCES로 실패하고 브라우저 폴백 다운로드로 떨어집니다.
USER root

EXPOSE 8000

CMD ["node", "scripts/server.js"]
