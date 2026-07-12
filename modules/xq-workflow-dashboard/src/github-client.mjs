import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { classifyWorkflow } from "./dashboard-data.mjs";

const execFileAsync = promisify(execFile);

export async function resolveRepository() {
  const { stdout } = await execFileAsync("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]);
  const repository = stdout.trim();
  if (!repository.includes("/")) throw new Error("Unable to resolve GitHub repository from gh");
  return repository;
}

export async function loadWorkflowHistory(repository) {
  const monitored = await loadActiveWorkflows(repository);
  return Promise.all(monitored.map(async (workflow) => {
    const runs = await ghApi(`/repos/${repository}/actions/workflows/${workflow.id}/runs?per_page=20`);
    return { ...workflow, runs: runs.workflow_runs };
  }));
}

export async function loadActiveWorkflows(repository) {
  const response = await ghApi(`/repos/${repository}/actions/workflows?per_page=100`);
  return response.workflows.filter((workflow) => workflow.state === "active" && classifyWorkflow(workflow.path));
}

export async function loadRecentRepositoryRuns(repository) {
  const response = await ghApi(`/repos/${repository}/actions/runs?per_page=100`);
  return response.workflow_runs;
}

export function mergeWorkflowRuns(workflows, recentRuns) {
  const runsByWorkflow = Map.groupBy(recentRuns, (run) => run.workflow_id);
  return workflows.map((workflow) => {
    const merged = [...(runsByWorkflow.get(workflow.id) ?? []), ...workflow.runs];
    const unique = [...new Map(merged.map((run) => [run.id, run])).values()]
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, 20);
    return { ...workflow, runs: unique };
  });
}

export function reconcileWorkflows(existingWorkflows, activeWorkflows) {
  const existingById = new Map(existingWorkflows.map((workflow) => [workflow.id, workflow]));
  return activeWorkflows.map((workflow) => ({
    ...workflow,
    runs: existingById.get(workflow.id)?.runs ?? [],
  }));
}

async function ghApi(endpoint) {
  try {
    const { stdout } = await execFileAsync("gh", [
      "api",
      "--method", "GET",
      "-H", "Accept: application/vnd.github+json",
      "-H", "X-GitHub-Api-Version: 2022-11-28",
      endpoint,
    ], { maxBuffer: 20 * 1024 * 1024 });
    return JSON.parse(stdout);
  } catch (error) {
    const detail = error.stderr?.trim() || error.message;
    throw new Error(`GitHub request failed: ${detail}`);
  }
}
