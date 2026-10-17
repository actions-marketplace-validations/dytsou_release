import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { resolvePnpmVersion } from "./resolve-pnpm-version.mjs";

test("resolvePnpmVersion prefers explicit input", () => {
  assert.equal(resolvePnpmVersion({ inputVersion: "9.15.0" }), "9.15.0");
  assert.equal(resolvePnpmVersion({ inputVersion: "  10  " }), "10");
});

test("resolvePnpmVersion reads packageManager field", () => {
  const dir = mkdtempSync(join(tmpdir(), "resolve-pnpm-"));
  try {
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ packageManager: "pnpm@12.9.1+sha512.deadbeef" }),
    );
    assert.equal(
      resolvePnpmVersion({ packageJsonPath: "package.json", cwd: dir }),
      "12.9.1",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("resolvePnpmVersion defaults to 10", () => {
  const dir = mkdtempSync(join(tmpdir(), "resolve-pnpm-bare-"));
  try {
    writeFileSync(join(dir, "bare.json"), JSON.stringify({ name: "x" }));
    assert.equal(
      resolvePnpmVersion({ packageJsonPath: "bare.json", cwd: dir }),
      "10",
    );
    assert.equal(
      resolvePnpmVersion({ packageJsonPath: "missing.json", cwd: dir }),
      "10",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
