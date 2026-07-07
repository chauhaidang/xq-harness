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

## DEC-63C9E04F — Redesign xq-domain-test-mcp around Node 26 standard-library core

Status: `accepted`

The next xq-domain-test-mcp design should move away from Python FastMCP toward a Node.js 26 implementation that uses Node standard library primitives for stdio, HTTP, file IO, test running, and assertions wherever practical. External contracts should be language-neutral JSON Schema plus generated or maintained TypeScript declaration files, not implementation-only Python or TypeScript shapes.

**Rationale:** The user wants a standard-library-heavy Node 26 module and polyglot external contracts. Node 26 is a supported Current release line on 2026-06-29 and GitHub setup-node accepts SemVer major versions, so CI can target node-version: 26 while acknowledging it becomes Active LTS on 2026-10-28.

## DEC-D007DEC3 — Use TypeScript MCP SDK at the MCP protocol seam

Status: `accepted`

The Node 26 redesign of xq-domain-test-mcp may depend on @modelcontextprotocol/sdk for MCP server wiring, stdio transport integration, and protocol compatibility. The rest of the module remains standard-library first: runtime state, REST calls, contract validation, testbed execution, and tool contracts stay local and contract-backed.

**Rationale:** The user clarified that using the MCP SDK for TypeScript is acceptable. That dependency earns its place at a real seam because MCP protocol compatibility is external behavior; hand-rolling it would add maintenance risk without improving the XQ-specific interface.

## DEC-15194D7B — Use TypeScript and Zod for xq-domain-test-mcp tool authoring

Status: `accepted`

The Node 26 redesign should use TypeScript as the implementation language and Zod for MCP tool inputSchema/outputSchema authoring, matching @modelcontextprotocol/sdk conventions. The published runtime executes compiled JavaScript on Node 26, and checked-in JSON Schema remains the polyglot contract artifact for non-TypeScript consumers.

**Rationale:** The TypeScript MCP SDK has a required peer dependency on Zod and examples register tools with Zod input/output schemas. TypeScript improves local module interfaces, while generated or checked JSON Schema preserves the explicit polyglot contract requirement.

## DEC-8AD3E770 — Type MCP tools through contract modules

Status: `accepted`

Each xq-domain-test-mcp tool should have an authored contract module containing name, category, metadata, Zod input schema, Zod output schema, and Zod error schema. A local defineToolContract helper infers ToolInput, ToolOutput, ToolFailure, and ToolHandler types. Implementations satisfy the inferred handler type and do not import MCP SDK types. The registry adapts contracts to the MCP SDK and emits checked JSON Schema artifacts for polyglot consumers.

**Rationale:** This keeps the external seam small and contract-backed, gives TypeScript handlers strong local types, preserves JSON Schema for non-TypeScript consumers, and prevents tool implementations from coupling directly to MCP protocol details.

## DEC-9B91FF17 — Require each MCP tool class to implement XqMcpTool

Status: `accepted`

The Node 26 TypeScript redesign should define a shared XqMcpTool<TContract> interface for all tools. Each tool class exposes a readonly contract and execute(input, context) method, where ToolInput, ToolOutput, and ToolFailure are inferred from the Zod schemas in the contract. The registry accepts AnyXqMcpTool instances and is the only layer that adapts tool classes to the MCP SDK.

**Rationale:** A shared tool class interface gives every new tool the same local seam, keeps input/output typing tied to the contract, and prevents individual tools from coupling to MCP protocol types. This improves locality and makes tests exercise the same interface the registry uses.

## DEC-800047AB — Simplify MCP tool abstraction to one plain interface

Status: `accepted`

Supersede the previous generic contract-helper direction for xq-domain-test-mcp tools. Each tool should be one class implementing McpTool<Input, Output>. The class owns name, category, title, description, inputSchema, outputSchema, optional annotations, and execute(input). Input and output are explicit TypeScript types exported beside the tool class. The registry adapts McpTool instances to the MCP SDK.

**Rationale:** The user clarified that the desired abstraction is just an interface for any tool class, with each class representing a single tool. A plain interface is deeper and easier to apply than generic contract modules or base classes, while still giving consistent input/output typing and registry integration.

## DEC-42A01614 — Use one JSON Schema contract bundle for xq-domain-test-mcp MVP

Status: `accepted`

The Node 26 xq-domain-test-mcp redesign should publish a single contracts/xq-domain-test-mcp.schema.json file for the MVP, with  for xq-config, tool inputs, tool outputs, and shared error shapes. Contract examples live under contracts/examples. Split into multiple JSON Schema files only when the bundle becomes hard to navigate or consumers need independently versioned contract files.

**Rationale:** The user questioned why the spec needed many JSON files. For the current small tool surface, multiple schema files add navigation and release overhead without meaningful depth. A single bundle keeps the polyglot contract explicit while reducing maintenance cost.

## DEC-D1269ECC — Validate xq-domain-test-mcp through SDK stdio client smoke

Status: `accepted`

After the Node rewrite, bring up the testbed mock API and invoke the built xq-domain-test-mcp stdio server through @modelcontextprotocol/sdk Client and StdioClientTransport. The smoke lists tools, configures the environment, creates exercises through call_rest_api, lists them, reads get_environment, and clears the environment. The smoke is now covered by test/mcp-client-smoke.test.ts.

**Rationale:** Direct tool-class tests missed an MCP SDK structuredContent validation issue for get_environment. Driving the built stdio server through the SDK exercises the actual external interface agents use.

## DEC-9FEB33B4 — Use Yarn 4 for xq-domain-test-mcp TypeScript module

Status: `accepted`

xq-domain-test-mcp is implemented as a Node 26 TypeScript module using Yarn 4.13 for install, build, test, lockfile, and CI module-runner commands. npm remains only where the generated release tarball is installed globally as a consumer CLI package.

**Rationale:** The repo's Node modules use Yarn, and the user clarified that this module should follow Yarn rather than npm/package-lock development workflows.

## DEC-0F225BB2 — Do not ship JSON contract files for xq-domain-test-mcp MVP

Status: `accepted`

Supersede the earlier single JSON Schema bundle direction. xq-domain-test-mcp should not ship separate contracts/*.json artifacts in the MVP. Tool contracts live as TypeScript interfaces plus Zod schemas on each McpTool class and are exposed to consumers through MCP tool discovery. Add JSON artifacts later only if a non-MCP downstream consumer needs stable standalone schemas.

**Rationale:** The user questioned the extra JSON files and preferred the simpler class-interface abstraction. MCP discovery already exposes tool input/output schemas to clients without adding generated files to the package.

## DEC-64E69D82 — Publish xq-domain-test-mcp to GitHub Packages npm registry

Status: `accepted`

xq-domain-test-mcp should publish its Node package to GitHub Packages as @chauhaidang/xq-harness-domain-test-mcp using Yarn npm publish. The global executable remains xq-domain-test-mcp. The tag-driven workflow still creates a GitHub Release for the agent skill bundle and checksums, but the Node package itself is distributed through npm.pkg.github.com rather than as a release tarball.

**Rationale:** The module is now in the Node/Yarn package ecosystem and the user asked to use the GitHub npm registry. This also aligns the package name with the repo's @chauhaidang/xq-harness-* convention.

## DEC-5589D02F — Use npm registry only for xq-domain-test-mcp delivery

Status: `accepted`

xq-domain-test-mcp delivery should exclude GitHub Releases for this module. The tag-driven CD workflow validates the package version, runs module CI, publishes @chauhaidang/xq-harness-domain-test-mcp to GitHub Packages with yarn npm publish, and verifies installation from npm.pkg.github.com. No release tarball, skill bundle tarball, checksum artifact, or gh release step is produced.

**Rationale:** The user asked to focus the Node MCP server delivery on the GitHub npm registry only. npm is the natural distribution channel for a Node stdio MCP server because MCP clients can launch the package bin directly after global install or through npx.

## DEC-CFF58D58 — Ship xq-domain-test-mcp skill through npm package skills directory

Status: `accepted`

xq-domain-test-mcp should follow the existing xq-scripts install-skills convention. The npm package includes skills/xq-domain-test-mcp/SKILL.md via package.json files, and consumers run xq-scripts/scripts/install-skills.js from their project root to copy installed node_modules/@chauhaidang/*/skills/* into .agents/skills/.

**Rationale:** The user pointed out that consumers already use xq-scripts to discover skills from installed npm dependencies. Following that shape keeps the MCP package compatible with existing consumer onboarding instead of introducing a separate skill artifact or manual lookup flow.

## DEC-BB932361 — Distill xq-domain-test-mcp skill for consumer agents

Status: `accepted`

The xq-domain-test-mcp SKILL.md should be a consumer-agent playbook, not internal development or release documentation. It should explain when to use the MCP server, what context to gather, how to resolve xq-config.json, how to discover live MCP tool schemas, how to map business-readable scenarios to tool calls, execution guardrails, MCP client config examples, and final reporting expectations.

**Rationale:** The user clarified that the skill is for LLM/AI agents such as Cursor, Claude, Codex, Gemini, and Copilot to understand how to use the MCP server to satisfy a human goal. Internal package delivery mechanics distract from that purpose and belong in README/catalogue docs instead.

## DEC-635D1F78 — Allow install-skills to explicitly scan global npm packages

Status: `accepted`

xq-scripts/scripts/install-skills.js now supports --include-global. By default it scans only the consumer project's node_modules/@chauhaidang/*/skills. With --include-global, it also scans /usr/local/lib/node_modules/@chauhaidang/*/skills so globally installed MCP packages can provide skills. Project-local skills are copied after global skills, so local dependencies win on name conflicts.

**Rationale:** xq-domain-test-mcp can be delivered as a global npm package, while the existing skill installer only scanned project-local dependencies. An explicit flag supports global MCP installs without unexpectedly importing unrelated global skills by default.

## DEC-D90389B9 — Revert xq-domain-test-mcp from Node back to Python

Status: `accepted`

xq-domain-test-mcp is being restored to the Python uv/FastMCP implementation from the last full Python release snapshot and versioned as 1.0.3 for a clean new release tag. The npm/GitHub Packages delivery path is removed in favor of the Python wheel, sdist, and skill bundle release workflow.

**Rationale:** The user explicitly requested reverting domain test MCP back to the previous Python variant. Harness history identified the full Python release snapshot before the Node rewrite, and existing tags already occupy 1.0.0 through 1.0.2, so 1.0.3 preserves release monotonicity while restoring the requested implementation.

## DEC-10F3D42D — xq-octopus commands own execute logic

Status: `accepted`

The xq-octopus Command interface must require execute(context). RestCommand and future commands implement that shared contract. ExecutionEngine.execute(command) prepares ExecutionContext, delegates to command.execute(context), and normalizes uncaught errors into CommandResult; it should not dispatch normal execution by command kind.

**Rationale:** The CLI is intended to be simple and extensible for agent tool use. Putting command-specific behavior behind Command.execute keeps the engine stable while allowing new command types to plug in without new engine entrypoints.

## DEC-0342D5B6 — xq-octopus ExecutionContext exposes tool factory

Status: `accepted`

ExecutionContext for xq-octopus should carry RuntimeConfig and ToolFactory, not a raw HttpClient. RestCommand.execute(context) should request context.tools.rest() and delegate REST calls and REST validation to RestTool. HttpClient remains an internal implementation detail behind the tools layer.

**Rationale:** Keeping transport clients out of ExecutionContext prevents the core command contract from becoming REST-specific. A ToolFactory gives future command types the same extension point while preserving a stable ExecutionEngine.execute(command) interface.

## DEC-655CB849 — xq-octopus guide targets fresher Python implementers

Status: `accepted`

modules/xq-octopus/xq-octopus-dev-guide.md was rewritten as a beginner-oriented development guide. It now explains modern Python CLI basics, dataclasses, Protocol contracts, Typer boundaries, ExecutionContext with ToolFactory, RestTool ownership, testing order, and module-local validation commands.

**Rationale:** The implementer may be new to Python. A step-by-step guide with boundaries, code-shape examples, and common mistakes reduces ambiguity without implementing the module for them.

## DEC-3B0BB622 — xq-octopus RestTool exposes method-specific calls

Status: `accepted`

RestCommand.execute(context) should obtain context.tools.rest() and call method-specific RestTool operations: call_get(), call_post(), call_put(), call_patch(), or call_delete(). RestTool should not expose a generic execute(command, config) dispatcher as its public interface.

**Rationale:** The intended REST tool interface should make available operations explicit to command authors and agents. Method selection belongs inside RestCommand.execute(), while ExecutionEngine remains generic and only delegates to Command.execute(context).

## DEC-2DF6395F — xq-octopus uses app package source layout

Status: `accepted`

modules/xq-octopus keeps the app/ package layout described in xq-octopus-dev-guide.md. pyproject.toml now points the console script, pytest path, BasedPyright include path, and Hatch wheel package selection at app instead of the old src/xq_octopus layout.

**Rationale:** The user confirmed the current app package layout is the desired source layout, so metadata and tests should align with it rather than renaming the package back to xq_octopus.

## DEC-B13DEF5F — xq-octopus Day 1 keeps REST transport inside RestTool

Status: `accepted`

The Day 1 implementation does not keep a separate app/tools/http_client.py module. RestTool owns the low-level urllib transport internally while the engine and commands still depend only on ToolFactory and RestTool capabilities.

**Rationale:** The user questioned the extra http_client split. For Day 1 the separate module adds surface area without enough complexity to justify it; keeping transport private inside RestTool preserves the boundary while simplifying the layout.

## DEC-04A2460E — xq-octopus switches to Node TypeScript stack

Status: `accepted`

xq-octopus should be built with the harness repo's Node.js stack instead of Python: Node >=18, Yarn 4.13, TypeScript, Commander, Jest, ESLint, and built-in fetch/AbortController. The existing architecture remains: Command.execute(context), ExecutionEngine, ExecutionContext with ToolFactory, and RestTool method-specific calls callGet/callPost/callPut/callPatch/callDelete.

**Rationale:** The user wants xq-octopus to use the same stack as the harness repo. Keeping the architecture while switching language reduces ecosystem mismatch and makes future module work align with existing Node/Yarn/TypeScript modules.

## DEC-18A5CFC1 — xq-octopus removes explain subcommand and expands setup guide

Status: `accepted`

xq-octopus scope now excludes an explain subcommand to stay closer to Vibium. The CLI-as-skill surface is limited to --help, per-command --help, and commands --json. The dev guide was expanded with junior-friendly Node/TypeScript setup steps including prerequisites, folder/file creation commands, package.json, tsconfig.json, jest.config.cjs, ESLint config, starter Commander entrypoint, xq.json.example, README template, and module-local Yarn validation commands.

**Rationale:** The user clarified Vibium does not include explain, so xq-octopus should not add it. The implementation guide also needed enough setup detail for a fresher developer to progress without guessing toolchain configuration.

## DEC-A444172E — xq-octopus guide adds explicit project setup checkpoint

Status: `accepted`

The xq-octopus dev guide now includes a dedicated project setup flow before feature implementation: start from a docs-only module, create app/test folders, create package/config/source/test files, fill package.json/tsconfig/jest/eslint/starter CLI templates, run yarn install to create the lockfile, build the starter CLI, add a starter Jest test, and verify yarn install --immutable, yarn build, yarn test, and node dist/cli/main.js --help.

**Rationale:** The user clarified that the guide was missing project setup. A junior developer needs an explicit empty-folder-to-compiling-project checkpoint before implementing config loading, RestTool, or the engine.

## DEC-BE693B97 — Use pnpm workspace for Node package tooling

Status: `accepted`

Node modules now use pnpm 10 package metadata, a root pnpm-workspace.yaml, workspace:* sibling dependencies, a root pnpm-lock.yaml, pnpm module runner commands, and pnpm publish for GitHub Packages. Yarn releases, .yarnrc.yml files, module yarn.lock files, and the shared Yarn config template were removed.

**Rationale:** pnpm workspace links replace Yarn portal links while preserving local sibling development. pnpm pack rewrites workspace:* dependencies to package versions for publish, and pnpm 10 supports the repo's Node >=18 line whereas pnpm 11 requires newer Node.

## DEC-D3066EEE — Scope Bun experiment to xq-octopus

Status: `accepted`

modules/xq-octopus now uses packageManager bun@1.3.14, Bun scripts, and is removed from the root pnpm workspace. The rest of the active Node modules remain pnpm-managed.

**Rationale:** Bun is worth evaluating on a small standalone module first. Keeping it out of the pnpm workspace avoids mixing package-manager ownership for one module while preserving the lower-risk pnpm migration for the published harness packages.

## DEC-02C252F9 — xq-octopus aligns dev guide to Bun

Status: `accepted`

xq-octopus documentation now treats Bun 1.3.14 as the runtime, package manager, build runner, and test runner. The dev guide and handoff remove Jest/Yarn/Node-runner setup, use Bun test, Bun build with --outfile=dist/cli/main.js, Bun lockfile/install commands, @types/bun, a Bun shebang, and bun dist/cli/main.js --help for smoke testing.

**Rationale:** The user clarified that xq-octopus has moved to Bun. The implementation guide must avoid mixed Node/Yarn/Jest instructions so a junior developer can follow one coherent setup path.

## DEC-DC98BF51 — xq-octopus keeps dependency set minimal

Status: `accepted`

xq-octopus v1 dependency policy is now documented. Runtime dependencies are limited to commander for CLI parsing/help. Development dependencies are limited to typescript, @types/bun, eslint, @typescript-eslint/parser, and @typescript-eslint/eslint-plugin. Bun/Web APIs should cover fetch, AbortController, file reads, JSON, URL joining, process IO, and tests via bun:test. The guide explicitly excludes axios/got/node-fetch, zod/ajv, chalk/kleur/ora, yargs/clipanion/cac/oclif, jest/vitest/mocha, and dotenv for v1.

**Rationale:** The CLI scope is intentionally small. A narrow dependency set keeps the architecture easy for a junior developer to reason about and avoids adding packages for behavior Bun already provides.

## DEC-9DB86912 — Fold xq-octopus back into pnpm workspace

Status: `accepted`

Supersede the short Bun-only experiment for xq-octopus. xq-octopus is again listed in pnpm-workspace.yaml, uses packageManager pnpm@10.14.0, and its docs describe the Node/TypeScript/pnpm stack.

**Rationale:** The user asked to onboard pnpm to the whole project. Keeping xq-octopus on Bun would make package-manager ownership inconsistent with that goal.

## DEC-BBFB105D — Keep Go xq-octopus guide as an alternative track

Status: `accepted`

Add xq-octopus-dev-guide-go.md beside the existing Node/TypeScript guide and link it from HANDOFF.md as an alternative implementation track, not as a replacement.

**Rationale:** The user asked to create a Go version similar to the Node guide while the repo still contains pnpm/Node onboarding work. Keeping both guides preserves the current path and documents the Vibium-style single-binary option for comparison.

## DEC-5E537E5E — xq-octopus Go guide follows Vibium Cobra pattern

Status: `accepted`

The Go implementation guide for modules/xq-octopus should use Cobra for CLI command routing, with main.go explicitly registering command-per-file constructors such as newGetCmd and newCommandsCmd. The guide should not teach standard-library flag parsing as the primary path.

**Rationale:** Vibium's CLI source uses github.com/spf13/cobra and explicit rootCmd.AddCommand(newXCmd()) wiring. Matching that pattern makes the Go track a closer learning bridge to Vibium and gives xq-octopus a scalable many-command CLI shape without adding a runtime dependency for end users.

## DEC-182C23F9 — CI explicitly installs pnpm

Status: `accepted`

Node CI and GitHub Packages CD templates should install pnpm with pnpm/action-setup@v6 at version 10.14.0 and verify pnpm --version before invoking ./scripts/module or pnpm publish.

**Rationale:** setup-node documents pnpm support primarily around caching and notes the package manager should be pre-installed. Relying only on Corepack leaves CI vulnerable to runner/Corepack availability differences. Installing pnpm explicitly makes the migration deterministic.

## DEC-20D0DF9E — Remove xq-octopus Go guide

Status: `accepted`

Remove modules/xq-octopus/xq-octopus-dev-guide-go.md and stop advertising a Go alternative track from HANDOFF.md. xq-octopus documentation should focus on the Node/TypeScript/pnpm guide unless a Go track is requested again later.

**Rationale:** The user explicitly asked to remove the Go dev guide after the pnpm migration was pushed. Keeping the Go guide would add competing implementation guidance and distract from the current Node/TypeScript/pnpm direction.

## DEC-78F7F2A0 — xq-octopus uses Node 22 node:test without Jest

Status: `accepted`

modules/xq-octopus targets the harness Node 22 minimum, runs TypeScript tests directly with Node's built-in node:test runner, and does not include Jest, ts-jest, or @types/jest. The starter CLI main() remains synchronous until async command actions are introduced.

**Rationale:** Node 22 can execute erasable TypeScript test files directly, so adding Jest or a TypeScript test runner is unnecessary for the module's current scope. Keeping main() synchronous avoids async ceremony before the CLI has async handlers.

## DEC-618E436C — xq-octopus keeps internal config camelCase

Status: `accepted`

RuntimeConfig uses camelCase fields apiBaseUrl and apiToken internally. The xq.json file contract and redacted CLI JSON output continue using snake_case keys api_base_url and has_api_token at the boundary.

**Rationale:** The user prefers idiomatic TypeScript camelCase internally. Keeping snake_case only at external JSON boundaries preserves the documented config/output contract while avoiding snake_case throughout implementation code.

## DEC-EDE57644 — xq-octopus uses camelCase config contract

Status: `accepted`

xq-octopus now keeps config naming aligned across xq.json input, internal RuntimeConfig, redacted CLI JSON output, examples, and tests. The public keys are apiBaseUrl, apiToken, and hasApiToken.

**Rationale:** The user asked why input and output should not stay aligned and explicitly preferred camelCase. Using one camelCase shape removes confusing mapping keys and matches TypeScript naming throughout the module.

## DEC-6F70ED09 — xq-octopus releases as unscoped package

Status: `accepted`

The xq-octopus CLI release package name remains xq-octopus. Its package files include dist, README.md, and skills so skills/xq-octopus/SKILL.md ships in the tarball. install-skills.js now scans both scoped @chauhaidang packages and the explicit unscoped xq-octopus package.

**Rationale:** The user explicitly requested the release module name be only xq-octopus. Because the existing skill installer previously scanned only @chauhaidang/* packages, it needed a targeted unscoped package allowlist so consumers can still install the xq-octopus skill from node_modules.

## DEC-D456CC11 — xq-octopus publishes to npmjs

Status: `accepted`

The xq-octopus package keeps the unscoped name xq-octopus and publishes through .github/workflows/cd-xq-octopus.yml to https://registry.npmjs.org using NPM_TOKEN. Existing scoped @chauhaidang packages continue to publish through GitHub Packages workflows.

**Rationale:** GitHub Packages npm registry only supports scoped package names such as @NAMESPACE/PACKAGE-NAME. The user explicitly requested the release package name be only xq-octopus, so npmjs is the compatible registry for this CLI.

## DEC-504E620E — xq-skills is a packaging module

Status: `accepted`

Add modules/xq-skills as a lightweight npm package that ships a skills/ directory and has no build-time code. Existing module-local skill copies remain in place for repo agent discovery.

**Rationale:** The installer already understands npm package skills directories, so a package-only module centralizes delivery without disrupting current module-level skill routing or adding runtime complexity.

## DEC-45464FE6 — xq-skills package omits harness prefix

Status: `accepted`

The central skills package is named @chauhaidang/xq-skills and publishes through the GitHub Packages npm registry. The module remains registered as xq-skills.

**Rationale:** The user explicitly rejected adding harness to this package name. GitHub Packages requires scoped npm package names, so @chauhaidang/xq-skills keeps the package scoped without using the xq-harness prefix.
