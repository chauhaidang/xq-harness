const ACTIVE = new Set(["queued", "in_progress", "waiting", "pending", "requested"]);
const state = { data: null, filters: { search: "", type: "", status: "", event: "", branch: "" } };
let initialized = false;

try {
  const response = await fetch("api/snapshot", { cache: "no-store" });
  if (!response.ok) throw new Error(`Dashboard data returned HTTP ${response.status}`);
  applySnapshot(await response.json());
  connectLiveUpdates();
} catch (error) {
  showError(`Telemetry unavailable: ${error.message}`);
}

function applySnapshot(data) {
  state.data = data;
  document.querySelector("#error").hidden = true;
  if (!initialized) {
    bindFilters();
    initialized = true;
  }
  renderMetadata();
  renderSummary();
  renderActiveRuns();
  populateFilters();
  renderFilteredViews();
}

function renderMetadata() {
  const { data } = state;
  document.querySelector("#repository-link").href = `https://github.com/${data.repository}/actions`;
  const ageMinutes = Math.floor((Date.now() - Date.parse(data.generatedAt)) / 60000);
  document.querySelector("#generated-at").textContent = ageMinutes > 90
    ? `Snapshot is stale · generated ${relativeTime(data.generatedAt)}`
    : `Updated ${relativeTime(data.generatedAt)}`;
}

function connectLiveUpdates() {
  const events = new EventSource("events");
  events.addEventListener("snapshot", (event) => applySnapshot(JSON.parse(event.data)));
  events.addEventListener("error", (event) => {
    if (event.data) showError(JSON.parse(event.data).message);
  });
}

function renderSummary() {
  const labels = [
    ["workflows", "Tracked workflows"],
    ["active", "In motion"],
    ["successful", "Healthy"],
    ["failed", "Need attention"],
    ["stale", "Stale signals"],
  ];
  document.querySelector("#summary").innerHTML = labels.map(([key, label]) => `
    <article class="summary-card"><strong>${state.data.summary[key]}</strong><span>${label}</span></article>
  `).join("");
}

function renderActiveRuns() {
  const active = allWorkflows().filter(({ latestRun }) => latestRun && ACTIVE.has(latestRun.status));
  const section = document.querySelector("#active-section");
  section.hidden = active.length === 0;
  document.querySelector("#active-runs").innerHTML = active.map((workflow) => `
    <a class="active-run" href="${escapeAttribute(workflow.latestRun.url)}">
      <div><strong>${escapeHtml(workflow.name)}</strong><span>${escapeHtml(workflow.latestRun.title)}</span></div>
      <span>${escapeHtml(workflow.latestRun.status.replaceAll("_", " "))} · ${relativeTime(workflow.latestRun.updatedAt)}</span>
    </a>
  `).join("");
}

function populateFilters() {
  const runs = allWorkflows().flatMap(({ runs }) => runs);
  replaceOptions("#event-filter", "All events", [...new Set(runs.map(({ event }) => event).filter(Boolean))].sort());
  replaceOptions("#branch-filter", "All branches", [...new Set(runs.map(({ branch }) => branch).filter(Boolean))].sort());
}

function replaceOptions(selector, defaultLabel, values) {
  const select = document.querySelector(selector);
  const selected = select.value;
  select.replaceChildren(new Option(defaultLabel, ""));
  for (const value of values) select.add(new Option(value, value));
  if (values.includes(selected)) select.value = selected;
}

function bindFilters() {
  const bindings = { search: "#search", type: "#type-filter", status: "#status-filter", event: "#event-filter", branch: "#branch-filter" };
  for (const [key, selector] of Object.entries(bindings)) {
    document.querySelector(selector).addEventListener("input", (event) => {
      state.filters[key] = event.target.value.toLowerCase();
      renderFilteredViews();
    });
  }
}

function renderFilteredViews() {
  const modules = state.data.modules.map((module) => ({
    ...module,
    workflows: module.workflows.filter(matchesFilters),
  })).filter(({ workflows }) => workflows.length);

  document.querySelector("#module-grid").innerHTML = modules.map((module, index) => `
    <article class="module-card" style="animation-delay:${Math.min(index * 45, 360)}ms">
      <header class="module-card-header"><h3>${escapeHtml(module.module)}</h3><span>${module.workflows.length} signal${module.workflows.length === 1 ? "" : "s"}</span></header>
      <div class="workflow-list">${module.workflows.map(renderWorkflow).join("")}</div>
    </article>
  `).join("");
  document.querySelector("#empty-state").hidden = modules.length > 0;

  const runs = modules.flatMap(({ workflows }) => workflows.flatMap((workflow) => workflow.runs
    .filter(matchesRunFilters)
    .map((run) => ({ ...run, workflow }))));
  runs.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  document.querySelector("#run-history").innerHTML = runs.slice(0, 50).map(renderRun).join("");
}

function matchesRunFilters(run) {
  const { event, branch } = state.filters;
  if (event && run.event?.toLowerCase() !== event) return false;
  if (branch && run.branch?.toLowerCase() !== branch) return false;
  return true;
}

function matchesFilters(workflow) {
  const { search, type, status, event, branch } = state.filters;
  const latest = workflow.latestRun;
  if (search && !`${workflow.module} ${workflow.name}`.toLowerCase().includes(search)) return false;
  if (type && workflow.type !== type) return false;
  if (event && !workflow.runs.some((run) => run.event?.toLowerCase() === event)) return false;
  if (branch && !workflow.runs.some((run) => run.branch?.toLowerCase() === branch)) return false;
  if (status === "stale" && !workflow.stale) return false;
  if (status === "active" && !ACTIVE.has(latest?.status)) return false;
  if (status === "success" && latest?.conclusion !== "success") return false;
  if (status === "failure" && !["failure", "timed_out", "action_required", "startup_failure"].includes(latest?.conclusion)) return false;
  return true;
}

function renderWorkflow(workflow) {
  const latest = workflow.latestRun;
  const status = statusFor(workflow);
  const metrics = [
    workflow.successRate === null ? null : `${workflow.successRate}% success`,
    workflow.medianDurationSeconds === null ? null : `${formatDuration(workflow.medianDurationSeconds)} median`,
  ].filter(Boolean).join(" · ") || "No completed runs";
  return `<a class="workflow-row" href="${escapeAttribute(latest?.url ?? workflow.url)}">
    <span class="type-mark">${escapeHtml(workflow.type)}</span>
    <span><span class="workflow-name">${escapeHtml(workflow.name)}</span><span class="workflow-metrics">${metrics}</span></span>
    <span class="status status-${status.key}">${status.label}</span>
  </a>`;
}

function renderRun(run) {
  const status = statusFor({ latestRun: run, stale: false });
  return `<tr>
    <td><a href="${escapeAttribute(run.url)}">${escapeHtml(run.workflow.name)}</a><br><small>${escapeHtml(run.title)}</small></td>
    <td><span class="status status-${status.key}">${status.label}</span></td>
    <td>${escapeHtml(run.branch ?? "—")}<br><small>${escapeHtml(run.commit ?? "")}</small></td>
    <td>${escapeHtml(run.event ?? "—")}</td>
    <td>${run.durationSeconds === null ? "—" : formatDuration(run.durationSeconds)}</td>
    <td title="${escapeAttribute(new Date(run.updatedAt).toLocaleString())}">${relativeTime(run.updatedAt)}</td>
  </tr>`;
}

function statusFor(workflow) {
  if (workflow.stale) return { key: "stale", label: "Stale" };
  const run = workflow.latestRun;
  if (!run) return { key: "stale", label: "No runs" };
  if (ACTIVE.has(run.status)) return { key: "active", label: run.status.replaceAll("_", " ") };
  if (run.conclusion === "success") return { key: "success", label: "Success" };
  if (["failure", "timed_out", "action_required", "startup_failure"].includes(run.conclusion)) return { key: "failure", label: run.conclusion.replaceAll("_", " ") };
  return { key: "stale", label: (run.conclusion ?? run.status).replaceAll("_", " ") };
}

function allWorkflows() { return state.data.modules.flatMap(({ workflows }) => workflows); }
function showError(message) { const element = document.querySelector("#error"); element.hidden = false; element.textContent = message; }
function formatDuration(seconds) { return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`; }
function relativeTime(value) {
  const delta = Date.parse(value) - Date.now();
  const minutes = Math.round(delta / 60000);
  if (Math.abs(minutes) < 60) return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 48) return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(hours, "hour");
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round(hours / 24), "day");
}
function escapeHtml(value) { const span = document.createElement("span"); span.textContent = String(value); return span.innerHTML; }
function escapeAttribute(value) { return escapeHtml(value).replaceAll('"', "&quot;"); }
