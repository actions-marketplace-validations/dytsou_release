import assert from "node:assert/strict";
import { test } from "node:test";
import { expandBody, resolveTag } from "./resolve-tag.mjs";

test("resolveTag accepts vX.Y.Z", () => {
  assert.deepEqual(resolveTag({ tagInput: "v2.5.2" }), {
    tag: "v2.5.2",
    major: "v2",
    prerelease: false,
  });
});

test("resolveTag accepts prerelease tags", () => {
  assert.deepEqual(resolveTag({ tagInput: "v1.0.0-beta.1" }), {
    tag: "v1.0.0-beta.1",
    major: "v1",
    prerelease: true,
  });
});

test("resolveTag rejects tags without v prefix", () => {
  assert.throws(() => resolveTag({ tagInput: "2.5.2" }), /look like/);
});

test("expandBody replaces placeholders and keeps docs secret expressions", () => {
  const resolved = resolveTag({ tagInput: "v1.2.3" });
  assert.equal(expandBody("rel __TAG__ / __MAJOR__", resolved), "rel v1.2.3 / v1");
  assert.equal(
    expandBody("npm-token: ${{ secrets.NPM_TOKEN }}", resolved),
    "npm-token: ${{ secrets.NPM_TOKEN }}",
  );
  assert.match(
    expandBody("leak ghp_abcdefghijklmnopqrstuvwxyz012345", resolved),
    /\[redacted\]/,
  );
});
