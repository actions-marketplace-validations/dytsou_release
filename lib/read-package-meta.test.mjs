import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readPackageMeta } from "./read-package-meta.mjs";

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
}
console.log("ok");
