# Specs

## SPEC-B98B924D — Module onboarding from external repos

Status: `draft`

docs/modules/onboarding.md defines pre-migration sanitization (secrets, artifacts, old CI), module layout, modules.yaml registration, CI/CD wiring, and maintainer review checklist for separate GitHub repos joining xq-harness.

## SPEC-E28E9970 — Python Playwright module template contract

Status: `draft`

Requirement: `REQ-6A52FA75`

Python modules that need Playwright should use a uv-managed pyproject with playwright and pytest-playwright dev dependencies, a module-local scripts/install-playwright command, pytest defaults for browser artifacts, modules.yaml commands routed through scripts/module, and optional CI via module-ci-python.yml.

## SPEC-2EFD88B4 — Python BasedPyright module template contract

Status: `draft`

Requirement: `REQ-A2C937FB`

Python modules that need type checking should keep BasedPyright as a uv dev dependency, configure [tool.basedpyright] in the module pyproject.toml, run uv run basedpyright from the module build command in modules.yaml, and use the shared module-ci-python.yml workflow for GitHub Actions.

## SPEC-5C3C1D53 — FastAPI learning guide

Status: `draft`

Requirement: `REQ-93877C8E`

A Markdown guide under docs/learning should preserve the FastAPI beginner lesson with step-by-step code, and each step should explain what the code does, why the exact FastAPI/Pydantic shape is needed, and how to run or test it.

## SPEC-C6FE7ABA — Automation testing MCP server POC contract

Status: `draft`

Requirement: `REQ-09BD331B`

The POC MCP server should provide a small interface for discovering test modules, generating recommended automation setup, validating test project structure, and running module-runner-backed test commands. It should prefer existing xq-test-harness API BDD and xq-test-utils mobile E2E abstractions, return structured results, and require explicit local paths/module names rather than broad filesystem access.

## SPEC-28FCFE37 — Markdown scenario mapping runner contract

Status: `draft`

Requirement: `REQ-D745B4DE`

The MCP server must expose scenario-focused tools. It accepts an explicit mapping object derived from scenarios Markdown, where each mapped scenario has a stable scenario id/title, source markdown path or document id, target module or project path, runner kind such as bdd/playwright/detox/module, and an executable selector such as feature file + scenario title, test file + grep pattern, or module command. The server validates required fields, rejects unmapped or ambiguous scenarios, resolves only allowlisted local paths/modules, executes via approved runners such as ./scripts/module or package test commands, and returns structured results including scenario id, command summary, status, duration, output excerpt, report paths, and diagnostics.

## SPEC-F1F123B9 — Domain action MCP tool contract

Status: `draft`

Requirement: `REQ-A3B27F3E`

The MCP server exposes named domain automation tools such as create-exercises. Each tool has a typed argument schema, validates inputs, performs the underlying automation or test setup action, and returns structured evidence. Scenario Markdown is interpreted by the agent outside the MCP server: the agent maps a scenario to a specific tool name and argument object, then invokes the tool. The MCP server may expose discovery metadata describing available tools and schemas, but it should not own the scenario-to-tool mapping logic.

## SPEC-085516FA — xq-domain-test-mcp MVP implementation contract

Status: `draft`

Requirement: `REQ-CAED9D96`

The MVP should create a Python FastMCP server under modules/poc/xq-domain-test-mcp using project name xq-domain-test-mcp and import package xq_mcp. It should expose configuration tools configure_environment, get_environment, and clear_environment backed by in-memory runtime state. It should organize tools by category, starting with domain_api and rest_api. Domain/rest tools must call runtime_state.require_config before using environment-dependent clients. Status responses must redact secrets and return structured results.

## SPEC-D0C96337 — xq-domain-test-mcp production module contract

Status: `draft`

Requirement: `REQ-DEC6E69D`

xq-domain-test-mcp should live under modules/xq-domain-test-mcp as an independent Python uv module. modules.yaml should register install/build/test commands through uv. The module keeps the package name xq-domain-test-mcp, import package xq_mcp, console script xq-domain-test-mcp, and current REST API testing MVP tools: configure_environment, get_environment, clear_environment, call_rest_api. The module should be testable through ./scripts/module test xq-domain-test-mcp and ready for rapid next-phase development.
