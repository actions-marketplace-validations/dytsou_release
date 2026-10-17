import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { readPackageMeta } from "./read-package-meta.mjs";

test("readPackageMeta reads scoped name and version", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-meta-"));
  const pkgPath = path.join(dir, "package.json");
  fs.writeFileSync(
    pkgPath,
    JSON.stringify({ name: "@dytsou/demo", version: "1.2.3" }),
  );
  const prev = process.cwd();
  process.chdir(dir);
  try {
    assert.deepEqual(readPackageMeta("package.json"), {
      name: "@dytsou/demo",
      version: "1.2.3",
      scope: "@dytsou",
    });
  } finally {
    process.chdir(prev);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("readPackageMeta rejects unsafe names", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-meta-bad-"));
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: 'evil";rm', version: "1.0.0" }),
  );
  const prev = process.cwd();
  process.chdir(dir);
  try {
    assert.throws(() => readPackageMeta("package.json"), /Invalid npm package name/);
  } finally {
    process.chdir(prev);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
