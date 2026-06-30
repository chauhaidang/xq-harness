#!/usr/bin/env node
import http from "node:http";
import { URL } from "node:url";

const host = "127.0.0.1";
const portArgIndex = process.argv.indexOf("--port");
const port = portArgIndex === -1 ? 18765 : Number(process.argv[portArgIndex + 1]);
const token = "testbed-token";
const state = {
  exercises: [],
  nextId: 1
};

function writeJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  });
  response.end(body);
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) {
    return {};
  }
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("JSON body must be an object");
  }
  return parsed;
}

function authorized(request) {
  return request.headers.authorization === `Bearer ${token}`;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${host}`);

  if (request.method === "GET" && url.pathname === "/health") {
    writeJson(response, 200, { status: "ok" });
    return;
  }

  if (url.pathname !== "/exercises") {
    writeJson(response, 404, { error: "not found" });
    return;
  }

  if (!authorized(request)) {
    writeJson(response, 401, { error: "unauthorized" });
    return;
  }

  if (request.method === "GET") {
    const lessonId = url.searchParams.get("lesson_id")?.trim();
    if (!lessonId) {
      writeJson(response, 400, { error: "lesson_id is required" });
      return;
    }
    writeJson(response, 200, {
      lesson_id: lessonId,
      exercises: state.exercises.filter((exercise) => exercise.lesson_id === lessonId)
    });
    return;
  }

  if (request.method === "POST") {
    try {
      const body = await readJson(request);
      const lessonId = String(body.lesson_id ?? "").trim();
      const count = body.count;
      const type = String(body.type ?? "vocabulary").trim() || "vocabulary";

      if (!lessonId) {
        writeJson(response, 400, { error: "lesson_id is required" });
        return;
      }
      if (!Number.isInteger(count) || count < 1) {
        writeJson(response, 400, { error: "count must be a positive integer" });
        return;
      }

      const exercise = {
        id: `ex-${state.nextId}`,
        lesson_id: lessonId,
        count,
        type
      };
      state.nextId += 1;
      state.exercises.push(exercise);
      writeJson(response, 201, exercise);
    } catch {
      writeJson(response, 400, { error: "invalid json body" });
    }
    return;
  }

  writeJson(response, 404, { error: "not found" });
});

server.listen(port, host, () => {
  console.log(`Mock learning API listening on http://${host}:${port}`);
  console.log(`Use api_token=${JSON.stringify(token)} with configure_environment`);
});
