# Release

Create a **GitHub Release** and/or **publish to npm** from a semver tag (`v1.2.3`).

Optionally sync the tag from `package.json` (create missing tag + commit notes).

[![GitHub release](https://img.shields.io/github/v/release/dytsou/release)](https://github.com/dytsou/release/releases)
[![CI](https://github.com/dytsou/release/actions/workflows/ci.yml/badge.svg)](https://github.com/dytsou/release/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](README.md) · [繁體中文](README-zh.md)

## Table of contents

- [Quick Start](#quick-start)
- [Actions](#actions)
- [Behavior](#behavior)
- [Inputs](#inputs)
- [Caller contract](#caller-contract)
- [Support](#support)
- [Contributing](#contributing)
- [Important Notes](#important-notes)

## Quick Start

1. **Checkout with history** — these Actions do not checkout. Use `fetch-depth: 0`.
2. **Add a caller workflow**:

### GitHub Release only (tag already exists)

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ["v*.*.*"]
  workflow_dispatch:
    inputs:
      tag:
        description: Existing tag to publish (e.g. v1.0.0)
        required: true
        type: string

permissions:
  contents: read

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0

      - uses: dytsou/release/github@v1
        with:
          tag: ${{ inputs.tag }}
```

### From package.json (optional)

Enable when the version of record lives in `package.json` (create missing tag, verify on tag push, commit notes):

```yaml
on:
  push:
    branches: [main]
    paths: ["package.json"]
    tags: ["v*.*.*"]
  workflow_dispatch:

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0

      - uses: dytsou/release/github@v1
        with:
          from-package-json: "true"
          create-missing-tag: "true" # optional, default true
          commit-notes: "true" # optional, default true
          move-major-tag: "false"
```

Convenience preset (same as `from-package-json: "true"`, `move-major-tag` default `false`):

```yaml
- uses: dytsou/release/package-json@v1
```

### npm publish only

```yaml
- uses: dytsou/release/npm@v1
  with:
    npm-token: ${{ secrets.NPM_TOKEN }}
```

### Both GitHub + npm (root action)

```yaml
- uses: dytsou/release@v1
  with:
    github-release: "true"
    npm-publish: "true"
    npm-token: ${{ secrets.NPM_TOKEN }}
    # optional:
    # from-package-json: "true"
    body: |
      ## My Project __TAG__

      Pin major tag `@__MAJOR__` for floating updates.
```

3. **Push a tag** `v1.2.3`, change `package.json` version on `main` (with `from-package-json`), or run `workflow_dispatch`.

Pin `@v1` for floating updates within this major, or pin `@v1.1.0` / a commit SHA in production.

## Actions


| Action | Purpose |
| ------ | ------- |
| `dytsou/release/github@v1` | GitHub Release + optional major tag; optional `from-package-json` |
| `dytsou/release/package-json@v1` | Preset: `from-package-json=true` (major tag off by default) |
| `dytsou/release/npm@v1` | `npm publish` |
| `dytsou/release@v1` | Combined GitHub + npm (same optional package.json sync) |

## Behavior

### Default (`from-package-json: false`)

1. Resolve tag from input or `github.ref_name` (`vX.Y.Z`, optional prerelease suffix).
2. **GitHub:** create the release; if not a prerelease, force-move major tag (`v1` → this tag) when `move-major-tag` is enabled.
3. **npm:** `npm publish` (prereleases default to dist-tag `next` unless `npm-tag` is set).

### Optional package.json sync (`from-package-json: true`)

1. Read `version` from `package.json`.
2. On tag push, require tag `v{version}` to match `package.json`.
3. Otherwise, if `create-missing-tag` is true, create and push `v{version}` when missing.
4. If `commit-notes` is true, prepend commit-list notes since the previous tag.
5. Create the GitHub Release.

Body placeholders: `__TAG__`, `__MAJOR__`.

## Inputs

See each `action.yml`. Common:

| Name | Default | Description |
| :--- | :--- | :--- |
| `tag` | _(ref name)_ | `v1.2.3` (ignored when `from-package-json=true`) |
| `body` | _(empty)_ | Extra GitHub release body |
| `from-package-json` | `false` | Sync tag / notes from `package.json` |
| `package-json-path` | `package.json` | Path used when `from-package-json=true` |
| `create-missing-tag` | `true` | Create `v{version}` if missing (package.json mode) |
| `commit-notes` | `true` | Commit-list notes (package.json mode) |
| `move-major-tag` | `true` (`false` on `package-json` preset) | Update `vN` tag |
| `npm-token` | — | Required for npm |
| `npm-access` | `public` | `npm publish --access` |

## Caller contract

### Prerequisites

1. Job `permissions: contents: write` when creating GitHub releases / creating tags / moving tags
2. Checkout before calling (`fetch-depth: 0`)
3. `NPM_TOKEN` secret when publishing to npm

### Local smoke (this repository)

```bash
node lib/resolve-tag.test.mjs
node lib/sync-from-package-json.test.mjs
```

## Support

If something is not working:

- Confirm the tag matches `v1.2.3` (leading `v` required)
- Confirm checkout used `fetch-depth: 0` before moving major tags or creating tags
- Open an [issue](https://github.com/dytsou/release/issues) with the failing workflow run URL (redact secrets)

### When things go wrong


| What you see | Likely cause |
| ------------ | ------------ |
| `tag must look like v1.2.3` | Missing `v` prefix or invalid semver |
| `tag input is required for workflow_dispatch` | Pass `tag:` on manual runs (unless `from-package-json=true`) |
| `Version mismatch!` | Tag `v…` does not match `package.json` version |
| `npm-token is required` | Missing secret / input when `npm-publish=true` |
| Major tag not updated | Prerelease tag, or `move-major-tag=false` |

## Contributing

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md).

## Important Notes

> [!IMPORTANT]
> **These Actions do not checkout.** Callers must checkout first with full history.

> [!WARNING]
> Do not put `${{ github.token }}` literally inside release **body** templates in caller workflows — Actions will interpolate it into the published notes.

## License

This project is open source and available under the [MIT License](LICENSE).
