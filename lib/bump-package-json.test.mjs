import assert from "node:assert/strict";
import { bumpPatchVersion } from "./bump-package-json.mjs";

assert.equal(bumpPatchVersion("1.2.3"), "1.2.4");
assert.equal(bumpPatchVersion("v0.0.9"), "0.0.10");
assert.throws(() => bumpPatchVersion("not-a-version"), /Invalid semver/);

console.log("ok");
