import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveTag } from "./resolve-tag.mjs";
import { isPrereleaseVersion } from "./sync-from-package-json.mjs";

test("resolveTag used by sync path", () => {
  assert.equal(resolveTag({ tagInput: "v2.5.2" }).tag, "v2.5.2");
  assert.throws(() => resolveTag({ tagInput: "2.5.2" }), /look like/);
});

test("isPrereleaseVersion", () => {
  assert.equal(isPrereleaseVersion("2.5.2"), false);
  assert.equal(isPrereleaseVersion("2.5.2-beta.1"), true);
  assert.equal(isPrereleaseVersion("1.0.0-rc.1"), true);
});
