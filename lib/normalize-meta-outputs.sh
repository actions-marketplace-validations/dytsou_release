#!/usr/bin/env bash
# Normalize resolve/sync step outputs into a single meta step (safe multiline body).
set -euo pipefail

write_multiline() {
  local key="$1"
  local value="$2"
  local delim
  delim="ghadelim_$(openssl rand -hex 16)"
  while [[ "${value}" == *"${delim}"* ]]; do
    delim="ghadelim_$(openssl rand -hex 16)"
  done
  {
    printf '%s<<%s\n' "${key}" "${delim}"
    printf '%s\n' "${value}"
    printf '%s\n' "${delim}"
  } >>"${GITHUB_OUTPUT}"
}

write_line() {
  local key="$1"
  local value="$2"
  if [[ "${value}" == *$'\n'* || "${value}" == *$'\r'* ]]; then
    echo "::error::${key} must be a single line" >&2
    exit 1
  fi
  printf '%s=%s\n' "${key}" "${value}" >>"${GITHUB_OUTPUT}"
}

if [[ "${FROM_PKG}" == "true" ]]; then
  write_line version "${SYNC_VERSION}"
  write_line tag "${SYNC_TAG}"
  write_line major "${SYNC_MAJOR}"
  write_line prerelease "${SYNC_PRERELEASE}"
  write_multiline body "${SYNC_BODY}"
else
  write_line version ""
  write_line tag "${RESOLVE_TAG}"
  write_line major "${RESOLVE_MAJOR}"
  write_line prerelease "${RESOLVE_PRERELEASE}"
  write_multiline body "${RESOLVE_BODY}"
fi
