#!/usr/bin/env bash
set -euo pipefail

TAG="${INPUT_TAG:?tag required}"
MAJOR="${INPUT_MAJOR:?major required}"

if [[ ! "${TAG}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "::error::Invalid tag: ${TAG}" >&2
  exit 1
fi
if [[ ! "${MAJOR}" =~ ^v[0-9]+$ ]]; then
  echo "::error::Invalid major tag: ${MAJOR}" >&2
  exit 1
fi

git fetch origin "refs/tags/${TAG}:refs/tags/${TAG}"
git tag -f "$MAJOR" "$TAG"
git push -f origin "refs/tags/${MAJOR}"
echo "Moved major tag ${MAJOR} → ${TAG}"
