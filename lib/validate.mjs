#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import path from "node:path";

/** npm-style name: optional @scope/ then package (no shell metacharacters). */
const NPM_NAME_RE =
  /^(?:@[A-Za-z0-9][A-Za-z0-9._-]{0,213}\/)?[A-Za-z0-9][A-Za-z0-9._-]{0,213}$/;

/** Semver core + optional pre-release / build (no spaces or shell meta). */
const SEMVER_RE =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

/** GitHub Actions expression that would expand secrets into published text. */
const SECRET_EXPR_RE = /\$\{\{\s*(?:secrets\.|secrets\[|github\.token\b)/i;

export function assertNpmPackageName(name) {
  const n = String(name ?? "").trim();
  if (!n || n.length > 214 || !NPM_NAME_RE.test(n)) {
    throw new Error(`Invalid npm package name: ${JSON.stringify(name)}`);
  }
  return n;
}

export function assertSemverVersion(version) {
  let v = String(version ?? "").trim();
  if (v.startsWith("v") || v.startsWith("V")) {
    v = v.slice(1);
  }
  if (!v || !SEMVER_RE.test(v)) {
    throw new Error(`Invalid semver version: ${JSON.stringify(version)}`);
  }
  return v;
}

export function assertNpmScope(scope) {
  const s = String(scope ?? "").trim();
  if (!s) return "";
  if (!/^@[A-Za-z0-9][A-Za-z0-9._-]{0,213}$/.test(s)) {
    throw new Error(`Invalid npm scope: ${JSON.stringify(scope)}`);
  }
  return s;
}

/** Relative path only; no `..` segments (trust-boundary for package.json path). */
export function assertSafeRelativePath(relPath, label = "path") {
  const p = String(relPath ?? "").trim();
  if (!p) throw new Error(`${label} is required`);
  if (path.isAbsolute(p) || path.win32.isAbsolute(p)) {
    throw new Error(`${label} must be relative: ${JSON.stringify(relPath)}`);
  }
  const norm = path.posix.normalize(p.replaceAll("\\", "/"));
  if (norm.startsWith("../") || norm === ".." || norm.includes("/../")) {
    throw new Error(`${label} must not contain '..': ${JSON.stringify(relPath)}`);
  }
  return p;
}

export function assertNoSecretExpressions(text, label = "body") {
  const s = String(text ?? "");
  if (SECRET_EXPR_RE.test(s)) {
    throw new Error(
      `${label} must not contain \${{ secrets.* }} or \${{ github.token }} (would leak into release notes)`,
    );
  }
  return s;
}

export function redactTokenShapes(text) {
  // Fresh regex each call — global lastIndex must not leak across invocations.
  return String(text ?? "").replaceAll(
    /\b(?:ghp|gho|ghu|ghs|ghr)_\w{20,}\b|\bgithub_pat_\w{20,}\b/g,
    "[redacted]",
  );
}

/** Append a GitHub Actions output; multiline values use a collision-resistant delimiter. */
export function appendGithubOutput(file, key, value) {
  if (!/^[A-Za-z_]\w*$/.test(key)) {
    throw new Error(`Invalid output key: ${JSON.stringify(key)}`);
  }
  const v = String(value ?? "");
  if (!/[\r\n]/.test(v)) {
    appendFileSync(file, `${key}=${v}\n`);
    return;
  }
  let delim;
  do {
    delim = `ghadelim_${randomBytes(16).toString("hex")}`;
  } while (v.includes(delim));
  appendFileSync(file, `${key}<<${delim}\n${v}\n${delim}\n`);
}
