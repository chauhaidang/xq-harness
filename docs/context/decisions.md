# Decisions

## DEC-5B67B144 — AGENTS.md structure

Status: `accepted`

Root AGENTS.md is the single entry point for agents: session start, skills routing (.agents/ + module skills), harness-state obligations, key docs, module runner, conventions, STAR.

**Rationale:** Previous AGENTS.md was placeholder text. A structured entry doc reduces agent improvisation and aligns with harness-state + Matt Pocock skill workflows already in the repo.

## DEC-7296993C — POC uses hosted web payload seam instead of full React Native runtime

Status: `accepted`

The xq-ios-shell-app proof of concept implements the shell, manifest fetch, runtime validation, fallback view, and host-API bridge using a hosted web payload rendered in WKWebView. The manifest contract and loader seam are shaped so a future react-native payload kind can replace the web renderer without changing the shell control flow.

**Rationale:** The repository does not contain React Native or Metro dependencies, and network-restricted setup prevents adding them safely during this task. A web payload keeps the hard parts of remote loading real while remaining buildable with the toolchain already present in the repo.

## DEC-348DAAF3 — POC adds jsbundle bootstrap payload kind

Status: `accepted`

The xq-ios-shell-app POC now supports a manifest payload kind of jsbundle. In this mode, the shell builds a minimal HTML bootstrap document, injects the shell bridge, and loads a remote JavaScript bundle URL into WKWebView. This is a stepping stone toward a future React Native bundle loader while preserving manifest-driven payload selection and shell-controlled bridge semantics.

**Rationale:** A hosted JavaScript bundle exercises remote loading and host API boundaries without requiring React Native and Metro integration in the current repository state.

## DEC-3F8EC55D — Python Playwright setup lives as a reusable module template

Status: `accepted`

Add a copyable Python Playwright template under docs/templates/python-playwright-module, plus a reusable Python CI workflow. Do not retrofit Playwright into the existing harness-state module because it has no browser-facing tests.

**Rationale:** The repo uses independent modules and modules.yaml as the command source of truth. A template lets each Python module opt in with its own uv.lock and install command while keeping current modules minimal.

## DEC-292C7867 — Supersede Playwright template with BasedPyright template

Status: `accepted`

The Python scaffold should target BasedPyright type checking, not browser Playwright. Replace the previous python-playwright-module scaffold with python-basedpyright-module and update docs to use basedpyright in the module build command.

**Rationale:** The user clarified 'not playwright, basedwright'; in context this maps to BasedPyright/Pyright settings for Python modules. BasedPyright is configured through [tool.basedpyright] in pyproject.toml and is installable as a Python dev dependency.

## DEC-1BAEAB59 — Expo remote component feasibility for iOS shell

Status: `accepted`

Expo can help with remote UI only if the shell includes an Expo/React Native runtime. Expo DOM components are webview-backed components compiled/imported inside an Expo app, and EAS Update updates compatible Expo/RN JavaScript bundles for a fixed native runtime. The current xq-ios-shell-app is a pure SwiftUI/WKWebView shell, so it can load hosted web or jsbundle payloads today but cannot load an Expo native component as a remote component without adding React Native/Expo integration or rebuilding the shell as an Expo app.

**Rationale:** The existing POC deliberately uses WKWebView and has no React Native or Expo dependencies. Official Expo docs describe DOM components as WebView-backed inside Expo native apps and EAS Update as runtime-version-gated JS updates, not as arbitrary remote native component loading into a pure Swift shell.

## DEC-D3845B86 — Recommended path for RN runtime in iOS shell

Status: `accepted`

If xq-ios-shell-app moves beyond WKWebView payloads, the next viable architecture is a brownfield React Native runtime embedded in the Swift/iOS shell. The shell should keep manifest fetching, runtime validation, fallback behavior, and host API versioning, but add a react-native payload adapter that creates an RN root view from a bundled or approved remote JS bundle. React Native micro-frontend patterns can sit on top of that runtime through multiple registered modules or federated JS chunks, but native modules and the RN runtime remain app-binary concerns.

**Rationale:** React Native's integration docs support embedding RN views in existing native apps, while App Store rules constrain downloaded code that changes app functionality. Keeping the current manifest seam isolates remote payload policy and allows web, jsbundle, and future react-native adapters to coexist.

## DEC-1186AAED — iOS shell links React Native through CocoaPods workspace

Status: `accepted`

xq-ios-shell-app now embeds a brownfield React Native runtime using React Native 0.86, CocoaPods, RCTReactNativeFactory, and a generated RN bundle served from the existing remote manifest seam. The module runner builds/tests the .xcworkspace instead of the .xcodeproj.

**Rationale:** React Native pods and generated dependency providers are integrated by CocoaPods, so the native shell must build from the workspace. Keeping the existing manifest seam lets the shell validate runtime/host API before mounting the RN module.

## DEC-4A3FDC8F — Use a dedicated poc module for exploratory initiatives

Status: `accepted`

Add modules/poc as a registered mixed-language module for prototypes, learning spikes, and short-lived initiatives. Keep it out of test-all and give it no-op module runner commands until a POC graduates into a durable module.

**Rationale:** Exploratory work like MCP learning should be discoverable through the same module registry as the rest of the repo, but should not create package, release, or CI obligations before the idea has proven useful.

## DEC-503CF849 — Automation MCP starts as poc module server

Status: `accepted`

Build the automation testing MCP server first under modules/poc, not as a published xq-harness package. Keep the MCP interface focused on automation testing workflows and wire execution through ./scripts/module where repo modules are involved.

**Rationale:** The repo already has an accepted decision that exploratory initiatives such as MCP learning live in modules/poc. Starting there keeps experimentation discoverable without adding release, package, or test-all obligations, while the module runner keeps commands aligned with modules.yaml.

## DEC-329DC770 — Automation MCP centers on explicit scenario mappings

Status: `accepted`

The automation testing MCP POC should expose tools for validating and running mapped test scenarios from agent-provided Markdown scenario mappings, rather than accepting free-form natural language or arbitrary shell commands.

**Rationale:** The user clarified that the input is the mapping from scenarios Markdown. Making the mapping explicit gives the agent a stable contract while preserving safety: the server can validate fields, reject ambiguity, and route execution only through known test adapters and module commands.

## DEC-844B97D6 — Scenario mapping belongs to the agent, not the MCP server

Status: `accepted`

Automation MCP tools should be domain actions such as create-exercises. The agent reads scenarios Markdown, decides which tool and arguments match a scenario, and calls the MCP tool. The server validates and executes the requested action.

**Rationale:** The user clarified that the MCP server should expose callable tools, while the agent is responsible for mapping scenarios. Keeping mapping outside the server preserves MCP as an action boundary and avoids coupling the server to a specific Markdown scenario format.

## DEC-6E2869E6 — Automation MCP POC uses Python

Status: `accepted`

Build the domain-tool catalog MCP POC in Python rather than TypeScript.

**Rationale:** The user explicitly prefers Python. The repo already uses Python and uv for harness-state, and the official MCP Python SDK provides FastMCP for concise tool definitions, which fits a POC domain tool catalog.

## DEC-49216755 — Name MCP server xq-domain-test-mcp

Status: `accepted`

The automation testing MCP server POC should be named xq-domain-test-mcp.

**Rationale:** The user explicitly named the server. The name communicates that this is an MCP server for domain-level test actions, not a generic runner or scenario parser.

## DEC-25FF9DAD — Use xq_mcp as Python import package

Status: `accepted`

The xq-domain-test-mcp POC should use xq_mcp as the Python import package name while keeping xq-domain-test-mcp as the project, CLI, and MCP server name.

**Rationale:** The user prefers a shorter Python package name. This preserves the public server/project name while avoiding repeated long nested identifiers in Python imports.

## DEC-9BF4DEEF — Compose MCP tools from templates

Status: `accepted`

Build xq-domain-test-mcp around a reusable domain tool template instead of hard-coding every MCP tool method. Each tool definition should provide name, description, input schema, output schema, adapter operation, and examples; the template handles validation, invocation, error mapping, and structured responses.

**Rationale:** The user clarified that generated API client leverage is only part of the idea. A template-first approach gives repeatable tool construction, keeps the MCP catalog consistent, and lets new domain actions be added by configuration plus small adapter operations rather than duplicating boilerplate tool handlers.

## DEC-36F388FD — First MCP tool category is domain api tool

Status: `accepted`

Organize xq-domain-test-mcp tools by category, starting with the domain api tool category for tools backed by domain API clients.

**Rationale:** The user wants tool categories, and the first use case wraps generated Python API clients. Category metadata and module layout make the catalog easier for agents to discover and keep future tool types separate from API-backed actions.

## DEC-1FFC1869 — Add rest api tool category

Status: `accepted`

xq-domain-test-mcp should support a rest api tool category alongside domain api tool. Domain api tools expose higher-level domain actions backed by generated/domain clients. Rest api tools expose direct configured HTTP endpoint calls with request/response validation.

**Rationale:** The user identified REST API tools as a separate category. Keeping this separate prevents low-level HTTP mechanics from leaking into domain tools, while still supporting scenarios where direct REST endpoint testing is the correct abstraction.

## DEC-3F148306 — Defer MCP tool template abstraction for MVP

Status: `accepted`

Remove the template concept from the xq-domain-test-mcp MVP. Implement the first tools with explicit category modules and direct registration. Shared registration/runtime abstractions can be extracted later only after repeated tool implementations prove the shape.

**Rationale:** The user found the template concept too vague for MVP. Deferring it keeps the first implementation easier to understand and reduces premature abstraction while preserving categorized tool organization.

## DEC-883CDDEC — MVP runtime config uses explicit in-memory environment tools

Status: `accepted`

Implement runtime environment parameters with configure_environment, get_environment, and clear_environment tools backed by in-memory process state.

**Rationale:** The user agreed with the in-memory one-off configuration approach. It keeps the MVP simple, avoids polluting every domain tool input with environment parameters, and gives agents an explicit setup step before scenario-driven domain tool calls.

## DEC-6BB7EDE5 — Park generated API client integration for REST API MVP

Status: `accepted`

Refocus xq-domain-test-mcp MVP on REST API testing tools. Remove domain_api/generated-client scaffolding from the MVP and defer it until the REST API test bed proves useful.

**Rationale:** The current scaffold introduced more architecture than the MVP needs. Focusing on REST API testing gives a smaller executable surface: configure environment, inspect config, clear config, call REST endpoints, and assert REST responses.

## DEC-A89AA4ED — Scenario Markdown is an agent-side mapping contract

Status: `accepted`

Define a scenario Markdown authoring contract with frontmatter and one explicit REST action so humans and agents can map scenarios to configure_environment and call_rest_api. The MCP server remains a tool executor and does not parse Markdown in the MVP.

**Rationale:** The user identified that humans and AI agents need guardrails for scenario shape. Keeping the contract in the consumer skill gives mapping consistency without expanding the MCP server runtime into a Markdown parser.

## DEC-52B7A840 — Scenario Markdown remains business-specific

Status: `accepted`

Scenario Markdown for xq-domain-test-mcp should describe business intent, entities, inputs, and expected outcomes. It should not require authors to specify REST method, path, headers, or payload. The agent maps business scenarios to call_rest_api using available domain/API context and asks for clarification when mapping is unsafe.

**Rationale:** The user clarified that scenarios are business-specific. Keeping scenarios business-readable preserves human authoring quality while still letting agents translate to REST MCP calls.

## DEC-684EDD9D — Promote xq-domain-test-mcp out of poc

Status: `accepted`

Move xq-domain-test-mcp from modules/poc into modules/xq-domain-test-mcp and register it as an independent Python module in modules.yaml.

**Rationale:** The user declared the POC ready for the next phase. A dedicated registered module gives rapid development a stable path, real install/build/test commands, and a clear ownership boundary while keeping modules/poc reserved for disposable exploratory work.
