#!/usr/bin/env node

const path = require("path");
const { spawnSync } = require("child_process");

const script = path.join(__dirname, "check-registry-version-changes.py");
const result = spawnSync("python3", [script, ...process.argv.slice(2)], {
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
