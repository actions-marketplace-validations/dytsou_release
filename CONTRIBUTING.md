# Contributing to [release](https://github.com/dytsou/release)

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting [an issue](https://github.com/dytsou/release/issues/new).
- Discussing the current state of the code.
- Submitting [a fix](https://github.com/dytsou/release/compare).
- Proposing [new features](https://github.com/dytsou/release/issues/new).
- Becoming a maintainer.

Please also read our [Code of Conduct](CODE_OF_CONDUCT.md).

## All Changes Happen Through Pull Requests

Pull requests are the best way to propose changes. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, extend the matching `lib/*.test.mjs`.
3. If you've changed Action inputs, outputs, or caller requirements, update `README.md` / `README-zh.md`.
4. Run the local checks (see [Local development](#local-development)).
5. Open that pull request!

## Under the hood

This repository is a set of **composite GitHub Actions**:

| Path | Role |
| ---- | ---- |
| `github/` | GitHub Release + optional major tag + optional `from-package-json` |
| `package-json/` | Preset for `from-package-json=true` |
| `npm-publish/` | Publish to **npmjs** (skip if version exists) |
| `github-packages/` | Publish to **GitHub Packages** (skip if version exists) |
| `./` (root) | Combined entry (release + optional registry publishes) |
| `lib/` | Shared helpers |

Primary entries:

- `dytsou/release/github@v1`
- `dytsou/release/package-json@v1`
- `dytsou/release/npm-publish@v1`
- `dytsou/release/github-packages@v1`
- `dytsou/release@v1` (prefer pinning a commit SHA in production)

## Local development

```bash
node lib/resolve-tag.test.mjs
node lib/sync-from-package-json.test.mjs
node lib/read-package-meta.test.mjs
```

> [!NOTE]
> End-to-end GitHub Release / registry publish need a real repository and tokens; those paths are exercised in consumer CI.

## Any contributions you make will be under the MIT Software License

In short, when you submit changes, your submissions are understood to be under the same [MIT License](https://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report issues/bugs using GitHub's [issues](https://github.com/dytsou/release/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/dytsou/release/issues/new); it's that easy!
