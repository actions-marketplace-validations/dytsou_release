import assert from "node:assert/strict";
import { test } from "node:test";
import { bumpPatchVersion } from "./bump-package-json.mjs";

test("bumpPatchVersion increments patch", () => {
  assert.equal(bumpPatchVersion("1.2.3"), "1.2.4");
  assert.equal(bumpPatchVersion("v0.0.9"), "0.0.10");
});

test("bumpPatchVersion rejects invalid semver", () => {
  assert.throws(() => bumpPatchVersion("not-a-version"), /Invalid semver/);
});
