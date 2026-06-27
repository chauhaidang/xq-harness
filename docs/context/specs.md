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
