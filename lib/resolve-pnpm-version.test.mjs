import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolvePnpmVersion } from "./resolve-pnpm-version.mjs";

const dir = mkdtempSync(join(tmpdir(), "resolve-pnpm-"));
try {
  assert.equal(resolvePnpmVersion({ inputVersion: "9.15.0" }), "9.15.0");
  assert.equal(resolvePnpmVersion({ inputVersion: "  10  " }), "10");

  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ packageManager: "pnpm@12.9.1+sha512.deadbeef" }),
  );
  assert.equal(
    resolvePnpmVersion({ packageJsonPath: "package.json", cwd: dir }),
    "12.9.1",
  );

  writeFileSync(join(dir, "bare.json"), JSON.stringify({ name: "x" }));
  assert.equal(
    resolvePnpmVersion({ packageJsonPath: "bare.json", cwd: dir }),
    "10",
  );

  assert.equal(
    resolvePnpmVersion({
      packageJsonPath: "missing.json",
      cwd: dir,
    }),
    "10",
  );

  console.log("resolve-pnpm-version: ok");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
