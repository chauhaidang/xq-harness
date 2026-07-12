const STALE_AFTER_MS = 90 * 60 * 1000;
const ACTIVE_STATUSES = new Set(["queued", "in_progress", "waiting", "pending", "requested"]);
const FAILED_CONCLUSIONS = new Set(["failure", "timed_out", "action_required", "startup_failure"]);

export function classifyWorkflow(path) {
  const filename = path.split("/").at(-1)?.replace(/\.ya?ml$/, "") ?? "";
  if (filename.startsWith("module-") || filename === "workflow-dashboard") return null;

  if (filename.startsWith("ci-")) {
    return { module: filename.slice(3), type: "ci" };
  }
  if (filename.startsWith("cd-")) {
    return { module: filename.slice(3), type: "cd" };
  }
  if (filename.endsWith("-release")) {
    return { module: filename.slice(0, -8), type: "release" };
  }
  return null;
}

export function buildDashboardSnapshot({ repository, generatedAt, workflows }) {
  if (!repository || !generatedAt || !Array.isArray(workflows)) {
    throw new TypeError("repository, generatedAt, and workflows are required");
  }

  const generatedTime = Date.parse(generatedAt);
  if (Number.isNaN(generatedTime)) throw new TypeError("generatedAt must be an ISO timestamp");

  const normalizedWorkflows = workflows.flatMap((workflow) => {
    const classification = classifyWorkflow(workflow.path ?? "");
    if (!classification) return [];
    if (!Array.isArray(workflow.runs)) throw new TypeError(`${workflow.name ?? workflow.path} runs must be an array`);

    const runs = workflow.runs.map(normalizeRun);
    const latestRun = runs[0] ?? null;
    const completedRuns = runs.filter((run) => run.status === "completed" && run.durationSeconds !== null);
    const successfulRuns = completedRuns.filter((run) => run.conclusion === "success").length;
    const stale = !latestRun || generatedTime - Date.parse(latestRun.updatedAt) > STALE_AFTER_MS;

    return [{
      id: workflow.id,
      name: workflow.name,
      path: workflow.path,
      url: workflow.html_url,
      ...classification,
      latestRun,
      runs,
      stale,
      successRate: completedRuns.length ? Math.round((successfulRuns / completedRuns.length) * 100) : null,
      medianDurationSeconds: median(completedRuns.map((run) => run.durationSeconds)),
    }];
  });

  normalizedWorkflows.sort((a, b) => a.module.localeCompare(b.module) || typeOrder(a.type) - typeOrder(b.type));
  const modules = [...Map.groupBy(normalizedWorkflows, (workflow) => workflow.module)].map(([module, grouped]) => ({
    module,
    workflows: grouped,
  }));

  return {
    schemaVersion: 1,
    repository,
    generatedAt,
    summary: {
      workflows: normalizedWorkflows.length,
      active: normalizedWorkflows.filter(({ latestRun }) => latestRun && ACTIVE_STATUSES.has(latestRun.status)).length,
      successful: normalizedWorkflows.filter(({ latestRun }) => latestRun?.conclusion === "success").length,
      failed: normalizedWorkflows.filter(({ latestRun }) => FAILED_CONCLUSIONS.has(latestRun?.conclusion)).length,
      stale: normalizedWorkflows.filter(({ stale }) => stale).length,
    },
    modules,
  };
}

function normalizeRun(run) {
  if (!run?.id || !run.status || !run.created_at || !run.updated_at || !run.html_url) {
    throw new TypeError("workflow run is missing required fields");
  }

  const started = run.run_started_at ? Date.parse(run.run_started_at) : null;
  const finished = run.status === "completed" ? Date.parse(run.updated_at) : null;
  const durationSeconds = started !== null && finished !== null && !Number.isNaN(started) && !Number.isNaN(finished)
    ? Math.max(0, Math.round((finished - started) / 1000))
    : null;

  return {
    id: run.id,
    number: run.run_number,
    attempt: run.run_attempt,
    status: run.status,
    conclusion: run.conclusion ?? null,
    event: run.event,
    branch: run.head_branch ?? null,
    commit: run.head_sha?.slice(0, 7) ?? null,
    title: run.display_title || `Run #${run.run_number}`,
    actor: run.actor?.login ?? "unknown",
    createdAt: run.created_at,
    startedAt: run.run_started_at ?? null,
    updatedAt: run.updated_at,
    durationSeconds,
    url: run.html_url,
  };
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function typeOrder(type) {
  return { ci: 0, cd: 1, release: 2 }[type] ?? 3;
}
