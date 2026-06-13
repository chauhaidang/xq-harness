#!/usr/bin/env node

/**
 * Detect version bumps in publishable modules under modules/xq-*.
 * Writes GitHub Actions outputs when GITHUB_OUTPUT is set.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const modulesDir = path.join(__dirname, '..', 'modules');
const publishPrefixes = ['xq-common-kit', 'xq-test-utils', 'xq-test-infra', 'xq-test-harness'];
const changedPackages = [];
let versionChanged = false;

const packageDirs = fs
  .readdirSync(modulesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  .filter((name) => publishPrefixes.includes(name));

for (const pkgName of packageDirs) {
  const pkgJsonPath = path.join(modulesDir, pkgName, 'package.json');

  if (!fs.existsSync(pkgJsonPath)) {
    continue;
  }

  try {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    const versionNow = pkgJson.version;

    if (!versionNow) {
      continue;
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

    if (versionNow !== versionPrev) {
      versionChanged = true;
      changedPackages.push(pkgName);
      console.error(
        `Package ${pkgName} version changed: ${versionPrev || '(new)'} -> ${versionNow}`,
      );
    }
  } catch (error) {
    console.error(`Error processing ${pkgName}:`, error.message);
  }
}

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
