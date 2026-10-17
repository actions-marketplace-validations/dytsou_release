#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${INPUT_BASE_BRANCH:-main}"

# Branch / ref name only (no shell metacharacters or path escape).
if [[ ! "${BASE_BRANCH}" =~ ^[A-Za-z0-9][A-Za-z0-9._/-]*$ ]]; then
  echo "::error::Invalid base-branch: ${BASE_BRANCH}" >&2
  exit 1
fi
if [[ "${BASE_BRANCH}" == *..* ]]; then
  echo "::error::Invalid base-branch (contains '..'): ${BASE_BRANCH}" >&2
  exit 1
fi

git fetch "origin" "${BASE_BRANCH}" --tags

if ! git rev-parse --verify "origin/${BASE_BRANCH}" >/dev/null 2>&1; then
  echo "::error::Could not resolve origin/${BASE_BRANCH}" >&2
  exit 1
fi

LATEST_TAG="$(git tag --merged "origin/${BASE_BRANCH}" --sort=-version:refname | head -n1 || true)"
if [[ -z "${LATEST_TAG}" ]]; then
  echo "No tags on ${BASE_BRANCH}'s history yet; continuing (no baseline tag to compare)."
  exit 0
fi

COUNT="$(git rev-list --count "${LATEST_TAG}..origin/${BASE_BRANCH}")"
if [[ "${COUNT}" -eq 0 ]]; then
  echo "::error::${BASE_BRANCH} has no commits after tag '${LATEST_TAG}'. Merge or push changes before bumping the patch version." >&2
  exit 1
fi

echo "${BASE_BRANCH} is ${COUNT} commit(s) ahead of tag '${LATEST_TAG}'."
