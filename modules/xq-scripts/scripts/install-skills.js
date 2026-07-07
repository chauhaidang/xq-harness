#!/usr/bin/env node
/**
 * install-skills.js
 *
 * Scans installed XQ packages for a skills/ directory and copies
 * the skill files into the consumer project's .agents/skills/ directory so that
 * agent tooling (e.g. Cursor `.agents/skills/`) can discover and use them.
 *
 * Usage (run from the consumer project root after installing packages):
 *   node path/to/install-skills.js
 *   node path/to/install-skills.js --include-global
 *   # or, if released as part of xq-scripts tarball and placed on PATH:
 *   install-skills.js
 *
 * Safe to re-run — existing skill directories are overwritten with the latest
 * version from node_modules. With --include-global, project-local skills win
 * over globally installed skills with the same name.
 * Exits silently if the consumer project has no .agents/ directory.
 */

"use strict";

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const args = new Set(process.argv.slice(2));
const includeGlobal = args.has("--include-global");

if (args.has("-h") || args.has("--help")) {
  console.log(`Usage: install-skills.js [--include-global]

Copies skills from installed XQ packages into .agents/skills/.

Options:
  --include-global  Also scan globally installed npm packages
  -h, --help        Show this help
`);
  process.exit(0);
}

// ─── Locate consumer project root ────────────────────────────────────────────

function findProjectRoot(dir) {
  if (fs.existsSync(path.join(dir, "package.json"))) return dir;
  const parent = path.dirname(dir);
  if (parent === dir) return null;
  return findProjectRoot(parent);
}

const projectRoot = findProjectRoot(process.cwd());
if (!projectRoot) {
  console.error("[install-skills] Could not locate a package.json. Skipping.");
  process.exit(0);
}

// Opt-in only: exit silently if the consumer has no .agents/ or .agent/ directory.
const agentsDirName = fs.existsSync(path.join(projectRoot, ".agents"))
  ? ".agents"
  : fs.existsSync(path.join(projectRoot, ".agent"))
    ? ".agent"
    : null;
if (!agentsDirName) {
  process.exit(0);
}
const agentsSkillsDir = path.join(projectRoot, agentsDirName, "skills");

// ─── Copy helper ─────────────────────────────────────────────────────────────

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ─── Discover skills from installed XQ packages ──────────────────────────────

const UNSCOPED_XQ_PACKAGES = ["xq-octopus"];

function getGlobalNodeModules() {
  try {
    return childProcess
      .execFileSync("npm", ["root", "--global"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
      .trim();
  } catch {
    return null;
  }
}

fs.mkdirSync(agentsSkillsDir, { recursive: true });

const installed = [];

const packageRoots = [];

if (includeGlobal) {
  const globalNodeModules = getGlobalNodeModules();
  if (globalNodeModules) {
    packageRoots.push({ label: "global", nodeModulesDir: globalNodeModules });
  }
}

packageRoots.push({
  label: "project",
  nodeModulesDir: path.join(projectRoot, "node_modules"),
});

function installSkillPackages(label, packageDirs) {
  for (const { packageName, packageDir } of packageDirs) {
    const skillsDir = path.join(packageDir, "skills");
    if (!fs.existsSync(skillsDir)) continue;

    for (const skill of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!skill.isDirectory()) continue;
      const src = path.join(skillsDir, skill.name);
      const dest = path.join(agentsSkillsDir, skill.name);
      copyDir(src, dest);
      installed.push({ pkg: packageName, skill: skill.name, source: label });
    }
  }
}

function discoverScopedPackages(nodeModulesDir) {
  const scopeDir = path.join(nodeModulesDir, "@chauhaidang");
  if (!fs.existsSync(scopeDir)) return [];

  const packageDirs = [];

  for (const pkg of fs.readdirSync(scopeDir, { withFileTypes: true })) {
    if (!pkg.isDirectory()) continue;
    packageDirs.push({
      packageName: `@chauhaidang/${pkg.name}`,
      packageDir: path.join(scopeDir, pkg.name),
    });
  }

  return packageDirs;
}

function discoverUnscopedPackages(nodeModulesDir) {
  const packageDirs = [];

  for (const packageName of UNSCOPED_XQ_PACKAGES) {
    const packageDir = path.join(nodeModulesDir, packageName);
    if (fs.existsSync(packageDir)) {
      packageDirs.push({ packageName, packageDir });
    }
  }

  return packageDirs;
}

for (const { label, nodeModulesDir } of packageRoots) {
  if (!fs.existsSync(nodeModulesDir)) continue;

  installSkillPackages(label, [
    ...discoverScopedPackages(nodeModulesDir),
    ...discoverUnscopedPackages(nodeModulesDir),
  ]);
}

// ─── Report ──────────────────────────────────────────────────────────────────

if (installed.length === 0) {
  console.log("[install-skills] No skills found in installed XQ packages.");
} else {
  console.log(
    `[install-skills] Installed skills to ${path.relative(projectRoot, agentsSkillsDir)}:`,
  );
  for (const { pkg, skill, source } of installed) {
    console.log(`  ✓ ${skill}  (from ${pkg}, ${source})`);
  }
}
