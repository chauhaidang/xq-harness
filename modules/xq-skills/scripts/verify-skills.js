#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const moduleRoot = path.resolve(__dirname, "..");
const skillsDir = path.join(moduleRoot, "skills");

if (!fs.existsSync(skillsDir)) {
  console.error("[xq-skills] Missing skills directory.");
  process.exit(1);
}

const skillDirs = fs
  .readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (skillDirs.length === 0) {
  console.error("[xq-skills] No skills found.");
  process.exit(1);
}

for (const skill of skillDirs) {
  const skillFile = path.join(skillsDir, skill, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    console.error(`[xq-skills] Missing ${path.relative(moduleRoot, skillFile)}.`);
    process.exit(1);
  }
}

console.log(`[xq-skills] Verified ${skillDirs.length} skills.`);
