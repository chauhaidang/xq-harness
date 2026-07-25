#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '..');
const validator = path.join(repoRoot, 'scripts/validate-xq-fitness-preflight-evidence.mjs');
const manifestBuilder = path.join(repoRoot, 'scripts/build-xq-fitness-preflight-manifest.mjs');
const workflowPath = path.join(
  repoRoot,
  '.github/workflows/xq-fitness-production-preflight.yml',
);

function fixture(overrides = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xq-preflight-sanitizer.'));
  const files = {
    SHA256SUMS:
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa  digitalocean-app.json\n',
    'digitalocean-active-spec.json': JSON.stringify(
      {
        name: 'xq-fitness',
        region: 'sgp',
        component: {
          name: 'write-service',
          image: {
            registry: 'ghcr.io',
            repository: 'chauhaidang/xq-fitness-write-service',
            tag: '1.2.3',
            digest: 'sha256:safe',
          },
          routes: [{ path: '/xq-fitness-write-service' }],
          env_names: [{ key: 'DATABASE_URL', scope: 'RUN_TIME', type: 'SECRET' }],
        },
      },
      null,
      2,
    ),
    'digitalocean-app.json': JSON.stringify(
      [
        {
          app_id: 'app-safe',
          app_name: 'xq-fitness',
          region: 'sgp',
          active_deployment_id: 'deploy-active',
        },
      ],
      null,
      2,
    ),
    'digitalocean-deployments.json': JSON.stringify(
      [
        { id: 'deploy-active', phase: 'ACTIVE', created_at: '2026-07-18T16:10:17Z' },
        { id: 'deploy-prev', phase: 'SUPERSEDED', created_at: '2026-07-01T00:00:00Z' },
      ],
      null,
      2,
    ),
    'digitalocean-previous-spec.json': JSON.stringify(
      {
        deployment_id: 'deploy-prev',
        component: {
          name: 'write-service',
          image: {
            digest: 'sha256:previous',
            repository: 'chauhaidang/xq-fitness-write-service',
            tag: '1.2.2',
          },
        },
      },
      null,
      2,
    ),
    'run-metadata.txt': [
      'policy_version=1',
      'captured_at=2026-07-23T12:00:00Z',
      'repository=chauhaidang/xq-harness',
      'commit=abc123',
      'run_id=99',
      'run_attempt=1',
      'do_app_id=app-safe',
      'do_service_name=write-service',
      'fitness_neon_project_id=fitness-project',
      'records_neon_project_id=records-project',
      '',
    ].join('\n'),
    'xq-fitness-columns.csv':
      'table_schema,table_name,ordinal_position,column_name,data_type,udt_name,is_nullable\npublic,workout_routines,1,id,uuid,uuid,NO\n',
    'xq-fitness-grants.csv':
      'grantee,table_schema,table_name,privilege_type,is_grantable\nreadonly,public,workout_routines,SELECT,NO\n',
    'xq-fitness-invariants.csv':
      'invariant,violations\nworkout_days_without_routine,0\nweekly_report_join_rows,12\n',
    'xq-fitness-neon-project.json': JSON.stringify(
      {
        project: {
          id: 'fitness-project',
          name: 'xq-fitness',
          region_id: 'aws-ap-southeast-1',
          pg_version: 16,
          history_retention_seconds: 86400,
        },
      },
      null,
      2,
    ),
    'xq-fitness-roles.csv':
      'role_name,rolsuper,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls\nreadonly,f,f,f,t,f,f\n',
    'xq-fitness-row-counts.csv': 'table_schema,table_name,row_count\npublic,workout_routines,3\n',
    'xq-fitness-prisma-migrations.csv':
      'migration_name,checksum,started_at,finished_at,rolled_back_at,applied_steps_count\n20240101000000_init,checksum-a,2024-01-01T00:00:00Z,2024-01-01T00:00:01Z,,1\n',
    'xq-fitness-server.csv':
      'database_name,role_name,postgres_version,transaction_read_only\nxq_fitness,readonly,16.3,on\n',
    'xq-records-columns.csv':
      'table_schema,table_name,ordinal_position,column_name,data_type,udt_name,is_nullable\npublic,objects,1,id,uuid,uuid,NO\n',
    'xq-records-grants.csv':
      'grantee,table_schema,table_name,privilege_type,is_grantable\nreadonly,public,objects,SELECT,NO\n',
    'xq-records-invariants.csv':
      'invariant,violations\nobjects_without_type,0\ninvalid_status,0\n',
    'xq-records-neon-project.json': JSON.stringify(
      {
        project: {
          id: 'records-project',
          name: 'xq-records',
          region_id: 'aws-ap-southeast-1',
          pg_version: 18,
          history_retention_seconds: 172800,
        },
      },
      null,
      2,
    ),
    'xq-records-roles.csv':
      'role_name,rolsuper,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls\nreadonly,f,f,f,t,f,f\n',
    'xq-records-row-counts.csv': 'table_schema,table_name,row_count\npublic,objects,10\n',
    'xq-records-prisma-migrations.csv':
      'migration_name,checksum,started_at,finished_at,rolled_back_at,applied_steps_count\n20260627000000_init,checksum-b,2026-06-27T00:00:00Z,2026-06-27T00:00:01Z,,1\n',
    'xq-records-server.csv':
      'database_name,role_name,postgres_version,transaction_read_only\nxq_records,readonly,18.0,on\n',
    ...overrides,
  };

  for (const [file, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(directory, file), contents);
  }
  return directory;
}

function runNode(script, args) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    cwd: repoRoot,
  });
}

function validate(directory) {
  return runNode(validator, [directory]);
}

test('seam 1: accepts safe evidence', () => {
  const directory = fixture();
  const result = validate(directory);
  assert.equal(result.status, 0, result.stderr);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('seam 1: rejects credential-bearing URLs', () => {
  const directory = fixture({
    'digitalocean-active-spec.json':
      '{"component":{"image":{"digest":"sha256:safe"}},"url":"postgresql://user:secret@example.invalid/db"}\n',
  });
  const result = validate(directory);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /credential-bearing URL/);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('seam 1: rejects active deployment without immutable digest', () => {
  const directory = fixture({
    'digitalocean-active-spec.json':
      '{"component":{"name":"write-service","image":{"tag":"latest"}}}\n',
  });
  const result = validate(directory);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /immutable image digest/);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('seam 1: rejects missing Neon history retention', () => {
  const directory = fixture({
    'xq-fitness-neon-project.json':
      '{"project":{"id":"fitness-project","history_retention_seconds":0}}\n',
  });
  const result = validate(directory);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /history retention/);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('seam 1: rejects provider environment values', () => {
  const directory = fixture({
    'digitalocean-active-spec.json':
      '{"component":{"image":{"digest":"sha256:safe"},"env_names":[{"key":"DATABASE_URL","value":"secret"}]}}\n',
  });
  const result = validate(directory);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /provider environment value/);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('seam 2: durable manifest contains allowlisted facts and raw hash binding', () => {
  const directory = fixture();
  const output = path.join(directory, 'durable-manifest.md');
  const result = runNode(manifestBuilder, [directory, output]);
  assert.equal(result.status, 0, result.stderr);

  const manifest = fs.readFileSync(output, 'utf8');
  assert.match(manifest, /# XQ Fitness production preflight manifest/);
  assert.match(manifest, /Issue: \[#60\]/);
  assert.match(manifest, /\| policy_version \| 1 \|/);
  assert.match(manifest, /\| captured_at \| 2026-07-23T12:00:00Z \|/);
  assert.match(manifest, /\| run_id \| 99 \|/);
  assert.match(manifest, /fitness-project/);
  assert.match(manifest, /records-project/);
  assert.match(manifest, /history_retention_seconds/);
  assert.match(manifest, /\| xq-fitness \| fitness-project \|[\s\S]*?\| 86400 \|/);
  assert.match(manifest, /sha256:safe/);
  assert.match(manifest, /\/xq-fitness-write-service/);
  assert.match(manifest, /DATABASE_URL/);
  assert.match(manifest, /sha256:previous/);
  assert.match(manifest, /\| workout_days_without_routine \| 0 \|/);
  assert.match(manifest, /\| public \| workout_routines \| 3 \|/);
  assert.match(manifest, /public\.workout_routines/);
  assert.match(manifest, /docs\/migrations\/evidence\/xq-fitness-production-preflight-/);
  assert.match(manifest, /20240101000000_init/);
  assert.match(manifest, /checksum-a/);
  assert.match(manifest, /aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/);
  assert.doesNotMatch(manifest, /postgresql:\/\/[^:]+:[^@]+@/);
  assert.doesNotMatch(manifest, /"value"\s*:/);
  assert.doesNotMatch(manifest, /BEGIN [A-Z ]*PRIVATE KEY/);

  fs.rmSync(directory, { recursive: true, force: true });
});

test('seam 2: durable manifest builder refuses unvalidated evidence', () => {
  const directory = fixture({
    'digitalocean-active-spec.json':
      '{"component":{"name":"write-service","image":{"tag":"latest"}}}\n',
  });
  const output = path.join(directory, 'durable-manifest.md');
  const result = runNode(manifestBuilder, [directory, output]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /immutable image digest|preflight evidence rejected/);
  assert.equal(fs.existsSync(output), false);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('seam 3: workflow is manual, read-only, and short-lived', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  assert.match(workflow, /^on:\s*\n\s*workflow_dispatch:\s*$/m);
  assert.doesNotMatch(workflow, /\bpush:\b/);
  assert.doesNotMatch(workflow, /\bpull_request:\b/);
  assert.match(workflow, /contents:\s*read/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /^\s*environment:\s*/m);
  assert.match(workflow, /retention-days:\s*1/);
  assert.match(workflow, /node --test scripts\/test-xq-fitness-preflight-sanitization\.mjs/);
  assert.match(workflow, /validate-xq-fitness-preflight-evidence\.mjs/);
  assert.match(workflow, /build-xq-fitness-preflight-manifest\.mjs/);
  assert.match(workflow, /xq-fitness-production-preflight\.sh/);
  assert.match(workflow, /postgresql-client/);
  assert.match(workflow, /git diff --check/);
  assert.match(workflow, /xq-fitness-production-preflight-\$\{capture_date\}\.md/);
  assert.match(workflow, /DO_READ_TOKEN \|\| secrets\.DO_TOKEN/);
  assert.match(workflow, /7960143e-c80f-496d-9992-f24430bb77ff/);
  assert.match(workflow, /write-service/);
});
