import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const actionFiles = [
  "action.yml",
  "bump-patch-version/action.yml",
  "npm-publish/action.yml",
  "github-packages/action.yml",
  "github/action.yml",
  "package-json/action.yml",
];

for (const rel of actionFiles) {
  const text = readFileSync(join(root, rel), "utf8");
  const refs = [...text.matchAll(/\$\{\{\s*github\.action_path\s*\}\}(\/\.\.\/lib\/[^\s"']+)/g)].map(
    (m) => m[1].replace(/^\//, ""),
  );
  for (const ref of refs) {
    // ref like ../lib/foo.mjs relative to action dir
    const actionDir = join(root, dirname(rel));
    const resolved = join(actionDir, ref);
    assert.ok(existsSync(resolved), `${rel} → missing ${resolved}`);
  }
}

console.log("check-action-paths: ok");
