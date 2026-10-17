#!/usr/bin/env bash
set -euo pipefail

TAG="${INPUT_TAG:?tag required}"
MAJOR="${INPUT_MAJOR:?major required}"

git fetch origin "refs/tags/${TAG}:refs/tags/${TAG}"
git tag -f "$MAJOR" "$TAG"
git push -f origin "refs/tags/${MAJOR}"
echo "Moved major tag ${MAJOR} → ${TAG}"
