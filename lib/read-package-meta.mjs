#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appendGithubOutput,
  assertNpmPackageName,
  assertNpmScope,
  assertSafeRelativePath,
  assertSemverVersion,
} from "./validate.mjs";

export function readPackageMeta(packageJsonPath = "package.json") {
  const rel = assertSafeRelativePath(packageJsonPath, "package-json-path");
  // Prefer cwd so composite `working-directory` is honored.
  const abs = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(abs)) {
    throw new Error(`package.json not found: ${abs}`);
  }
  const pkg = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (typeof pkg.name !== "string" || !pkg.name.trim()) {
    throw new Error(`Missing string "name" in ${abs}`);
  }
  if (typeof pkg.version !== "string" || !pkg.version.trim()) {
    throw new Error(`Missing string "version" in ${abs}`);
  }
  const name = assertNpmPackageName(pkg.name);
  const version = assertSemverVersion(pkg.version);
  const scope = assertNpmScope(name.startsWith("@") ? name.split("/")[0] : "");
  return { name, version, scope };
}

function main() {
  const meta = readPackageMeta(process.env.INPUT_PACKAGE_JSON_PATH || "package.json");
  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    appendGithubOutput(out, "name", meta.name);
    appendGithubOutput(out, "version", meta.version);
    appendGithubOutput(out, "scope", meta.scope);
  }
  console.log(`Package ${meta.name}@${meta.version} (scope=${meta.scope || "(none)"})`);
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
