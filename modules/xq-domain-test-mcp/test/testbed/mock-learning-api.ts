import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";

export const TESTBED_TOKEN = "testbed-token";

type Exercise = {
  id: string;
  lesson_id: string;
  count: number;
  type: string;
};

type MockState = {
  exercises: Exercise[];
  nextId: number;
};

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  });
  response.end(body);
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
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
  return parsed as Record<string, unknown>;
}

function authorized(request: IncomingMessage): boolean {
  return request.headers.authorization === `Bearer ${TESTBED_TOKEN}`;
}

export async function serveMockLearningApi(): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const state: MockState = {
    exercises: [],
    nextId: 1
  };

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");

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
        if (!Number.isInteger(count) || Number(count) < 1) {
          writeJson(response, 400, { error: "count must be a positive integer" });
          return;
        }

        const exercise = {
          id: `ex-${state.nextId}`,
          lesson_id: lessonId,
          count: Number(count),
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

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("mock server did not bind to a TCP port");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      })
  };
}
