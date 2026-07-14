#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const args = parseArgs(process.argv);
const currentPath = path.join("modules", args.module, args.versionFile);
const currentVersion = readFile(currentPath);
const previousVersion = readPreviousFile(currentPath);
const versionChanged = currentVersion !== previousVersion;

const result = {
  module: args.module,
  version_file: currentPath,
  previous_version: previousVersion,
  current_version: currentVersion,
  version_changed: versionChanged,
};
console.log(JSON.stringify(result));

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `version_changed=${versionChanged}\n`);
}

function parseArgs(argv) {
  const parsed = { module: "", versionFile: "VERSION" };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--module") parsed.module = argv[++index] ?? "";
    if (argv[index] === "--version-file") parsed.versionFile = argv[++index] ?? "VERSION";
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(parsed.module)) {
    throw new Error("--module must be a module key");
  }
  if (!/^[a-zA-Z0-9._/-]+$/.test(parsed.versionFile) || parsed.versionFile.includes("..")) {
    throw new Error("--version-file must be a repository-relative path without '..'");
  }
  return parsed;
}

function readFile(relativePath) {
  const value = fs.readFileSync(relativePath, "utf8").trim();
  if (!value) throw new Error(`Version file is empty: ${relativePath}`);
  return value;
}

function readPreviousFile(relativePath) {
  try {
    return execFileSync("git", ["show", `HEAD^:${relativePath}`], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}
