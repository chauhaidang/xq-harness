import type { RuntimeConfig } from "../runtime/runtime-state.js";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type RestCallInput = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  expected_status?: number;
  timeout_seconds?: number;
};

export type RestCallOutput = {
  tool: "call_rest_api";
  category: "rest_api";
  method: string;
  url: string;
  statusCode: number;
  json?: unknown;
  assertion?: {
    expected_status: number;
    actual_status: number;
    passed: boolean;
  };
};

export class RestClient {
  async call(config: RuntimeConfig, input: RestCallInput): Promise<RestCallOutput> {
    const method = input.method.toUpperCase() as RestCallInput["method"];
    const url = new URL(input.path.replace(/^\/+/, ""), `${config.apiBaseUrl}/`).toString();
    const headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json"
    });

    if (config.apiToken !== undefined) {
      headers.set("Authorization", `Bearer ${config.apiToken}`);
    }

    const timeoutSeconds = input.timeout_seconds ?? 10;
    const response = await fetch(url, {
      method,
      headers,
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
      signal: AbortSignal.timeout(timeoutSeconds * 1000)
    });

    const text = await response.text();
    const parsed = text.length === 0 ? undefined : JSON.parse(text);
    const output: RestCallOutput = {
      tool: "call_rest_api",
      category: "rest_api",
      method,
      url,
      statusCode: response.status,
      json: parsed
    };

    if (input.expected_status !== undefined) {
      output.assertion = {
        expected_status: input.expected_status,
        actual_status: response.status,
        passed: response.status === input.expected_status
      };
    }

    return output;
  }
}
