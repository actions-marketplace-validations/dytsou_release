#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expandBody, resolveTag } from "./resolve-tag.mjs";
import {
  appendGithubOutput,
  assertSafeRelativePath,
  assertSemverVersion,
  redactTokenShapes,
} from "./validate.mjs";

// Fixed PATH so child processes cannot inherit a attacker-controlled PATH (Sonar S4036).
const GIT_ENV = Object.freeze({
  PATH: "/usr/bin:/bin",
  LANG: "C.UTF-8",
  LC_ALL: "C.UTF-8",
});

function git(args, opts = {}) {
  return execFileSync("/usr/bin/git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: GIT_ENV,
    ...opts,
  }).trim();
}

function readPackageVersion(packageJsonPath) {
  const rel = assertSafeRelativePath(packageJsonPath, "package-json-path");
  const abs = path.resolve(process.env.GITHUB_WORKSPACE || process.cwd(), rel);
  if (!fs.existsSync(abs)) {
    throw new Error(`package.json not found: ${abs}`);
  }
  const pkg = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (typeof pkg.version !== "string" || !pkg.version.trim()) {
    throw new Error(`Missing string "version" in ${abs}`);
  }
  return assertSemverVersion(pkg.version);
}

export function isPrereleaseVersion(version) {
  return /(?:^|-)(alpha|beta|rc)(?:\.|$)/i.test(version) || version.includes("-");
}

function buildCommitNotes(version) {
  let previousTag = "";
  try {
    const tags = git(["tag", "--sort=-creatordate"]).split("\n").filter(Boolean);
    previousTag = tags[1] || "";
  } catch {
    previousTag = "";
  }

  if (!previousTag) {
    return redactTokenShapes(`## Release ${version}

Initial release.

---
*This release was automatically created by GitHub Actions*`);
  }

  let commits = "";
  try {
    commits = git(["log", `${previousTag}..HEAD`, "--pretty=format:- %s", "--no-merges"]);
  } catch {
    commits = "";
  }

  return redactTokenShapes(`## Release ${version}

### Changes since ${previousTag}

${commits}

---
*This release was automatically created by GitHub Actions*`);
}

/**
 * Sync a semver tag from package.json: create/push if missing, verify on tag push,
 * and build commit-based release notes.
 */
export function syncFromPackageJson({
  packageJsonPath = "package.json",
  ref = "",
  createMissingTag = true,
  commitNotes = true,
  extraBody = "",
} = {}) {
  const packageVersion = readPackageVersion(packageJsonPath);
  const onTag = ref.startsWith("refs/tags/");

  if (onTag) {
    const tagVersion = assertSemverVersion(ref.replace(/^refs\/tags\/v/, ""));
    if (tagVersion !== packageVersion) {
      throw new Error(
        `Version mismatch! Tag version (${tagVersion}) does not match package.json version (${packageVersion})`,
      );
    }
  }

  const tagName = `v${packageVersion}`;
  resolveTag({ tagInput: tagName }); // validate shape

  git(["fetch", "--tags"]);

  let tagExists = false;
  try {
    git(["rev-parse", tagName]);
    tagExists = true;
  } catch {
    tagExists = false;
  }

  if (!tagExists) {
    if (onTag) {
      throw new Error(`Tag ${tagName} should exist when triggered by a tag push`);
    }
    if (!createMissingTag) {
      throw new Error(`Tag ${tagName} does not exist (create-missing-tag=false)`);
    }
    git(["config", "user.name", "github-actions[bot]"]);
    git(["config", "user.email", "github-actions[bot]@users.noreply.github.com"]);
    git(["tag", "-a", tagName, "-m", `Release ${packageVersion}`]);
    git(["push", "origin", tagName]);
    console.log(`Created and pushed tag: ${tagName}`);
  } else {
    console.log(`Tag ${tagName} already exists`);
  }

  const resolved = resolveTag({ tagInput: tagName });
  // Prefer package.json prerelease markers (alpha/beta/rc) even without hyphenated tags.
  const prerelease = resolved.prerelease || isPrereleaseVersion(packageVersion);
  const notes = commitNotes ? buildCommitNotes(packageVersion) : "";
  const body = [notes, expandBody(extraBody, resolved)].filter(Boolean).join("\n\n");

  return {
    version: packageVersion,
    tag: resolved.tag,
    major: resolved.major,
    prerelease,
    body,
  };
}

function main() {
  const result = syncFromPackageJson({
    packageJsonPath: process.env.INPUT_PACKAGE_JSON_PATH || "package.json",
    ref: process.env.GITHUB_REF || "",
    createMissingTag: (process.env.INPUT_CREATE_MISSING_TAG || "true") === "true",
    commitNotes: (process.env.INPUT_COMMIT_NOTES || "true") === "true",
    extraBody: process.env.INPUT_BODY || "",
  });

  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    appendGithubOutput(out, "version", result.version);
    appendGithubOutput(out, "tag", result.tag);
    appendGithubOutput(out, "major", result.major);
    appendGithubOutput(out, "prerelease", String(result.prerelease));
    appendGithubOutput(out, "body", result.body);
  }
  console.log(
    `Synced tag=${result.tag} version=${result.version} prerelease=${result.prerelease}`,
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
