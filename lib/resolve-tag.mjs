#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appendGithubOutput,
  assertNoSecretExpressions,
  redactTokenShapes,
} from "./validate.mjs";

/** @returns {{ tag: string, major: string, prerelease: boolean }} */
export function resolveTag({ tagInput = "", refName = "", eventName = "" } = {}) {
  let tag = String(tagInput || "").trim();
  if (!tag) {
    if (eventName === "workflow_dispatch") {
      throw new Error("tag input is required for workflow_dispatch");
    }
    tag = String(refName || "").trim();
  }
  if (!tag) {
    throw new Error("Could not resolve release tag (empty tag / ref)");
  }
  if (!/^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(tag)) {
    throw new Error(`tag must look like v1.2.3 (got: ${tag})`);
  }
  const major = tag.split(".")[0]; // v1.2.3 → v1
  const prerelease = tag.includes("-");
  return { tag, major, prerelease };
}

export function expandBody(body, { tag, major }) {
  assertNoSecretExpressions(body, "body");
  return redactTokenShapes(
    String(body ?? "")
      .replaceAll("__TAG__", tag)
      .replaceAll("__MAJOR__", major),
  );
}

function main() {
  const resolved = resolveTag({
    tagInput: process.env.INPUT_TAG || "",
    refName: process.env.GITHUB_REF_NAME || "",
    eventName: process.env.GITHUB_EVENT_NAME || "",
  });
  const body = expandBody(process.env.INPUT_BODY || "", resolved);

  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    appendGithubOutput(out, "tag", resolved.tag);
    appendGithubOutput(out, "major", resolved.major);
    appendGithubOutput(out, "prerelease", String(resolved.prerelease));
    appendGithubOutput(out, "body", body);
  }
  console.log(
    `Resolved tag=${resolved.tag} major=${resolved.major} prerelease=${resolved.prerelease}`,
  );
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (err) {
    console.error(`::error::${err.message}`);
    process.exit(1);
  }
}
