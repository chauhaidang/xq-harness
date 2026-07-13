import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDashboardSnapshot,
  classifyWorkflow,
} from "../src/dashboard-data.mjs";
import { validateDashboardSnapshot } from "../src/validate-snapshot.mjs";
import { mergeWorkflowRuns, reconcileWorkflows } from "../src/github-client.mjs";

test("classifies runnable module workflows and excludes reusable templates", () => {
  assert.deepEqual(classifyWorkflow(".github/workflows/ci-xq-test-utils.yml"), {
    module: "xq-test-utils",
    type: "ci",
  });
  assert.deepEqual(classifyWorkflow(".github/workflows/xq-domain-test-mcp-release.yml"), {
    module: "xq-domain-test-mcp",
    type: "release",
  });
  assert.equal(classifyWorkflow(".github/workflows/module-ci-node.yml"), null);
  assert.equal(classifyWorkflow(".github/workflows/workflow-dashboard.yml"), null);
});

test("builds a normalized snapshot with workflow health and recent-run metrics", () => {
  const snapshot = buildDashboardSnapshot({
    repository: "chauhaidang/xq-harness",
    generatedAt: "2026-07-11T10:00:00.000Z",
    workflows: [
      {
        id: 10,
        name: "CI xq-test-utils",
        path: ".github/workflows/ci-xq-test-utils.yml",
        html_url: "https://github.com/chauhaidang/xq-harness/actions/workflows/ci-xq-test-utils.yml",
        runs: [
          {
            id: 101,
            run_number: 5,
            run_attempt: 1,
            status: "completed",
            conclusion: "success",
            event: "push",
            head_branch: "main",
            head_sha: "1234567890abcdef",
            display_title: "Improve tests",
            actor: { login: "octocat" },
            created_at: "2026-07-11T09:55:00.000Z",
            run_started_at: "2026-07-11T09:56:00.000Z",
            updated_at: "2026-07-11T09:58:00.000Z",
            html_url: "https://github.com/chauhaidang/xq-harness/actions/runs/101"
          },
          {
            id: 100,
            run_number: 4,
            run_attempt: 1,
            status: "completed",
            conclusion: "failure",
            event: "pull_request",
            head_branch: "fix/tests",
            head_sha: "abcdef1234567890",
            display_title: "Fix tests",
            actor: { login: "octocat" },
            created_at: "2026-07-10T09:00:00.000Z",
            run_started_at: "2026-07-10T09:00:00.000Z",
            updated_at: "2026-07-10T09:04:00.000Z",
            html_url: "https://github.com/chauhaidang/xq-harness/actions/runs/100"
          }
        ]
      }
    ]
  });

  assert.equal(snapshot.schemaVersion, 1);
  assert.deepEqual(snapshot.summary, {
    workflows: 1,
    active: 0,
    successful: 1,
    failed: 0,
    stale: 0,
  });
  assert.equal(snapshot.modules[0].module, "xq-test-utils");
  assert.equal(snapshot.modules[0].workflows[0].successRate, 50);
  assert.equal(snapshot.modules[0].workflows[0].medianDurationSeconds, 180);
  assert.equal(snapshot.modules[0].workflows[0].latestRun.commit, "1234567");
});

test("marks empty and old workflows stale while preserving active run status", () => {
  const snapshot = buildDashboardSnapshot({
    repository: "chauhaidang/xq-harness",
    generatedAt: "2026-07-11T12:00:00.000Z",
    workflows: [
      workflowFixture("ci-xq-skills.yml", []),
      workflowFixture("cd-xq-skills.yml", [runFixture({
        id: 202,
        status: "in_progress",
        conclusion: null,
        updated_at: "2026-07-11T11:59:00.000Z",
      })]),
      workflowFixture("ci-xq-test-infra.yml", [runFixture({
        id: 203,
        updated_at: "2026-07-11T09:00:00.000Z",
      })]),
    ],
  });

  assert.deepEqual(snapshot.summary, {
    workflows: 3,
    active: 1,
    successful: 1,
    failed: 0,
    stale: 2,
  });
});

test("rejects malformed workflow runs instead of publishing partial data", () => {
  assert.throws(() => buildDashboardSnapshot({
    repository: "chauhaidang/xq-harness",
    generatedAt: "2026-07-11T12:00:00.000Z",
    workflows: [workflowFixture("ci-xq-skills.yml", [{ id: 1 }])],
  }), /missing required fields/);
});

test("generated snapshots satisfy the published JSON schema", async () => {
  const snapshot = buildDashboardSnapshot({
    repository: "chauhaidang/xq-harness",
    generatedAt: "2026-07-11T12:00:00.000Z",
    workflows: [workflowFixture("ci-xq-skills.yml", [runFixture()])],
  });
  await assert.doesNotReject(validateDashboardSnapshot(snapshot));
  await assert.rejects(validateDashboardSnapshot({ ...snapshot, schemaVersion: 2 }), /schema validation/);
});

test("merges repository-wide updates into per-workflow history without duplicates", () => {
  const workflows = [workflowFixture("ci-xq-skills.yml", [runFixture({ id: 301 })])];
  workflows[0].id = 77;
  const updated = mergeWorkflowRuns(workflows, [
    { ...runFixture({ id: 302, status: "in_progress", conclusion: null }), workflow_id: 77 },
    { ...runFixture({ id: 301 }), workflow_id: 77 },
  ]);

  assert.deepEqual(updated[0].runs.map(({ id }) => id), [302, 301]);
  assert.equal(updated[0].runs.length, 2);
});

test("prefers completed success when duplicate run data disagrees on status", () => {
  const workflows = [workflowFixture("ci-xq-skills.yml", [runFixture({
    id: 401,
    status: "completed",
    conclusion: "success",
    updated_at: "2026-07-12T12:02:00.000Z",
  })])];
  workflows[0].id = 77;

  const updated = mergeWorkflowRuns(workflows, [
    {
      ...runFixture({
        id: 401,
        status: "queued",
        conclusion: null,
        updated_at: "2026-07-12T12:01:00.000Z",
      }),
      workflow_id: 77,
    },
  ]);

  assert.equal(updated[0].runs[0].status, "completed");
  assert.equal(updated[0].runs[0].conclusion, "success");
});

test("reconciles newly active and disabled workflows without losing history", () => {
  const existing = [{ id: 1, name: "old", path: "old.yml", runs: [{ id: 10 }] }, { id: 2, runs: [] }];
  const active = [{ id: 1, name: "renamed", path: "renamed.yml" }, { id: 3, name: "new", path: "new.yml" }];

  assert.deepEqual(reconcileWorkflows(existing, active), [
    { id: 1, name: "renamed", path: "renamed.yml", runs: [{ id: 10 }] },
    { id: 3, name: "new", path: "new.yml", runs: [] },
  ]);
});

function workflowFixture(filename, runs) {
  return {
    id: filename,
    name: filename,
    path: `.github/workflows/${filename}`,
    html_url: `https://github.com/chauhaidang/xq-harness/actions/workflows/${filename}`,
    runs,
  };
}

function runFixture(overrides = {}) {
  return {
    id: 201,
    run_number: 1,
    run_attempt: 1,
    status: "completed",
    conclusion: "success",
    event: "push",
    head_branch: "main",
    head_sha: "1234567890abcdef",
    display_title: "Fixture run",
    actor: { login: "octocat" },
    created_at: "2026-07-11T11:55:00.000Z",
    run_started_at: "2026-07-11T11:56:00.000Z",
    updated_at: "2026-07-11T11:58:00.000Z",
    html_url: "https://github.com/chauhaidang/xq-harness/actions/runs/201",
    ...overrides,
  };
}
