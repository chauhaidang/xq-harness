# Solutions

## SOL-7D58243F — Copyable Python Playwright scaffold

Status: `proposed`

Spec: `SPEC-E28E9970`

Implemented docs/templates/python-playwright-module with pyproject.toml, module-local install script, pytest fixtures, skipped smoke test, and README. Added .github/workflows/module-ci-python.yml and documented usage from module onboarding/docs.

## SOL-B79B25A8 — Python BasedPyright scaffold

Status: `proposed`

Spec: `SPEC-2EFD88B4`

Implemented docs/templates/python-basedpyright-module with pyproject.toml, [tool.basedpyright] settings, sample src package, import test, modules.yaml guidance, and CI guidance. Removed the erroneous Playwright scaffold and artifact ignores.

## SOL-6028E2E7 — FastAPI step-by-step Markdown guide

Status: `proposed`

Spec: `SPEC-5C3C1D53`

Added docs/learning/fastapi-step-by-step.md with setup, route, path/query/body, CRUD, error handling, complete main.py, practice tasks, and mental model sections. Updated docs/README.md to include docs/learning.

## SOL-5F6F61A1 — POC MCP server for XQ automation testing

Status: `proposed`

Spec: `SPEC-C6FE7ABA`

Implement a Node/TypeScript MCP server under modules/poc/automation-testing-mcp. Start with read-only discovery and scaffolding tools, then add guarded execution tools that call ./scripts/module for registered modules. Tools should cover module discovery, BDD harness setup guidance, mobile E2E helper guidance, config validation, and test execution summaries.

## SOL-D9BE644A — Automation testing MCP phased implementation plan

Status: `proposed`

Spec: `SPEC-C6FE7ABA`

Phase 1 builds a Node/TypeScript MCP server under modules/poc/automation-testing-mcp with read-only tools for module discovery, BDD setup guidance, mobile E2E setup guidance, and structure validation. Phase 2 adds guarded execution tools that accept explicit module names and delegate to ./scripts/module install/build/test, returning structured summaries. Phase 3 evaluates whether the POC should graduate into a package or remain a local Codex/MCP utility. The server should expose small task-oriented tools, avoid broad filesystem access, and reuse xq-test-harness and xq-test-utils conventions rather than inventing a new test DSL.

## SOL-83E60D8F — Scenario mapping MCP runner

Status: `proposed`

Spec: `SPEC-28FCFE37`

Refocus the POC around scenario execution from agent-provided Markdown mappings. Provide tools such as xq_validate_scenario_mapping, xq_list_mapped_scenarios, xq_dry_run_scenario, and xq_run_scenario. Keep the mapping payload structured and explicit; the MCP server should not infer arbitrary commands from prose. Scenario targets should resolve to known runner adapters: BDD/Playwright scenarios, Detox/Jest E2E tests, or registered module runner commands. Execution must be guarded by allowlisted modules/paths and return structured run evidence for the agent to summarize.

## SOL-3149CE10 — Domain tool automation MCP

Status: `proposed`

Spec: `SPEC-F1F123B9`

Build the POC MCP server as a catalog of domain-specific automation tools rather than a scenario runner. Initial tools can include create-exercises plus supporting read/validate/list actions as needed by the scenario workflow. The agent parses scenarios Markdown, maps a scenario to a tool call, and invokes the matching MCP tool with typed arguments. The server validates inputs, performs the domain action, optionally triggers test execution through approved runners, and returns structured results for the agent to report.

## SOL-AB3FBA5D — Implement xq-domain-test-mcp MVP in phased slices

Status: `proposed`

Spec: `SPEC-085516FA`

Phase 1 scaffold modules/poc/xq-domain-test-mcp as a uv Python FastMCP project with package xq_mcp and CLI xq-domain-test-mcp. Phase 2 implement runtime state and environment tools: configure_environment, get_environment, clear_environment. Phase 3 add catalog/category metadata for domain_api and rest_api. Phase 4 implement the first concrete domain_api tool using a fake/injected adapter first, then wire the generated Python API client behind an adapter. Phase 5 implement one rest_api tool backed by a configured HTTP client. Phase 6 add tests for runtime config, missing-config failures, tool registration, redaction, and adapter invocation. Phase 7 document the agent flow from scenario Markdown to MCP tool calls.

## SOL-75F2D587 — REST API focused xq-domain-test-mcp MVP

Status: `proposed`

Spec: `SPEC-085516FA`

Shrink the xq-domain-test-mcp MVP to a minimal REST API testing server. Keep runtime.py for in-memory environment config, tools.py for configure/get/clear environment plus call_rest_api, and server.py for FastMCP registration. Remove domain_api/generated-client scaffolding, catalog registry, and adapter folders from the MVP. Generated API client support is parked for a later phase after the REST API testing workflow is validated.

## SOL-B55DD9B3 — Promoted xq-domain-test-mcp production module

Status: `proposed`

Spec: `SPEC-D0C96337`

Moved xq-domain-test-mcp into modules/xq-domain-test-mcp as an independent Python uv module, registered it in modules.yaml with install/build/test commands, updated README and docs/modules documentation, removed the old POC directory, verified ./scripts/module ci xq-domain-test-mcp, cleaned generated artifacts, and refreshed the global uv tool install from the production module path.

## SOL-6B66F019 — xq-domain-test-mcp delivery plan

Status: `proposed`

Spec: `SPEC-D0C96337`

Deliver xq-domain-test-mcp as a tag-released Python wheel plus agent skill bundle. Gate release through ./scripts/module ci xq-domain-test-mcp, verify uv tool installation of the wheel, publish GitHub Release artifacts from tag xq-domain-test-mcp-v<version>, and validate consumer onboarding with xq-config.json, installed skill, MCP client config, and testbed scenario execution. Keep MVP scope to runtime environment tools and REST API primitives; defer generated domain-client tools until the REST workflow is proven.

## SOL-DE603B19 — Node 26 standard-library MCP redesign

Status: `proposed`

Spec: `SPEC-A65A7404`

Replace the Python FastMCP implementation with a Node.js 26 package whose external seam is a small MCP stdio server plus contract files. Implement src/contracts for loading JSON Schema, src/mcp for JSON-RPC/MCP method dispatch, src/tools for contract-backed tool registration, src/runtime for in-memory environment state, src/rest for REST execution, and test/ using node:test. Use package.json scripts for node --test, node --check, and a contract smoke test. Update modules.yaml and GitHub Actions to use node-version: 26. Release artifacts should include the npm/package artifact or tarball, the CLI bin xq-domain-test-mcp, and the agent skill bundle. Preserve the agent-owned scenario mapping model.

## SOL-6D48F3AD — Node 26 TypeScript xq-domain-test-mcp implementation

Status: `proposed`

Spec: `SPEC-A65A7404`

Implemented xq-domain-test-mcp as a Node 26 TypeScript package. Added McpTool<Input, Output>, runtime config tools, REST API tool, MCP SDK stdio server, generated JSON Schema contract bundle, contract examples, node:test coverage, Node testbed mock API, npm package lock, module runner updates, Node CI/CD workflows, and docs updates. Removed Python pyproject/uv lock/source/tests/testbed mock API after Node parity passed.

## SOL-AF4A1306 — Node 26 TypeScript xq-domain-test-mcp final PR implementation

Status: `proposed`

Implemented xq-domain-test-mcp as a Node 26 TypeScript/Yarn 4 module. The implementation uses @modelcontextprotocol/sdk for stdio MCP wiring, one McpTool<Input, Output> interface for tool classes, Zod schemas for input/output validation, runtime config tools, call_rest_api, Node fetch, node:test coverage, MCP SDK stdio client smoke coverage, and a Node mock API testbed. Python uv/FastMCP artifacts were removed. No JSON contract bundle is shipped; tool schemas are exposed through MCP discovery. Release packaging uses yarn pack for the tarball and keeps npm only for global consumer CLI installation verification.

## SOL-B751DD5C — Deep InfraApplication and PluginRegistry for xq-test-infra

Status: `proposed`

Implement extensibility in phases: first introduce an InfraApplication module and PluginRegistry with built-in adapters that reproduce current behavior; then move spec loading and compose generation into registered adapters/pipeline transforms; then split gateway route planning/rendering, Docker runtime execution, registry auth, and test detection into explicit adapter seams. Preserve existing xq-infra command behavior during each slice.

## SOL-3F08410C — Phased xq-test-infra redesign around InfraApplication

Status: `proposed`

Spec: `SPEC-3D2903DD`

Phase 0 documents current behavior and golden outputs. Phase 1 introduces InfraApplication with command methods generate, up, down, and logs, moving process exits and console concerns to the CLI adapter. Phase 2 adds PluginRegistry and built-in adapters without third-party plugin loading. Phase 3 moves spec loading, override merging, validation, compose planning, and compose rendering behind internal seams. Phase 4 separates gateway route planning from nginx rendering and makes gateway implementation replaceable. Phase 5 separates Docker Compose runtime execution, registry auth, test detection, and reporting behind adapter interfaces. Phase 6 optionally adds external plugin loading once at least one real non-built-in plugin exists. Each phase preserves current CLI behavior and is verified through ./scripts/module test xq-test-infra.

## SOL-DD3D877E — xq-test-infra InfraApplication tracer slice

Status: `proposed`

Spec: `SPEC-3D2903DD`

Implemented the first redesign slice with TDD. Added src/app/infraApplication.js as a deep application seam with generate, up, down, and logs methods. Added tests/infraApplication.test.js before implementation to cover compose generation, Docker Compose up orchestration, pull fallback warnings, default source path detection, non-fatal test detection failures, down, and logs. Refactored src/cli/index.js to parse CLI options and delegate command behavior to InfraApplication. Verified with ./scripts/module ci xq-test-infra.

## SOL-30C707A7 — xq-test-infra PR prep and 0.1.1 version bump

Status: `proposed`

Spec: `SPEC-3D2903DD`

Reviewed the InfraApplication redesign slice against the recorded xq-test-infra deep-module redesign contract and repo conventions. No blocking implementation findings remained. Bumped xq-test-infra from 0.1.0 to 0.1.1 in modules.yaml, package.json, docs/modules/README.md, CATALOGUE.md, and modules/xq-test-infra/README.md. Verified with ./scripts/module ci xq-test-infra.

## SOL-DB6E69A9 — Python 1.0.3 xq-domain-test-mcp revert

Status: `proposed`

Spec: `SPEC-D0C96337`

Restored the Python xq_mcp module, uv project metadata, Python tests, Python testbed, module skill, Python CI workflow, and GitHub Release wheel/skill-bundle workflow from the last Python release lineage. Removed the Node/TypeScript package metadata, Yarn files, TypeScript sources/tests, npm package CD workflow, and Node testbed server. Updated pyproject, uv.lock, modules.yaml, and xq_mcp.__version__ to 1.0.3. Verified ./scripts/module ci xq-domain-test-mcp: BasedPyright 0 errors, wheel/sdist built, 7 pytest tests passed.
