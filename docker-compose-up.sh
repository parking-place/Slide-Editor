#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker CLI를 찾을 수 없습니다."
  echo "Docker Engine 또는 Docker Desktop이 설치되어 있는지 확인하세요."
  exit 1
fi

echo "[Slide Editor] docker compose pull"
docker compose pull

echo "[Slide Editor] docker compose up -d"
docker compose up -d

echo
echo "Slide Editor 컨테이너가 실행되었습니다."
docker compose ps
