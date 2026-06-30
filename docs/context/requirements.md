# Requirements

## REQ-D0E5BB8C — Prototype remote-loaded iOS shell module

Status: `active`

Add a local proof of concept under modules/xq-ios-shell-app that demonstrates an iOS shell loading a remotely hosted payload with manifest validation, fallback behavior, and a seam for a future React Native bundle loader.

## REQ-6A52FA75 — Python modules need a Playwright template

Status: `active`

Provide a reusable Python Playwright setup template so new Python modules can opt into pytest-playwright consistently through uv, modules.yaml, and the shared module runner.

## REQ-A2C937FB — Python modules need a BasedPyright template

Status: `active`

Correct the previous Playwright scaffold: the requested Python module setting is for BasedPyright type checking, not browser Playwright. Provide a reusable pyproject/modules.yaml/CI pattern for Python modules.

## REQ-93877C8E — Persist FastAPI learning instructions

Status: `active`

Create a Markdown file containing the step-by-step FastAPI coding instructions, with each step explaining what to write, why that exact code shape is needed, and how to run or test it.

## REQ-BF104DDB — Document RN shell consumer adoption

Status: `active`

Persist the verified xq-ios-shell-app React Native runtime POC details and provide an implementation guideline for consumers who want to adopt the native iOS shell plus remote RN payload pattern.

## REQ-8E704F4D — POCs need a registered module home

Status: `active`

Exploratory initiatives such as learning MCP server development should have a dedicated repo module before they become durable product or package work.

## REQ-09BD331B — Plan automation testing MCP server

Status: `active`

Create an implementation plan for an MCP server that serves automation testing workflows in xq-harness. The server should start as a POC under modules/poc, expose existing XQ testing capabilities through a small MCP interface, and avoid committing to package or CI obligations until validated.

## REQ-D745B4DE — MCP runs scenarios from Markdown mapping input

Status: `active`

The automation testing MCP server must expose tools that let an agent run a test scenario based on structured input derived from scenarios Markdown. The agent provides a mapping from scenario Markdown to executable test targets or steps; the MCP server validates that mapping, resolves it to known project/module test capabilities, and runs the selected scenario through guarded commands rather than arbitrary shell execution.

## REQ-A3B27F3E — MCP exposes domain test actions called from scenario mappings

Status: `active`

The automation testing MCP server must expose domain-specific tools, for example create-exercises. An agent reads scenarios Markdown, maps each scenario to the appropriate MCP tool and arguments, and calls that tool. The MCP server should implement the executable tool actions and return structured results; it should not require the mapping document itself to be the primary runtime input.

## REQ-9D413F74 — Domain MCP tools leverage generated Python API client

Status: `active`

The xq-domain-test-mcp server should implement domain tools by leveraging an existing generated Python API client package where possible. MCP tools should expose stable domain actions to agents, while generated client details remain an internal implementation concern.

## REQ-1747A8CF — MCP domain tools use reusable templates

Status: `active`

The xq-domain-test-mcp server should compose domain tools from reusable templates rather than hard-coding each tool method directly. A template should define the common MCP tool shape, typed input/output validation, adapter invocation, error mapping, and structured result format, while each domain tool supplies metadata, schemas, and the bound domain operation.

## REQ-BC804832 — MCP tools are grouped by category

Status: `active`

The xq-domain-test-mcp server should categorize tools into explicit groups. The first category is domain api tool: tools that expose domain actions backed by generated or hand-written domain API clients. Tool grouping should be represented in metadata and module organization so future categories can be added without mixing concerns.

## REQ-343950B8 — MCP includes rest api tool category

Status: `active`

The xq-domain-test-mcp tool catalog should include a rest api tool category in addition to domain api tool. Rest api tools represent direct HTTP/REST interactions with configured endpoints, while domain api tools represent higher-level domain actions backed by domain clients.

## REQ-CAED9D96 — MCP runtime config is set through tools and stored in memory

Status: `active`

The xq-domain-test-mcp MVP should accept runtime environment parameters through explicit MCP tools, store the one-off session config in memory, and let domain/rest tools retrieve it during execution. Tools must fail clearly when runtime config is missing and must not expose secrets in status responses.

## REQ-788A67C0 — MVP focuses on REST API testing tools

Status: `active`

Shrink xq-domain-test-mcp MVP to focus on REST API testing. Park generated Python API client and domain API tool integration for a later phase. The MVP should expose runtime environment configuration and direct REST API testing tools only.

## REQ-36A5C7F5 — Scenario Markdown needs a mappable authoring contract

Status: `active`

Define guardrails for scenario Markdown so humans and AI agents can write REST API testing scenarios that map cleanly to xq-domain-test-mcp tool calls. The MCP server still should not parse Markdown in the MVP; the contract guides the agent-side mapping to configure_environment and call_rest_api.

## REQ-DE2D1D4A — Scenario Markdown stays business-specific

Status: `active`

Scenario Markdown for xq-domain-test-mcp should be business-specific and human-readable, not an HTTP request specification. The agent should map business scenario intent to REST API MCP tool calls using scenario metadata, domain context, and available API knowledge. HTTP method/path/body may be mapping output, not required scenario authoring syntax.

## REQ-A4A0D73E — MCP supports E2E API scenario flows

Status: `active`

xq-domain-test-mcp should support business-specific E2E API scenarios where one scenario can map to a multi-step API flow with setup, action, validation, and cleanup calls. The agent should map scenario Markdown to an E2E API execution plan using MCP-provided capability/schema metadata; the MCP should provide guarded REST execution primitives and, later, higher-level E2E API flow tools.

## REQ-DEC6E69D — Promote xq-domain-test-mcp to production module

Status: `active`

The xq-domain-test-mcp POC is ready for the next phase and should be promoted from modules/poc into its own registered production module. The module should keep the current REST API testing MVP scope, support rapid development through the module runner, and preserve the consumer-facing global MCP command model.

## REQ-EF935A14 — xq-domain-test-mcp redesign targets Node 26 and polyglot contracts

Status: `active`

Redesign xq-domain-test-mcp so the implementation uses pure Node.js standard library as much as possible, targets Node.js 26 including the test runner, cross-checks GitHub Actions support for that Node line, and ensures everything exposed outside the module has explicit contracts such as interfaces, types, and language-neutral schemas.

## REQ-5E14D688 — xq-test-infra needs pluggable extension seams

Status: `active`

xq-test-infra should become extensible and pluggable through explicit module interfaces for application orchestration, plugin registration, spec loading, compose transformation, gateway adapters, runtime adapters, auth providers, and test detection. Plugins should not need to patch singleton implementation internals or CLI handlers.
