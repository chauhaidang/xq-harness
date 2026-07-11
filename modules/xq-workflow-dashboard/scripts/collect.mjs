import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildDashboardSnapshot } from "../src/dashboard-data.mjs";
import { loadWorkflowHistory, resolveRepository } from "../src/github-client.mjs";
import { validateDashboardSnapshot } from "../src/validate-snapshot.mjs";

const repository = process.env.GITHUB_REPOSITORY ?? await resolveRepository();
const output = resolve(process.env.DASHBOARD_OUTPUT ?? "dist/dashboard-data.json");
const workflows = await loadWorkflowHistory(repository);

const snapshot = buildDashboardSnapshot({
  repository,
  generatedAt: new Date().toISOString(),
  workflows,
});
await validateDashboardSnapshot(snapshot);

await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Collected ${snapshot.summary.workflows} workflows into ${output}`);
