#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expandBody, resolveTag } from "./resolve-tag.mjs";

function git(args, opts = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  }).trim();
}

function readPackageVersion(packageJsonPath) {
  const abs = path.resolve(process.env.GITHUB_WORKSPACE || process.cwd(), packageJsonPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`package.json not found: ${abs}`);
  }
  const pkg = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (typeof pkg.version !== "string" || !pkg.version.trim()) {
    throw new Error(`Missing string "version" in ${abs}`);
  }
  return pkg.version.trim().replace(/^v/i, "");
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
    return `## Release ${version}

Initial release.

---
*This release was automatically created by GitHub Actions*`;
  }

  let commits = "";
  try {
    commits = git(["log", `${previousTag}..HEAD`, "--pretty=format:- %s", "--no-merges"]);
  } catch {
    commits = "";
  }

  return `## Release ${version}

### Changes since ${previousTag}

${commits}

---
*This release was automatically created by GitHub Actions*`;
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
    const tagVersion = ref.replace(/^refs\/tags\/v/, "");
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
    fs.appendFileSync(out, `version=${result.version}\n`);
    fs.appendFileSync(out, `tag=${result.tag}\n`);
    fs.appendFileSync(out, `major=${result.major}\n`);
    fs.appendFileSync(out, `prerelease=${result.prerelease}\n`);
    fs.appendFileSync(out, `body<<EOF\n${result.body}\nEOF\n`);
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
