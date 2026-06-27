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
