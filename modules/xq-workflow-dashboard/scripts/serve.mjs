import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildDashboardSnapshot } from "../src/dashboard-data.mjs";
import {
  loadActiveWorkflows,
  loadRecentRepositoryRuns,
  loadWorkflowHistory,
  mergeWorkflowRuns,
  reconcileWorkflows,
  resolveRepository,
} from "../src/github-client.mjs";
import { validateDashboardSnapshot } from "../src/validate-snapshot.mjs";

const host = "127.0.0.1";
const port = Number.parseInt(process.env.DASHBOARD_PORT ?? "4173", 10);
const pollMs = Math.max(5_000, Number.parseInt(process.env.DASHBOARD_POLL_MS ?? "30000", 10));
const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));
const clients = new Set();
const repository = await resolveRepository();
let workflows = await loadWorkflowHistory(repository);
let snapshot = await createSnapshot();

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${host}:${port}`);
  if (url.pathname === "/api/snapshot") return sendJson(response, snapshot);
  if (url.pathname === "/refresh" && request.method === "POST") {
    return sendJson(response, await refresh());
  }
  if (url.pathname === "/events") return openEventStream(request, response);
  await sendStatic(url.pathname, response);
});

server.listen(port, host, () => {
  console.log(`XQ Workflow Observatory: http://${host}:${port}`);
  console.log(`Monitoring ${snapshot.summary.workflows} workflows every ${pollMs / 1000}s via local gh authentication`);
});

const poller = setInterval(refresh, pollMs);
poller.unref();

async function refresh() {
  try {
    const [activeWorkflows, recentRuns] = await Promise.all([
      loadActiveWorkflows(repository),
      loadRecentRepositoryRuns(repository),
    ]);
    workflows = mergeWorkflowRuns(reconcileWorkflows(workflows, activeWorkflows), recentRuns);
    snapshot = await createSnapshot();
    broadcast("snapshot", snapshot);
    return snapshot;
  } catch (error) {
    console.error(`[refresh] ${error.message}`);
    broadcast("error", { message: "GitHub refresh failed; showing the last successful snapshot." });
    throw error;
  }
}

async function createSnapshot() {
  const next = buildDashboardSnapshot({ repository, generatedAt: new Date().toISOString(), workflows });
  await validateDashboardSnapshot(next);
  return next;
}

function openEventStream(request, response) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  response.write(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`);
  clients.add(response);
  request.on("close", () => clients.delete(response));
}

function broadcast(event, payload) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) client.write(message);
}

function sendJson(response, payload) {
  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(`${JSON.stringify(payload)}\n`);
}

async function sendStatic(pathname, response) {
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const path = resolve(publicDirectory, relativePath);
  const pathFromPublic = relative(publicDirectory, path);
  if (pathFromPublic.startsWith("..") || isAbsolute(pathFromPublic)) return sendNotFound(response);
  try {
    const details = await stat(path);
    if (!details.isFile()) return sendNotFound(response);
    response.writeHead(200, { "Content-Type": contentType(path), "Cache-Control": "no-cache" });
    createReadStream(path).pipe(response);
  } catch {
    sendNotFound(response);
  }
}

function sendNotFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found\n");
}

function contentType(path) {
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
  }[extname(path)] ?? "application/octet-stream";
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    clearInterval(poller);
    for (const client of clients) client.end();
    server.close(() => process.exit(0));
  });
}
