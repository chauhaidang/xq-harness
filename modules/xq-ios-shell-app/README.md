# xq-ios-shell-app

Local proof of concept for an iOS shell that loads a remotely described React
Native payload.

This POC now links a brownfield React Native runtime into the native SwiftUI
shell. The shell fetches a remote manifest, validates runtime compatibility, and
mounts the requested React Native module from the approved JavaScript bundle.

## What this POC covers

- SwiftUI shell app with editable manifest URL
- Manifest fetch and runtime validation
- `react-native` payload manifest contract
- React Native 0.86 runtime linked through CocoaPods
- Metro-generated iOS bundle served from the local remote payload server
- React Native root view mounted with `RCTReactNativeFactory`
- Initial host properties passed from Swift into the RN module
- Fallback rendering when the manifest is unavailable or incompatible

## What this POC does not cover yet

- Native module loading from remote code
- Production signing, bundle signing, or CDN delivery
- App Store-safe over-the-air feature policy

The previous WebKit renderer was removed. The shell is native SwiftUI plus an
embedded React Native runtime; remote payloads must match the shell's native
runtime version and host API version before they are mounted.

## Verified outcome

The demo was verified on the iPhone 16 simulator:

- manifest URL: `http://127.0.0.1:8123/manifest.json`
- loaded manifest: `portfolio-home @ 0.3.0`
- mounted module: `PortfolioRemote`
- runtime event: `React Native runtime mounted PortfolioRemote.`
- validation: `./scripts/module test xq-ios-shell-app` passed 3 tests

The current simulator screenshot artifact from the walkthrough was:

```text
/var/folders/g8/ybg26s2s0bb28r97s5mqp2g80000gn/T/screenshot_optimized_c2146f75-605a-4d3b-a624-468a8052a77d.jpg
```

Because this module uses CocoaPods, build and test through the workspace, not
the raw Xcode project.

## Run the remote manifest

```bash
node modules/xq-ios-shell-app/scripts/serve-remote.js
```

The server listens on `http://127.0.0.1:8123`.

Use this manifest URL in the shell:

```text
http://127.0.0.1:8123/manifest.json
```

For a physical device, bind to your Mac's LAN IP and use that IP in the app:

```bash
HOST=0.0.0.0 node modules/xq-ios-shell-app/scripts/serve-remote.js
```

## Build the React Native bundle

From the module directory:

```bash
npm install
npm run bundle:ios
```

The bundle command writes:

```text
remote-payload/portfolio.ios.bundle
```

## Manifest contract

```json
{
  "id": "portfolio-home",
  "version": "0.3.0",
  "runtimeVersion": "rn-shell-v1",
  "hostApiVersion": "1.0",
  "title": "Remote Portfolio RN",
  "payload": {
    "kind": "react-native",
    "url": "http://127.0.0.1:8123/portfolio.ios.bundle",
    "moduleName": "PortfolioRemote"
  }
}
```

The native shell validates `runtimeVersion`, then creates a
`RenderedPayload.reactNative` value containing the remote bundle URL,
`moduleName`, and initial host properties.

## React Native adapter

`App/ReactNativePayloadView.swift` is the native adapter. When React Native pods
are available, it creates an `RCTReactNativeFactory`, supplies
`RCTAppDependencyProvider`, and asks the factory for a root view using the
manifest's module name and initial properties.

The adapter still keeps a `canImport(React)` fallback so the Swift source
documents the degraded state, but the current POC is expected to run with React
linked.

`index.js` registers the remote module:

```js
AppRegistry.registerComponent("PortfolioRemote", () => PortfolioRemote);
```

The manifest `payload.moduleName` must match that registered component name.

## Install native dependencies

From the module directory:

```bash
bundle install
bundle exec pod install
```

The Podfile nests the test target under the app target so XCTest sees the same
React Native generated pods. Both app and test targets link `libc++` because RN
generated code depends on the C++ runtime.

## Build the shell

Generate the Xcode project after file changes:

```bash
xcodegen generate --spec modules/xq-ios-shell-app/project.yml
```

Then install pods again and build through the module runner:

```bash
cd modules/xq-ios-shell-app
bundle exec pod install
cd ../..
./scripts/module build xq-ios-shell-app
```

Run tests:

```bash
./scripts/module test xq-ios-shell-app
```

## POC outcome

What the POC proves:

- the shell can fetch a manifest from a remote URL
- the shell can validate runtime compatibility before loading
- the WebKit renderer is no longer part of the shell
- the shell can route a valid manifest to an embedded React Native runtime
- the Swift shell can pass host context into the RN module as initial props
- XCTest can run with the RN-linked workspace

What it does not prove yet:

- native module access from remote RN code
- App Store-safe OTA feature delivery

## Consumer guide

For a production adoption checklist, see
[`docs/modules/ios-react-native-shell-adoption.md`](../../docs/modules/ios-react-native-shell-adoption.md).
