#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const evidenceDirectory = process.argv[2];
if (!evidenceDirectory) {
  throw new Error('usage: validate-xq-fitness-preflight-evidence.mjs EVIDENCE_DIRECTORY');
}

const forbidden = [
  { name: 'credential-bearing URL', pattern: /[a-z][a-z0-9+.-]*:\/\/[^\s/:]+:[^\s@]+@/iu },
  { name: 'authorization header', pattern: /authorization\s*:\s*bearer/iu },
  { name: 'npm authentication token', pattern: /_authToken/iu },
  { name: 'private key', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/u },
  { name: 'GitHub token', pattern: /gh[pousr]_[A-Za-z0-9]{20,}/u },
  { name: 'OpenAI-style secret', pattern: /sk-[A-Za-z0-9_-]{20,}/u },
  { name: 'provider environment value', pattern: /"value"\s*:/u },
];

const allowedExtensions = new Set(['.csv', '.json', '.txt']);
const failures = [];

for (const entry of fs.readdirSync(evidenceDirectory, { withFileTypes: true })) {
  if (!entry.isFile()) {
    failures.push(`unexpected non-file entry: ${entry.name}`);
    continue;
  }

  if (entry.name !== 'SHA256SUMS' && !allowedExtensions.has(path.extname(entry.name))) {
    failures.push(`unexpected evidence extension: ${entry.name}`);
  }

  const contents = fs.readFileSync(path.join(evidenceDirectory, entry.name), 'utf8');
  for (const rule of forbidden) {
    if (rule.pattern.test(contents)) {
      failures.push(`${entry.name}: contains ${rule.name}`);
    }
  }
}

const requiredFiles = [
  'SHA256SUMS',
  'digitalocean-active-spec.json',
  'digitalocean-app.json',
  'digitalocean-deployments.json',
  'run-metadata.txt',
  'xq-fitness-columns.csv',
  'xq-fitness-grants.csv',
  'xq-fitness-invariants.csv',
  'xq-fitness-neon-project.json',
  'xq-fitness-prisma-migrations.csv',
  'xq-fitness-roles.csv',
  'xq-fitness-row-counts.csv',
  'xq-fitness-server.csv',
  'xq-records-columns.csv',
  'xq-records-grants.csv',
  'xq-records-invariants.csv',
  'xq-records-neon-project.json',
  'xq-records-prisma-migrations.csv',
  'xq-records-roles.csv',
  'xq-records-row-counts.csv',
  'xq-records-server.csv',
];

for (const requiredFile of requiredFiles) {
  if (!fs.existsSync(path.join(evidenceDirectory, requiredFile))) {
    failures.push(`missing required evidence: ${requiredFile}`);
  }
}

const activeSpecPath = path.join(evidenceDirectory, 'digitalocean-active-spec.json');
if (fs.existsSync(activeSpecPath)) {
  const activeSpec = JSON.parse(fs.readFileSync(activeSpecPath, 'utf8'));
  if (!activeSpec.component) {
    failures.push('active DigitalOcean deployment has no expected component');
  } else if (!activeSpec.component.image?.digest) {
    failures.push('active DigitalOcean component has no immutable image digest');
  }
}

for (const label of ['xq-fitness', 'xq-records']) {
  const projectPath = path.join(evidenceDirectory, `${label}-neon-project.json`);
  if (!fs.existsSync(projectPath)) continue;
  const project = JSON.parse(fs.readFileSync(projectPath, 'utf8')).project;
  if (!project?.id || Number(project.history_retention_seconds) <= 0) {
    failures.push(`${label}: missing project identity or point-in-time history retention`);
  }
}

if (failures.length > 0) {
  throw new Error(`preflight evidence rejected:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
}

console.log(`validated ${fs.readdirSync(evidenceDirectory).length} sanitized evidence files`);
