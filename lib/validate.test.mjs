import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  appendGithubOutput,
  assertNpmPackageName,
  assertNpmScope,
  assertSafeRelativePath,
  assertSemverVersion,
  redactTokenShapes,
} from "./validate.mjs";

test("assertNpmPackageName", () => {
  assert.equal(assertNpmPackageName("@dytsou/demo"), "@dytsou/demo");
  assert.equal(assertNpmPackageName("raycast-rsync-extension"), "raycast-rsync-extension");
  assert.throws(() => assertNpmPackageName('foo"; rm -rf /'), /Invalid npm package name/);
  assert.throws(() => assertNpmPackageName("foo bar"), /Invalid npm package name/);
  assert.throws(() => assertNpmPackageName("$(whoami)"), /Invalid npm package name/);
});

test("assertSemverVersion", () => {
  assert.equal(assertSemverVersion("1.2.3"), "1.2.3");
  assert.equal(assertSemverVersion("v2.0.0-beta.1"), "2.0.0-beta.1");
  assert.throws(() => assertSemverVersion("1.2"), /Invalid semver/);
  assert.throws(() => assertSemverVersion("1.2.3; echo hi"), /Invalid semver/);
});

test("assertNpmScope and assertSafeRelativePath", () => {
  assert.equal(assertNpmScope("@dytsou"), "@dytsou");
  assert.equal(assertNpmScope(""), "");
  assert.throws(() => assertNpmScope("dytsou"), /Invalid npm scope/);
  assert.equal(assertSafeRelativePath("package.json"), "package.json");
  assert.throws(() => assertSafeRelativePath("../etc/passwd"), /\.\./);
  assert.throws(() => assertSafeRelativePath("/tmp/x"), /relative/);
});

test("token redaction", () => {
  assert.match(
    redactTokenShapes("leak ghp_abcdefghijklmnopqrstuvwxyz012345 and done"),
    /\[redacted\]/,
  );
  // Docs may include escaped `${{ secrets.* }}` literals; do not reject those.
  assert.equal(
    redactTokenShapes("npm-token: ${{ secrets.NPM_TOKEN }}"),
    "npm-token: ${{ secrets.NPM_TOKEN }}",
  );
});

test("appendGithubOutput uses random delimiter for multiline", () => {
  const dir = mkdtempSync(join(tmpdir(), "ghout-"));
  const out = join(dir, "out");
  try {
    appendGithubOutput(out, "name", "@dytsou/x");
    appendGithubOutput(out, "body", "line1\nEOF\nline3");
    const text = readFileSync(out, "utf8");
    assert.match(text, /^name=@dytsou\/x$/m);
    assert.match(text, /^body<<ghadelim_[0-9a-f]+$/m);
    assert.ok(text.includes("line1\nEOF\nline3"));
    assert.ok(!text.includes("body<<EOF\n"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
