#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceDirectory = process.argv[2];
const outputPath = process.argv[3];
if (!evidenceDirectory || !outputPath) {
  throw new Error(
    'usage: build-xq-fitness-preflight-manifest.mjs EVIDENCE_DIRECTORY OUTPUT_MARKDOWN',
  );
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const validator = path.join(scriptDirectory, 'validate-xq-fitness-preflight-evidence.mjs');
const validation = spawnSync(process.execPath, [validator, evidenceDirectory], {
  encoding: 'utf8',
});
if (validation.status !== 0) {
  process.stderr.write(validation.stderr || validation.stdout || 'preflight evidence rejected\n');
  process.exit(validation.status ?? 1);
}

function readText(name) {
  return fs.readFileSync(path.join(evidenceDirectory, name), 'utf8');
}

function readJson(name) {
  return JSON.parse(readText(name));
}

function optionalText(name) {
  const fullPath = path.join(evidenceDirectory, name);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : null;
}

function parseMetadata(text) {
  const metadata = {};
  for (const line of text.split('\n')) {
    if (!line.includes('=')) continue;
    const index = line.indexOf('=');
    metadata[line.slice(0, index)] = line.slice(index + 1);
  }
  return metadata;
}

function parseCsv(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
  return { headers, rows };
}

function markdownTable(headers, rows) {
  if (rows.length === 0) {
    return '_None_\n';
  }
  const headerLine = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows
    .map((row) => `| ${headers.map((header) => String(row[header] ?? '')).join(' | ')} |`)
    .join('\n');
  return `${headerLine}\n${separator}\n${body}\n`;
}

const metadata = parseMetadata(readText('run-metadata.txt'));
const app = readJson('digitalocean-app.json')[0] ?? {};
const activeSpec = readJson('digitalocean-active-spec.json');
const previousSpecText = optionalText('digitalocean-previous-spec.json');
const previousSpec = previousSpecText ? JSON.parse(previousSpecText) : null;
const fitnessProject = readJson('xq-fitness-neon-project.json').project;
const recordsProject = readJson('xq-records-neon-project.json').project;
const fitnessServer = parseCsv(readText('xq-fitness-server.csv')).rows[0] ?? {};
const recordsServer = parseCsv(readText('xq-records-server.csv')).rows[0] ?? {};
const fitnessInvariants = parseCsv(readText('xq-fitness-invariants.csv')).rows;
const recordsInvariants = parseCsv(readText('xq-records-invariants.csv')).rows;
const fitnessCounts = parseCsv(readText('xq-fitness-row-counts.csv')).rows;
const recordsCounts = parseCsv(readText('xq-records-row-counts.csv')).rows;
const fitnessColumns = parseCsv(readText('xq-fitness-columns.csv')).rows;
const recordsColumns = parseCsv(readText('xq-records-columns.csv')).rows;
const fitnessRoles = parseCsv(readText('xq-fitness-roles.csv')).rows;
const recordsRoles = parseCsv(readText('xq-records-roles.csv')).rows;
const fitnessGrants = parseCsv(readText('xq-fitness-grants.csv')).rows;
const recordsGrants = parseCsv(readText('xq-records-grants.csv')).rows;
const fitnessMigrations = parseCsv(readText('xq-fitness-prisma-migrations.csv')).rows.filter(
  (row) => row.migration_name && row.migration_name !== 'absent' && row.migration_name !== 'status',
);
const recordsMigrations = parseCsv(readText('xq-records-prisma-migrations.csv')).rows.filter(
  (row) => row.migration_name && row.migration_name !== 'absent' && row.migration_name !== 'status',
);
const sha256sums = readText('SHA256SUMS').trim();

const component = activeSpec.component ?? {};
const image = component.image ?? {};
const routes = (component.routes ?? []).map((route) => route.path ?? route).join(', ');
const envNames = (component.env_names ?? [])
  .filter((entry) => entry.type === 'SECRET')
  .map((entry) => entry.key)
  .join(', ');
const previousAccepted =
  previousSpec && previousSpec.status !== 'rejected_mutable_identity' ? previousSpec : null;
const previousImage = previousAccepted?.component?.image ?? {};
const previousKnownGood = previousAccepted
  ? previousImage.digest ?? ''
  : previousSpec?.status === 'rejected_mutable_identity'
    ? 'rejected_mutable_identity'
    : '';

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort().join(', ');
}

function schemaSummary(columns) {
  return uniqueSorted(columns.map((row) => `${row.table_schema}.${row.table_name}`));
}

const lines = [];
lines.push('# XQ Fitness production preflight manifest');
lines.push('');
lines.push('Issue: [#60](https://github.com/chauhaidang/xq-harness/issues/60)');
lines.push('');
lines.push(
  'This durable manifest contains only the minimum sanitized facts later',
);
lines.push(
  'tickets need. Raw provider and database captures remain in the short-lived',
);
lines.push('protected workflow artifact and are bound here by SHA-256.');
lines.push('');
lines.push('Commit path after a GO capture:');
lines.push('`docs/migrations/evidence/xq-fitness-production-preflight-<UTC-date>.md`');
lines.push('Then link the path from issues #47, #48, and #51.');
lines.push('');
lines.push('## Capture identity');
lines.push('');
lines.push(markdownTable(
  ['field', 'value'],
  [
    { field: 'policy_version', value: metadata.policy_version ?? '' },
    { field: 'captured_at', value: metadata.captured_at ?? '' },
    { field: 'repository', value: metadata.repository ?? '' },
    { field: 'commit', value: metadata.commit ?? '' },
    { field: 'run_id', value: metadata.run_id ?? '' },
    { field: 'run_attempt', value: metadata.run_attempt ?? '' },
  ],
));
lines.push('## DigitalOcean target');
lines.push('');
lines.push(markdownTable(
  ['field', 'value'],
  [
    { field: 'app_id', value: app.app_id ?? metadata.do_app_id ?? '' },
    { field: 'app_name', value: app.app_name ?? activeSpec.name ?? '' },
    { field: 'region', value: app.region ?? activeSpec.region ?? '' },
    { field: 'active_deployment_id', value: app.active_deployment_id ?? '' },
    { field: 'component', value: component.name ?? metadata.do_service_name ?? '' },
    { field: 'image_repository', value: image.repository ?? '' },
    { field: 'image_tag', value: image.tag ?? '' },
    { field: 'image_digest', value: image.digest ?? '' },
    { field: 'routes', value: routes },
    { field: 'encrypted_setting_names', value: envNames },
    {
      field: 'previous_known_good_deployment_id',
      value: previousAccepted?.deployment_id ?? previousSpec?.deployment_id ?? '',
    },
    {
      field: 'previous_known_good_digest',
      value: previousKnownGood,
    },
  ],
));
lines.push('## Neon targets');
lines.push('');
lines.push(markdownTable(
  ['database', 'project_id', 'project_name', 'region_id', 'pg_version', 'history_retention_seconds', 'connected_database', 'role_name', 'postgres_version', 'transaction_read_only'],
  [
    {
      database: 'xq-fitness',
      project_id: fitnessProject.id,
      project_name: fitnessProject.name ?? '',
      region_id: fitnessProject.region_id ?? '',
      pg_version: String(fitnessProject.pg_version ?? ''),
      history_retention_seconds: String(fitnessProject.history_retention_seconds ?? ''),
      connected_database: fitnessServer.database_name ?? '',
      role_name: fitnessServer.role_name ?? '',
      postgres_version: fitnessServer.postgres_version ?? '',
      transaction_read_only: fitnessServer.transaction_read_only ?? '',
    },
    {
      database: 'xq-records',
      project_id: recordsProject.id,
      project_name: recordsProject.name ?? '',
      region_id: recordsProject.region_id ?? '',
      pg_version: String(recordsProject.pg_version ?? ''),
      history_retention_seconds: String(recordsProject.history_retention_seconds ?? ''),
      connected_database: recordsServer.database_name ?? '',
      role_name: recordsServer.role_name ?? '',
      postgres_version: recordsServer.postgres_version ?? '',
      transaction_read_only: recordsServer.transaction_read_only ?? '',
    },
  ],
));
lines.push('## Schema, roles, and grants summary');
lines.push('');
lines.push(markdownTable(
  ['database', 'tables', 'column_rows', 'roles', 'grant_rows'],
  [
    {
      database: 'xq-fitness',
      tables: schemaSummary(fitnessColumns),
      column_rows: String(fitnessColumns.length),
      roles: uniqueSorted(fitnessRoles.map((row) => row.role_name)),
      grant_rows: String(fitnessGrants.length),
    },
    {
      database: 'xq-records',
      tables: schemaSummary(recordsColumns),
      column_rows: String(recordsColumns.length),
      roles: uniqueSorted(recordsRoles.map((row) => row.role_name)),
      grant_rows: String(recordsGrants.length),
    },
  ],
));
lines.push('## Prisma migration ledger');
lines.push('');
lines.push('### xq-fitness');
lines.push('');
lines.push(markdownTable(
  ['migration_name', 'checksum'],
  fitnessMigrations.map((row) => ({
    migration_name: row.migration_name,
    checksum: row.checksum,
  })),
));
lines.push('### xq-records');
lines.push('');
lines.push(markdownTable(
  ['migration_name', 'checksum'],
  recordsMigrations.map((row) => ({
    migration_name: row.migration_name,
    checksum: row.checksum,
  })),
));
lines.push('## Invariants');
lines.push('');
lines.push('### xq-fitness');
lines.push('');
lines.push(markdownTable(['invariant', 'violations'], fitnessInvariants));
lines.push('### xq-records');
lines.push('');
lines.push(markdownTable(['invariant', 'violations'], recordsInvariants));
lines.push('## Table row counts');
lines.push('');
lines.push('### xq-fitness');
lines.push('');
lines.push(markdownTable(['table_schema', 'table_name', 'row_count'], fitnessCounts));
lines.push('### xq-records');
lines.push('');
lines.push(markdownTable(['table_schema', 'table_name', 'row_count'], recordsCounts));
lines.push('## Raw evidence binding');
lines.push('');
lines.push('SHA-256 sums for the protected short-lived artifact files:');
lines.push('');
lines.push('```');
lines.push(sha256sums);
lines.push('```');
lines.push('');

fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
console.log(`wrote durable preflight manifest: ${outputPath}`);
