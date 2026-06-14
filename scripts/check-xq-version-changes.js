#!/usr/bin/env node

/**
 * Detect version bumps in publishable modules under modules/xq-*.
 * Writes GitHub Actions outputs when GITHUB_OUTPUT is set.
 *
 * Usage:
 *   node scripts/check-xq-version-changes.js
 *   node scripts/check-xq-version-changes.js --module xq-common-kit
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const modulesDir = path.join(__dirname, '..', 'modules');
const publishPrefixes = ['xq-common-kit', 'xq-test-utils', 'xq-test-infra', 'xq-test-harness'];

function parseArgs(argv) {
  const args = { module: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--module' && argv[i + 1]) {
      args.module = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function checkPackage(pkgName) {
  const pkgJsonPath = path.join(modulesDir, pkgName, 'package.json');

  if (!fs.existsSync(pkgJsonPath)) {
    return null;
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const versionNow = pkgJson.version;

  if (!versionNow) {
    return null;
  }

  let versionPrev = '';
  try {
    const gitPath = `modules/${pkgName}/package.json`;
    const prevCommit = execSync('git rev-parse HEAD^1 2>/dev/null || echo ""', {
      encoding: 'utf8',
    }).trim();

    if (prevCommit) {
      try {
        const prevPkgJson = execSync(`git show ${prevCommit}:${gitPath} 2>/dev/null`, {
          encoding: 'utf8',
        });
        const prevPkg = JSON.parse(prevPkgJson);
        versionPrev = prevPkg.version || '';
      } catch {
        // new file in previous commit
      }
    }
  } catch {
    // no git history
  }

  if (versionNow === versionPrev) {
    return null;
  }

  console.error(
    `Package ${pkgName} version changed: ${versionPrev || '(new)'} -> ${versionNow}`,
  );
  return pkgName;
}

const { module: singleModule } = parseArgs(process.argv);
const targets = singleModule ? [singleModule] : publishPrefixes;

if (singleModule && !publishPrefixes.includes(singleModule)) {
  console.error(`Unknown or non-publishable module: ${singleModule}`);
  process.exit(1);
}

const changedPackages = [];
for (const pkgName of targets) {
  const changed = checkPackage(pkgName);
  if (changed) {
    changedPackages.push(changed);
  }
}

const versionChanged = changedPackages.length > 0;
const result = {
  version_changed: versionChanged,
  changed_packages: changedPackages,
};
console.log(JSON.stringify(result));

const githubOutput = process.env.GITHUB_OUTPUT;
if (githubOutput) {
  fs.appendFileSync(githubOutput, `version_changed=${versionChanged}\n`);
  fs.appendFileSync(githubOutput, `changed_packages=${JSON.stringify(changedPackages)}\n`);
}
