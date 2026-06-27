#!/usr/bin/env node

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "remote-payload");
const port = Number(process.env.PORT || 8123);
const host = process.env.HOST || "127.0.0.1";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".bundle": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

http
  .createServer((req, res) => {
    const requestPath = req.url === "/" ? "/manifest.json" : req.url;
    const filePath = path.join(root, path.normalize(requestPath));

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(data);
    });
  })
  .listen(port, host, () => {
    console.log(`Serving remote payload from ${root} on http://${host}:${port}`);
  });
