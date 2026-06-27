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
