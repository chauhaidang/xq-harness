#!/usr/bin/env node

/**
 * Validate modules.yaml depends_on matches package.json portal: sibling links.
 *
 * Usage:
 *   node scripts/check-module-deps.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const registryPath = path.join(root, 'modules.yaml');

function readRegistry() {
  const json = execSync('yq -o=json ".modules" modules.yaml', {
    cwd: root,
    encoding: 'utf8',
  });
  return JSON.parse(json);
}

function readPortalDeps(modulePath) {
  const pkgJsonPath = path.join(modulePath, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    return null;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const sections = [pkg.dependencies, pkg.devDependencies].filter(Boolean);
  const portal = [];

  for (const section of sections) {
    for (const spec of Object.values(section)) {
      if (typeof spec === 'string' && spec.startsWith('portal:')) {
        const rel = spec.slice('portal:'.length);
        const resolved = path.basename(path.resolve(modulePath, rel));
        portal.push(resolved);
      }
    }
  }

  return [...new Set(portal)].sort();
}

function readDependsOn(entry) {
  const deps = entry.depends_on;
  if (!deps) {
    return [];
  }
  return [...deps].sort();
}

function main() {
  if (!fs.existsSync(registryPath)) {
    console.error('error: modules.yaml not found');
    process.exit(1);
  }

  try {
    execSync('yq --version', { stdio: 'ignore' });
  } catch {
    console.error('error: yq is required (https://github.com/mikefarah/yq)');
    process.exit(1);
  }

  const modules = readRegistry();
  let failed = false;

  for (const [name, entry] of Object.entries(modules)) {
    const modulePath = path.join(root, entry.path);
    const portalDeps = readPortalDeps(modulePath);

    if (portalDeps === null) {
      continue;
    }

    const dependsOn = readDependsOn(entry);

    const missingInYaml = portalDeps.filter((dep) => !dependsOn.includes(dep));
    const missingInPkg = dependsOn.filter((dep) => !portalDeps.includes(dep));

    if (missingInYaml.length === 0 && missingInPkg.length === 0) {
      console.error(`ok  ${name}: depends_on matches portal: [${dependsOn.join(', ') || 'none'}]`);
      continue;
    }

    failed = true;
    console.error(`FAIL ${name}:`);
    if (missingInYaml.length > 0) {
      console.error(`  portal: present but missing from modules.yaml depends_on: ${missingInYaml.join(', ')}`);
    }
    if (missingInPkg.length > 0) {
      console.error(`  depends_on present but missing portal: in package.json: ${missingInPkg.join(', ')}`);
    }
    console.error(`  depends_on: [${dependsOn.join(', ') || 'none'}]`);
    console.error(`  portal:     [${portalDeps.join(', ') || 'none'}]`);
  }

  if (failed) {
    console.error('\nFix modules.yaml depends_on and package.json portal: links, then re-run.');
    process.exit(1);
  }

  console.error('\nAll module dependency seams are aligned.');
}

main();
