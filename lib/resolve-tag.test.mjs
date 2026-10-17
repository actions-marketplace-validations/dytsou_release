import assert from "node:assert/strict";
import { expandBody, resolveTag } from "./resolve-tag.mjs";

assert.deepEqual(resolveTag({ tagInput: "v1.2.3" }), {
  tag: "v1.2.3",
  major: "v1",
  prerelease: false,
});
assert.deepEqual(resolveTag({ refName: "v0.1.0-rc.1", eventName: "push" }), {
  tag: "v0.1.0-rc.1",
  major: "v0",
  prerelease: true,
});
assert.throws(() => resolveTag({ eventName: "workflow_dispatch" }), /required/);
assert.throws(() => resolveTag({ tagInput: "1.2.3" }), /look like/);
assert.equal(
  expandBody("## Foo __TAG__ (@__MAJOR__)", { tag: "v1.0.0", major: "v1" }),
  "## Foo v1.0.0 (@v1)",
);

console.log("ok");
