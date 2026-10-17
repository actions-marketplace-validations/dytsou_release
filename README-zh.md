# Release

從 semver tag（`v1.2.3`）建立 **GitHub Release**，並／或 **publish 到 npm**。

可選：從 `package.json` 同步 tag（缺了就建立 + commit notes）。

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
2. **加入 caller workflow**：

### 只做 GitHub Release（tag 已存在）

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

### 從 package.json（optional）

版本以 `package.json` 為準時開啟（可建缺的 tag、在 tag push 時驗證、產生 commit notes）：

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
          create-missing-tag: "true" # 可選，預設 true
          commit-notes: "true" # 可選，預設 true
          move-major-tag: "false"
```

便利預設（等同 `from-package-json: "true"`，且 `move-major-tag` 預設 `false`）：

```yaml
- uses: dytsou/release/package-json@v1
```

### 只做 npm publish

```yaml
- uses: dytsou/release/npm@v1
  with:
    npm-token: ${{ secrets.NPM_TOKEN }}
```

### GitHub + npm（root action）

```yaml
- uses: dytsou/release@v1
  with:
    github-release: "true"
    npm-publish: "true"
    npm-token: ${{ secrets.NPM_TOKEN }}
    # 可選：
    # from-package-json: "true"
    body: |
      ## My Project __TAG__

      Pin major tag `@__MAJOR__` for floating updates.
```

3. **推送 tag** `v1.2.3`、在 `main` 改 `package.json` 版本（並開 `from-package-json`），或跑 `workflow_dispatch`。

Major tag（`@v1`）會跟著同 major 浮動；固定版本請用 `@v1.1.0` 或 commit SHA。

## Actions


| Action | 用途 |
| ------ | ---- |
| `dytsou/release/github@v1` | GitHub Release + 可選 major tag；可選 `from-package-json` |
| `dytsou/release/package-json@v1` | 預設：`from-package-json=true`（major tag 預設關閉） |
| `dytsou/release/npm@v1` | `npm publish` |
| `dytsou/release@v1` | 合併 GitHub + npm（同樣支援 package.json sync） |

## 行為

### 預設（`from-package-json: false`）

1. 從 input 或 `github.ref_name` 解析 tag（`vX.Y.Z`，可含 prerelease）。
2. **GitHub：** 建立 release；非 prerelease 且 `move-major-tag` 開啟時，強制移動 major tag（`v1` → 此 tag）。
3. **npm：** `npm publish`（prerelease 預設 dist-tag `next`，除非有設 `npm-tag`）。

### 可選 package.json sync（`from-package-json: true`）

1. 讀取 `package.json` 的 `version`。
2. 若由 tag push 觸發，要求 tag `v{version}` 與 `package.json` 一致。
3. 否則在 `create-missing-tag` 為 true 時，缺 tag 就建立並 push `v{version}`。
4. 若 `commit-notes` 為 true，在 body 前加上自上一個 tag 起的 commit list。
5. 建立 GitHub Release。

Body 佔位符：`__TAG__`、`__MAJOR__`。

## 輸入

詳見各 `action.yml`。常見：

| 名稱 | 預設 | 說明 |
| :--- | :--- | :--- |
| `tag` | _(ref name)_ | `v1.2.3`（`from-package-json=true` 時忽略） |
| `body` | _(空)_ | 額外的 GitHub release body |
| `from-package-json` | `false` | 從 `package.json` 同步 tag／notes |
| `package-json-path` | `package.json` | `from-package-json=true` 時使用的路徑 |
| `create-missing-tag` | `true` | 缺 `v{version}` 時建立（package.json 模式） |
| `commit-notes` | `true` | commit list notes（package.json 模式） |
| `move-major-tag` | `true`（`package-json` 預設為 `false`） | 更新 `vN` tag |
| `npm-token` | — | npm 必填 |
| `npm-access` | `public` | `npm publish --access` |

## Caller 契約

### 前置條件

1. 建立 GitHub release／建 tag／移動 tag 時，job 需 `permissions: contents: write`
2. 呼叫前先 checkout（`fetch-depth: 0`）
3. publish npm 時需要 `NPM_TOKEN` secret

### 本倉庫本地檢查

```bash
node lib/resolve-tag.test.mjs
node lib/sync-from-package-json.test.mjs
```

## 支援

若行為不如預期：

- 確認 tag 符合 `v1.2.3`（一定要有前綴 `v`）
- 確認移動／建立 tag 前有用 `fetch-depth: 0` checkout
- 開 [issue](https://github.com/dytsou/release/issues) 並附上失敗的 workflow run URL（請遮罩 secrets）

### 常見狀況


| 你看到的現象 | 可能原因 |
| ------------ | -------- |
| `tag must look like v1.2.3` | 缺少 `v` 或 semver 不合法 |
| `tag input is required for workflow_dispatch` | 手動執行要傳 `tag:`（除非 `from-package-json=true`） |
| `Version mismatch!` | tag `v…` 與 `package.json` version 不一致 |
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
