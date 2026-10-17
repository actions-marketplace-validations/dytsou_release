#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Bump the patch segment of package.json "version".
 * Does not run npm lifecycle scripts (preversion / version / postversion).
 */
export function bumpPatchVersion(version) {
  const raw = String(version).trim().replace(/^v/i, "");
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(raw);
  if (!match) {
    throw new Error(`Invalid semver version: ${JSON.stringify(version)}`);
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  return `${major}.${minor}.${patch + 1}`;
}

function main() {
  const rel = process.env.INPUT_PACKAGE_JSON_PATH || "package.json";
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const filePath = path.resolve(workspace, rel);

  if (!fs.existsSync(filePath)) {
    throw new Error(`package.json not found: ${filePath}`);
  }

  const pkg = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (typeof pkg.version !== "string") {
    throw new Error(`Missing string "version" in ${filePath}`);
  }

  const next = bumpPatchVersion(pkg.version);
  pkg.version = next;
  fs.writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`);

  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    fs.appendFileSync(out, `version=${next}\n`);
  }
  console.log(`New version: ${next}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (err) {
    console.error(`::error::${err.message}`);
    process.exit(1);
  }
}
