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

## SOL-30F8CB43 — xq-octopus Python REST CLI implementation

Status: `proposed`

Spec: `SPEC-0E8A98BE`

Implemented modules/xq-octopus as a uv-managed Python package using a src/xq_octopus layout. Added RuntimeConfig redaction, xq.json loading and validation, urllib-based REST execution with structured evidence and HTTP error evidence, status and JSON pointer validation, argparse CLI commands, README usage docs, and behavior-focused pytest coverage for config, validation, REST, and CLI. Verified uv sync --locked, SOURCE_DATE_EPOCH=0 uv run basedpyright, SOURCE_DATE_EPOCH=0 uv build, and uv run pytest.

## SOL-86266C67 — xq-octopus Day 1 app implementation

Status: `proposed`

Spec: `SPEC-0E8A98BE`

Implemented the Day 1 app layout with RuntimeConfig, command/result models, config loading, validation, RestTool with private urllib transport, ToolFactory, ExecutionEngine, output rendering, command catalog, CLI commands, and xq.json.example. Verified uv sync --locked, SOURCE_DATE_EPOCH=0 uv run basedpyright, SOURCE_DATE_EPOCH=0 uv build, uv run pytest, uv run xq-octopus --help, and uv run xq-octopus commands --json.

## SOL-7AF875BB — pnpm workspace migration

Status: `proposed`

Spec: `REQ-90E4AF71`

Implemented pnpm onboarding by adding root package.json and pnpm-workspace.yaml, generating pnpm-lock.yaml, switching modules.yaml Node commands to pnpm, changing packageManager fields to pnpm@10.14.0, replacing portal: deps with workspace:*, pinning Playwright to 1.60.0 for playwright-bdd compatibility, disabling pnpm optional peer auto-installing, updating CI publish to pnpm publish --no-git-checks, removing Yarn config/binaries/locks, and updating active docs and skills.

## SOL-0BF100A3 — pnpm workspace migration implementation

Status: `proposed`

Spec: `SPEC-D6F080A6`

Implemented pnpm onboarding by adding root package.json and pnpm-workspace.yaml, generating pnpm-lock.yaml, switching modules.yaml Node commands to pnpm, changing packageManager fields to pnpm@10.14.0, replacing portal: deps with workspace:*, pinning Playwright to 1.60.0 for playwright-bdd compatibility, disabling pnpm optional peer auto-installing, updating CI publish to pnpm publish --no-git-checks, removing Yarn config/binaries/locks, and updating active docs and skills.

## SOL-1A261409 — xq-octopus Bun-only package experiment

Status: `proposed`

Spec: `SPEC-3FD8ED54`

Removed xq-octopus from pnpm-workspace.yaml, switched modules/xq-octopus/package.json to bun@1.3.14, replaced ts-node/tsc dependencies with Bun scripts, added a Bun build script, refactored index.ts into an exported greeting function, added index.test.ts using bun:test, and updated xq-octopus handoff/dev-guide package-manager references.

## SOL-139CEFF2 — Go xq-octopus developer guide

Status: `proposed`

Spec: `SPEC-CE35DBD0`

Added modules/xq-octopus/xq-octopus-dev-guide-go.md with a full Go implementation path for the same REST testing CLI: goals, stack, mental model, package layout, go.mod setup, xq.json contract, shared models, config loader, validation, REST client, engine, CLI adapter, output rendering, command catalog, tests, validation commands, release binary builds, mistakes, and out-of-scope boundaries. Linked it from HANDOFF.md as the Vibium-style single-binary alternative.

## SOL-BA488A29 — Cobra replanning for xq-octopus Go guide

Status: `proposed`

Spec: `SPEC-CE35DBD0`

Replanned modules/xq-octopus/xq-octopus-dev-guide-go.md around Vibium's Cobra CLI pattern: updated stack choice, setup commands, starter main.go, command constructor files, module skeleton, go.mod dependency, Step 10 CLI adapter guidance, repeated flag handling, and common-mistake guidance. Updated HANDOFF.md to describe the Go track as Cobra-based single-binary delivery.

## SOL-51853A8C — Explicit pnpm setup in reusable workflows

Status: `proposed`

Spec: `SPEC-D6F080A6`

Updated .github/workflows/module-ci-node.yml and module-cd-github-packages.yml to use pnpm/action-setup@v6 with version 10.14.0 and run pnpm --version before module CI or publish. Updated docs/github-actions.md to document that CI does not rely on hosted-runner pnpm or Corepack alone.

## SOL-64953201 — Remove xq-octopus Go guide artifact

Status: `proposed`

Spec: `SPEC-CE35DBD0`

Deleted modules/xq-octopus/xq-octopus-dev-guide-go.md and removed the alternative Go implementation track from modules/xq-octopus/HANDOFF.md.

## SOL-55B6D36C — xq-octopus TypeScript build input fix

Status: `proposed`

Spec: `SPEC-D6F080A6`

Added the starter app/cli/main.ts entrypoint expected by tsconfig include app/**/*.ts, enabled declaration output, aligned package main/types/bin paths with dist/cli/main.*, registered xq-octopus in modules.yaml, and added a starter Jest test. Verified ./scripts/module build xq-octopus, pnpm run build, node dist/cli/main.js --help, and ./scripts/module test xq-octopus.

## SOL-04F4D19C — xq-octopus Prettier setup

Status: `proposed`

Spec: `SPEC-D6F080A6`

Configured modules/xq-octopus with Prettier 3.9.4, module-local .prettierrc.json and .prettierignore, package scripts format and format:check, and formatted existing octopus files. Verified format:check, lint, ./scripts/module build xq-octopus, and ./scripts/module test xq-octopus.

## SOL-31F1DDD4 — Correct xq-octopus test runner and Node baseline

Status: `proposed`

Spec: `SPEC-D6F080A6`

Replaced the xq-octopus Jest starter with direct TypeScript node:test execution on Node >=22, removed jest.config.cjs and Jest dependencies from the octopus importer, simplified app/cli/main.ts to a synchronous parse(), updated octopus docs, and aligned active repo Node engine/toolchain metadata to Node 22. Verified format:check, lint, ./scripts/module build xq-octopus, ./scripts/module test xq-octopus, and node dist/cli/main.js --help.

## SOL-CF0FC0EB — xq-octopus dev guide current Node setup

Status: `proposed`

Spec: `SPEC-D6F080A6`

Updated modules/xq-octopus/xq-octopus-dev-guide.md so its setup templates and validation commands match the current direction: Node >=22, pnpm 10, TypeScript nodenext, Commander, direct .ts tests through node:test, Prettier format scripts/config, ESLint, synchronous starter main(), and no Jest/ts-jest dependency for v1.

## SOL-DEA325D2 — xq-octopus Step 4 config scaffold

Status: `proposed`

Spec: `SPEC-D6F080A6`

Completed Step 4 by adding a safe xq.json.example with environments.dev.api_base_url, api_token, and headers, plus README config instructions and local command examples. Verified Prettier check for README.md and xq.json.example, ./scripts/module build xq-octopus, and ./scripts/module test xq-octopus.

## SOL-F62EBBF4 — xq-octopus Step 5 shared model types

Status: `proposed`

Spec: `SPEC-D6F080A6`

Completed Step 5 by adding app/model/config.ts for RuntimeConfig, app/model/result.ts for JSON values, response evidence, validation, command result, and error result types, and app/model/command.ts for Command, ExecutionContext, RestCommand, and the tool interfaces RestCommand delegates to. Verified Prettier on model files, ESLint on app/model, ./scripts/module build xq-octopus, and ./scripts/module test xq-octopus.

## SOL-6F2224EB — xq-octopus Day 1 REST CLI implementation

Status: `proposed`

Spec: `SPEC-D6F080A6`

Implemented the Day 1 Node/TypeScript xq-octopus slice: RuntimeConfig redaction, config loader with typed ConfigError, JSON/status validation, method-specific RestTool using built-in fetch/AbortController, lazy ToolFactory, generic ExecutionEngine delegating to Command.execute(context), JSON/pretty output rendering, command catalog, and Commander commands for commands, config, get, post, put, patch, and delete. Added node:test coverage for config, validation, RestTool, factory, engine, catalog, output, and CLI handlers. Verified ./node_modules/.bin/prettier --check ., ./node_modules/.bin/eslint . --ext .ts, ./scripts/module build xq-octopus, node --test test/**/*.test.ts, node dist/cli/main.js commands --json, node dist/cli/main.js config --env dev --config xq.json.example, and ./scripts/module test xq-octopus.

## SOL-07AE3AF5 — xq-octopus model review simplification

Status: `proposed`

Spec: `SPEC-D6F080A6`

Addressed review comments by using api_base_url/api_token consistently in RuntimeConfig and output, removing the separate JsonPrimitive alias, flattening ValidationResult so type/expected/path live directly on the result, and retaining a local JsonValue type to avoid adding a dependency for a small JSON-serializable union. Verified focused tests, lint, format check, build, and ./scripts/module test xq-octopus.

## SOL-F420A4D6 — Restore xq-octopus internal camelCase config

Status: `proposed`

Spec: `SPEC-D6F080A6`

Changed RuntimeConfig and runtime code back to camelCase apiBaseUrl/apiToken while preserving snake_case xq.json parsing and redacted CLI output. Updated config, REST, engine tests accordingly. Verified ./scripts/module build xq-octopus, focused node:test files, ESLint, Prettier check, and ./scripts/module test xq-octopus.

## SOL-19AE6B49 — xq-octopus subprocess E2E tests

Status: `proposed`

xq-octopus now has test/e2e-cli.test.ts. The test starts a local Node HTTP API exposing /health, /echo, and /openapi.json, writes a real xq.json with camelCase config, spawns node dist/cli/main.js, and asserts real process exit codes plus stdout JSON.

## SOL-4B14F4DB — xq-octopus module skill

Status: `proposed`

Added modules/xq-octopus/skills/xq-octopus/SKILL.md with practical CLI usage instructions: when to use the CLI, setup/build commands, xq.json contract, command discovery, REST call examples, JSON-pointer validation, exit code handling, OpenAPI smoke workflow, and safety guardrails. AGENTS.md now lists xq-octopus as a module-level skill.

## SOL-F3E2D6F9 — iOS finance archive script

Status: `proposed`

Added modules/ios-xq-finance-app/scripts/archive-ipa.sh. It resolves the repo root, archives ios-xq-finance-app for generic iOS Release using the documented project/scheme/archive path, exports with exportOptions.plist, writes xcodebuild logs to stderr, and prints the absolute IPA path. Verified output: /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ipa/ios-xq-finance-app.ipa.

## SOL-54B28A90 — iOS finance device provisioning guard

Status: `proposed`

Verified Xcode sees physical device 00008150-0012058A14F8401C as destination David for ios-xq-finance-app. The exported IPA embeds provisioning profile iOS Team Provisioning Profile: com.xq.finance.ios-xq-finance-app, UUID 11a9373c-781b-4390-8f6c-09c8b2729396, team T99X93V7Y2, and ProvisionedDevices includes 00008150-0012058A14F8401C. Updated archive-ipa.sh so IOS_DEVICE_ID=00008150-0012058A14F8401C archives/exports and fails if the exported IPA profile does not include that device. Verified output IPA: /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ipa/ios-xq-finance-app.ipa.

## SOL-71BB4EF6 — Reliable iOS finance currency toggle

Status: `proposed`

Updated CurrencyToggleView so each USD/VND segment has a full capsule contentShape and a 52pt minimum hit target, preserving the existing visual style while making the transparent/unselected segment reliably tappable. Added accessibility identifiers for USD and VND segment buttons and extended the portfolio lifecycle UI test to tap VND then USD once and assert the asset current value changes format. Validation: ./scripts/module build ios-xq-finance-app passed. ./scripts/module test ios-xq-finance-app built the app/test bundle but the simulator runner hung waiting for target-runner workers and was interrupted, matching the existing simulator hang pattern.

## SOL-42608C27 — Full-rectangle currency segment hit targets

Status: `proposed`

Updated CurrencyToggleView to use a ZStack with Color.clear and contentShape(Rectangle()) for each USD/VND segment, while keeping the selected capsule visual. This makes the far left/right segment areas tappable instead of only the center/text/capsule region. Added root scripts/archive-ipa.sh wrapper to call modules/ios-xq-finance-app/scripts/archive-ipa.sh, updated BUILD_AND_TEST.md to document the root command, and verified ./scripts/module build ios-xq-finance-app plus IOS_DEVICE_ID=00008150-0012058A14F8401C ./scripts/archive-ipa.sh. Fresh IPA: /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ipa/ios-xq-finance-app.ipa.

## SOL-788DC77A — Currency toggle button wrapper hit area

Status: `proposed`

After user clarified that taps on USD/VND text worked but taps outside the text still missed, expanded the Button wrapper itself with frame(maxWidth: .infinity, minHeight: 56) and Rectangle contentShape, in addition to the label-level clear rectangular hit layer. This makes the segment's full half-width button area the tap target. Validation: ./scripts/module build ios-xq-finance-app passed.

## SOL-09B1598B — Renderable invisible surface for unselected currency segment

Status: `proposed`

User observed selected segment produced button haptic outside the word, but unselected segment did not. Replaced Color.clear in CurrencyToggleView with Rectangle().fill(.white.opacity(0.001)) so the unselected USD/VND half has a real renderable hit surface while remaining visually invisible. Validation: ./scripts/module build ios-xq-finance-app passed; IOS_DEVICE_ID=00008150-0012058A14F8401C ./scripts/archive-ipa.sh succeeded and produced /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ipa/ios-xq-finance-app.ipa.

## SOL-6858B8FB — Currency toggle uses explicit segment hit zones

Status: `proposed`

Replaced CurrencyToggleView's per-button visual layout with a single fixed-height segmented control that renders the selected thumb and text as passive layers, then overlays two explicit half-width Button hit zones. This targets the physical-device bug where the unselected USD/VND segment responded only when tapping directly on the text. Added UI-test screen-object helpers that tap the edge of each currency segment and updated the lifecycle test to assert currency switching from those edge taps. Validation: ./scripts/module build ios-xq-finance-app passed; xcodebuild -scheme ios-xq-finance-app build-for-testing passed; xcodebuild -scheme ios-xq-finance-app-ui-tests build-for-testing passed; IOS_DEVICE_ID=00008150-0012058A14F8401C ./scripts/archive-ipa.sh succeeded and exported /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ipa/ios-xq-finance-app.ipa with the embedded profile including that device.

## SOL-9CB012B7 — Currency toggle parent gesture handles full-control taps

Status: `proposed`

Debugged the USD/VND segmented control after a physical-device screenshot showed only the text area effectively changed currency. The prior implementations expanded visual/touch surfaces around per-segment Buttons, but the user confirmed taps outside the text could be recognized without triggering the currency-change event. Root cause: the action was still owned by child Button/label hit testing, so visual capsule width and reliable event dispatch diverged. Changed CurrencyToggleView to render the segmented control as passive visuals and attach a SpatialTapGesture to the full parent control. The gesture maps the tap x-coordinate to USD or VND and calls the same setCurrency path for the entire left/right half. Added a single displayCurrencyToggle accessibility identifier and updated UI tests to tap the toggle by coordinate. Validation: ./scripts/module build ios-xq-finance-app passed; xcodebuild -scheme ios-xq-finance-app-ui-tests build-for-testing passed; IOS_DEVICE_ID=00008150-0012058A14F8401C ./scripts/archive-ipa.sh succeeded and exported /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ipa/ios-xq-finance-app.ipa.

## SOL-E69F90F7 — Currency toggle edge-tap UI evidence

Status: `proposed`

Added CurrencyToggleHitTargetTests to the ios-xq-finance-app UI-test target and ran the focused test on iPhone 16 Simulator. Evidence bundle: /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ui-test-results/currency-toggle-hit-target-rerun.xcresult. Result: TEST SUCCEEDED; executed 1 test, 0 failures. The log shows taps on xq.display-currency.toggle at normalized coordinates [0.95, 0.50] for the right edge and [0.05, 0.50] for the left edge. Exported kept screenshot attachments to /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ui-test-results/currency-toggle-hit-target-images/01-start-usd.png, 02-after-right-edge-vnd.png, and 03-after-left-edge-usd.png.

## SOL-94116D4D — Verified iOS IPA provisioning for device 00008101-000E548E34F0001E

Status: `proposed`

Archived ios-xq-finance-app with IOS_DEVICE_ID=00008101-000E548E34F0001E using ./scripts/archive-ipa.sh. Export succeeded, the decoded embedded.mobileprovision included the requested device UDID, and the script printed /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ipa/ios-xq-finance-app.ipa as the final IPA path.

## SOL-2B28247C — Physical iPhone UI test blocked by untrusted developer certificate

Status: `proposed`

Attempted the focused CurrencyToggleHitTargetTests/testCurrencyToggleRespondsToEdgeTaps UI test on physical iPhone destination 00008101-000E548E34F0001E using xcodebuild. Xcode initially lacked a UI-test runner provisioning profile, then -allowProvisioningUpdates created/signed com.xq.finance.ios-xq-finance-appUITests.xctrunner. The device rejected launching the test runner because the Developer App certificate was not trusted on the phone. Xcode recovery suggestion: open Settings on the device, go to General -> VPN & Device Management, select the Developer App certificate, and trust it. Physical result bundle: /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ui-test-results/currency-toggle-hit-target-device-00008101-allow-provisioning.xcresult.

## SOL-8273FC0A — Physical iPhone currency toggle edge-tap UI test passed

Status: `proposed`

Reran CurrencyToggleHitTargetTests/testCurrencyToggleRespondsToEdgeTaps on physical iPhone destination 00008101-000E548E34F0001E after trusting the developer certificate. xcodebuild succeeded with 1 test and 0 failures. Result bundle: /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ui-test-results/currency-toggle-hit-target-device-00008101-trusted.xcresult. Exported physical-device screenshots: /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ui-test-results/currency-toggle-hit-target-device-00008101-images/01-start-usd.png, /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ui-test-results/currency-toggle-hit-target-device-00008101-images/02-after-right-edge-vnd.png, /Users/automation2/Documents/workspace/xq-harness/modules/ios-xq-finance-app/build/ui-test-results/currency-toggle-hit-target-device-00008101-images/03-after-left-edge-usd.png.
