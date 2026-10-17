# Release

從 semver tag（`v1.2.3`）建立 **GitHub Release**，並／或 **publish 到 npm**。

[![GitHub release](https://img.shields.io/github/v/release/dytsou/release)](https://github.com/dytsou/release/releases)
[![CI](https://github.com/dytsou/release/actions/workflows/ci.yml/badge.svg)](https://github.com/dytsou/release/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](README.md) · [繁體中文](README-zh.md)

## 目錄

- [快速開始](#快速開始)
- [Actions](#actions)
- [行為](#行為)
- [輸入](#輸入)
- [Caller 契約](#caller-契約)
- [支援](#支援)
- [貢獻](#貢獻)
- [重要說明](#重要說明)

## 快速開始

1. **先 checkout 完整歷史** — 這些 Action 不會 checkout。請使用 `fetch-depth: 0`。
2. **加入 caller workflow**（通常由 tag push 觸發）：

### 只做 GitHub Release

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

### 只做 npm publish

```yaml
- uses: dytsou/release/npm@v1
  with:
    npm-token: ${{ secrets.NPM_TOKEN }}
```

### 兩者都做（root action）

```yaml
- uses: dytsou/release@v1
  with:
    github-release: "true"
    npm-publish: "true"
    npm-token: ${{ secrets.NPM_TOKEN }}
    body: |
      ## My Project __TAG__

      Pin major tag `@__MAJOR__` for floating updates.
```

3. **推送 tag** `v1.2.3`（或用 `workflow_dispatch` 帶該 tag）。

Major tag（`@v1`）會跟著同 major 浮動；固定版本請用 `@v1.0.0` 或 commit SHA。

## Actions


| Action | 用途 |
| ------ | ---- |
| `dytsou/release/github@v1` | GitHub Release + 可選 major tag |
| `dytsou/release/npm@v1` | `npm publish` |
| `dytsou/release@v1` | 合併版（用 `github-release` / `npm-publish` 開關） |

## 行為

1. 從 input 或 `github.ref_name` 解析 tag（`vX.Y.Z`，可含 prerelease）。
2. **GitHub：** 建立 release；非 prerelease 時強制移動 major tag（`v1` → 此 tag）。
3. **npm：** `npm publish`（prerelease 預設 dist-tag `next`，除非有設 `npm-tag`）。

Body 佔位符：`__TAG__`、`__MAJOR__`。

## 輸入

詳見各 `action.yml`。常見：

| 名稱 | 預設 | 說明 |
| :--- | :--- | :--- |
| `tag` | _(ref name)_ | `v1.2.3` |
| `body` | _(空)_ | 額外的 GitHub release body |
| `move-major-tag` | `true` | 更新 `vN` tag（GitHub） |
| `npm-token` | — | npm 必填 |
| `npm-access` | `public` | `npm publish --access` |

## Caller 契約

### 前置條件

1. 建立 GitHub release／移動 tag 時，job 需 `permissions: contents: write`
2. 呼叫前先 checkout（`fetch-depth: 0`）
3. publish npm 時需要 `NPM_TOKEN` secret

### 本倉庫本地檢查

```bash
node lib/resolve-tag.test.mjs
```

## 支援

若行為不如預期：

- 確認 tag 符合 `v1.2.3`（一定要有前綴 `v`）
- 確認移動 major tag 前有用 `fetch-depth: 0` checkout
- 開 [issue](https://github.com/dytsou/release/issues) 並附上失敗的 workflow run URL（請遮罩 secrets）

### 常見狀況


| 你看到的現象 | 可能原因 |
| ------------ | -------- |
| `tag must look like v1.2.3` | 缺少 `v` 或 semver 不合法 |
| `tag input is required for workflow_dispatch` | 手動執行時要傳 `tag:` |
| `npm-token is required` | `npm-publish=true` 但沒給 secret／input |
| Major tag 沒更新 | 是 prerelease，或 `move-major-tag=false` |

## 貢獻

歡迎貢獻 — 見 [CONTRIBUTING.md](CONTRIBUTING.md) 與 [Code of Conduct](CODE_OF_CONDUCT.md)。

## 重要說明

> [!IMPORTANT]
> **這些 Action 不會 checkout。** Caller 必須先以完整歷史 checkout。

> [!WARNING]
> 不要在 caller workflow 的 release **body** 範本裡寫 `${{ github.token }}` — Actions 會把它插值進公開的 release notes。

## License

本專案以 [MIT License](LICENSE) 開源。
