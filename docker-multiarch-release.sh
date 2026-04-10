#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

IMAGE_NAME="parkingplace/slide-editor"
VERSION_TAG="${1:-}"

if [[ -z "$VERSION_TAG" ]]; then
  echo "Usage: ./docker-multiarch-release.sh <version-tag>"
  echo "Example: ./docker-multiarch-release.sh v0.12.0"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker CLI를 찾을 수 없습니다."
  exit 1
fi

echo "[Slide Editor] Multi-arch build and push"
echo "  Image  : $IMAGE_NAME"
echo "  Version: $VERSION_TAG"
echo

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t "$IMAGE_NAME:$VERSION_TAG" \
  -t "$IMAGE_NAME:latest" \
  --push .

echo
echo "Done."
docker buildx imagetools inspect "$IMAGE_NAME:$VERSION_TAG"
