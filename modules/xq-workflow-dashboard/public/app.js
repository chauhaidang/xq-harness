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
  const summary = state.data.summary;
  const health = summary.workflows ? Math.round((summary.successful / summary.workflows) * 100) : 0;
  document.querySelector("#summary").innerHTML = `
    <article class="health-score"><strong>${health}<small>%</small></strong><span>Overall health</span></article>
    <div class="summary-stat summary-success"><strong>${summary.successful}</strong><span>Healthy</span></div>
    <div class="summary-stat summary-active"><strong>${summary.active}</strong><span>In motion</span></div>
    <div class="summary-stat summary-failure"><strong>${summary.failed}</strong><span>Failed</span></div>
    <div class="summary-stat summary-stale"><strong>${summary.stale}</strong><span>Old signals</span></div>
    <div class="summary-total"><strong>${summary.workflows}</strong><span>Total</span></div>
  `;
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
    <article class="module-band" style="animation-delay:${Math.min(index * 45, 360)}ms">
      <header class="module-band-header"><h3>${escapeHtml(module.module)}</h3><span>${module.workflows.length} workflow${module.workflows.length === 1 ? "" : "s"}</span></header>
      <div class="signal-row">${module.workflows.map(renderWorkflow).join("")}</div>
    </article>
  `).join("");
  document.querySelector("#empty-state").hidden = modules.length > 0;

  renderIncidents(modules.flatMap(({ workflows }) => workflows));
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
  const status = heatmapStatus(workflow);
  const age = latest ? relativeTime(latest.updatedAt) : "No runs";
  return `<a class="signal signal-${status.key}${workflow.stale ? " signal-aged" : ""}" href="${escapeAttribute(latest?.url ?? workflow.url)}" aria-label="${escapeAttribute(`${workflow.name}: ${status.label}, ${age}`)}">
    <span class="signal-core">
      <span class="signal-name">${escapeHtml(shortWorkflowName(workflow))}</span>
      <span class="signal-type">${escapeHtml(workflow.type)}</span>
    </span>
    <span class="signal-age">${escapeHtml(age)}</span>
  </a>`;
}

function renderIncidents(workflows) {
  const incidents = workflows.filter((workflow) => heatmapStatus(workflow).key === "failure");
  const section = document.querySelector("#incident-section");
  section.hidden = incidents.length === 0;
  document.querySelector("#incidents").innerHTML = incidents.map((workflow) => {
    const run = workflow.latestRun;
    return `<a class="incident" href="${escapeAttribute(run.url)}">
      <span class="incident-dot"></span>
      <span><strong>${escapeHtml(workflow.name)}</strong><small>${escapeHtml(run.title)}</small></span>
      <span class="incident-meta">${escapeHtml(run.branch ?? "No branch")} · ${relativeTime(run.updatedAt)}</span>
    </a>`;
  }).join("");
}

function heatmapStatus(workflow) {
  const run = workflow.latestRun;
  if (!run) return { key: "stale", label: "Unknown" };
  if (ACTIVE.has(run.status)) return { key: "active", label: run.status.replaceAll("_", " ") };
  if (run.conclusion === "success") return { key: "success", label: "Success" };
  if (["failure", "timed_out", "action_required", "startup_failure"].includes(run.conclusion)) return { key: "failure", label: run.conclusion.replaceAll("_", " ") };
  return { key: "stale", label: (run.conclusion ?? run.status).replaceAll("_", " ") };
}

function shortWorkflowName(workflow) {
  const prefix = `${workflow.type.toUpperCase()} `;
  return workflow.name.startsWith(prefix) ? workflow.name.slice(prefix.length) : workflow.name;
}

function allWorkflows() { return state.data.modules.flatMap(({ workflows }) => workflows); }
function showError(message) { const element = document.querySelector("#error"); element.hidden = false; element.textContent = message; }
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
