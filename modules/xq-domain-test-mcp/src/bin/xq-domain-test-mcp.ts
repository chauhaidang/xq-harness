#!/usr/bin/env node
import { runStdioServer } from "../mcp/stdio-server.js";

runStdioServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
