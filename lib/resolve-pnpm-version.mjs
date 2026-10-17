#!/usr/bin/env node
// Resolve pnpm version for pnpm/action-setup when callers lack packageManager.
import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT = "10";

export function resolvePnpmVersion({
  inputVersion = "",
  packageJsonPath = "package.json",
  cwd = process.cwd(),
} = {}) {
  const explicit = String(inputVersion ?? "").trim();
  if (explicit) return explicit;

  try {
    const pkg = JSON.parse(
      readFileSync(resolve(cwd, packageJsonPath), "utf8"),
    );
    const match = /^pnpm@([^+\s]+)/.exec(String(pkg.packageManager ?? ""));
    if (match) return match[1];
  } catch {
    // missing / invalid package.json → default
  }

  return DEFAULT;
}

function main() {
  const cwd = process.env.GITHUB_WORKSPACE
    ? resolve(
        process.env.GITHUB_WORKSPACE,
        process.env.INPUT_WORKING_DIRECTORY || ".",
      )
    : process.cwd();
  const version = resolvePnpmVersion({
    inputVersion: process.env.INPUT_PNPM_VERSION,
    packageJsonPath: process.env.INPUT_PACKAGE_JSON_PATH || "package.json",
    cwd,
  });
  const line = `version=${version}\n`;
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, line);
  } else {
    process.stdout.write(line);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
