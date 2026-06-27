# iOS React Native Shell Adoption Guide

This guide describes how a consumer app can adopt the `xq-ios-shell-app` proof
of concept pattern: a native iOS shell that validates a remote manifest and then
mounts a React Native module from an approved JavaScript bundle.

The pattern is brownfield React Native. The native app owns the runtime,
permissions, native modules, signing, and release cadence. Remote bundles only
run inside the native runtime that the app already shipped.

## When To Use This Pattern

Use this pattern when:

- the host app must remain a native iOS shell
- teams need independently shipped RN screens or flows
- every remote payload can target a known runtime version
- the app can reject incompatible payloads before mounting UI
- native capabilities are shipped in the binary, not downloaded as new code

Do not use this pattern when:

- the payload needs arbitrary native modules that are not in the app binary
- the payload must bypass App Store review for new native functionality
- runtime compatibility cannot be controlled
- web content is enough and a WebView is simpler

## Architecture

The consumer app owns these pieces:

- **Native shell:** SwiftUI or UIKit screens, navigation, auth, storage, logging,
  and fallback UI.
- **Manifest loader:** fetches remote JSON, validates versions, and maps payloads
  to native render instructions.
- **React Native runtime:** linked into the app with NPM dependencies and
  CocoaPods.
- **RN adapter:** creates an RN root view for a registered module name and passes
  shell context as initial props.
- **Remote bundle host:** serves signed or otherwise trusted `.bundle` assets
  and manifests.

The remote manifest should describe what to mount, not how to change the native
app. In the POC the manifest shape is:

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

The shell rejects the manifest unless `runtimeVersion` and `hostApiVersion`
match the binary's supported contract.

## Native Shell Checklist

1. Keep manifest fetching separate from rendering.
2. Validate `runtimeVersion` before creating an RN view.
3. Validate `hostApiVersion` before passing host APIs or props.
4. Keep fallback UI native so the app remains usable when payload loading fails.
5. Log manifest fetch, validation, mount, and fallback events.
6. Treat bundle URLs as untrusted until they pass your allowlist/signature policy.
7. Build and test through the CocoaPods workspace once RN is linked.

## Add React Native To The iOS App

Follow the current React Native brownfield setup for iOS. At a minimum,
consumers need NPM dependencies, a Podfile, a Gemfile/CocoaPods setup, a JS entry
file, and native code that creates an RN root view.

The POC uses:

```json
{
  "dependencies": {
    "@react-native/metro-config": "0.86.0",
    "react": "19.2.3",
    "react-native": "0.86.0"
  },
  "devDependencies": {
    "@react-native-community/cli": "^20.2.0"
  }
}
```

Example scripts:

```json
{
  "scripts": {
    "start": "react-native start",
    "bundle:ios": "react-native bundle --entry-file index.js --platform ios --dev false --bundle-output remote-payload/portfolio.ios.bundle --assets-dest remote-payload"
  }
}
```

Install JavaScript dependencies:

```bash
npm install
```

Use a Gemfile so CocoaPods and Xcode project parsing versions are reproducible:

```ruby
source "https://rubygems.org"

gem "activesupport"
gem "cocoapods", "1.16.2"
gem "nkf"
gem "xcodeproj", "1.27.0"
```

Install pods from the iOS project directory:

```bash
bundle install
bundle exec pod install
```

After this point, build from the generated `.xcworkspace`, not the raw
`.xcodeproj`.

## Podfile Shape

The POC Podfile keeps the test target nested below the app target so XCTest sees
the same RN pods and generated dependency provider:

```ruby
require_relative './node_modules/react-native/scripts/react_native_pods'

platform :ios, min_ios_version_supported

prepare_react_native_project!

react_native_path = File.expand_path('./node_modules/react-native', __dir__)

target 'YourApp' do
  use_react_native!(
    :path => react_native_path,
    :app_path => "#{Pod::Config.instance.installation_root}"
  )

  target 'YourAppTests' do
    inherit! :complete
  end
end

post_install do |installer|
  react_native_post_install(
    installer,
    react_native_path,
    :mac_catalyst_enabled => false
  )
end
```

The POC also links `libc++` in app and test targets because generated RN code
uses the C++ runtime.

## Register Remote Modules

The JS bundle must register the component named by the manifest:

```js
import {AppRegistry} from "react-native";
import {PortfolioRemote} from "./PortfolioRemote";

AppRegistry.registerComponent("PortfolioRemote", () => PortfolioRemote);
```

The manifest value must match exactly:

```json
{
  "payload": {
    "kind": "react-native",
    "moduleName": "PortfolioRemote"
  }
}
```

## Mount From Swift

The POC uses `RCTReactNativeFactory` from Swift. The important responsibilities
are:

- resolve the validated bundle URL
- set `RCTAppDependencyProvider`
- hold the factory/delegate for the lifetime of the root view
- pass initial properties from the shell into JavaScript

The adapter shape is:

```swift
let delegate = ReactNativeFactoryDelegate(bundleURL: payload.bundleURL)
delegate.dependencyProvider = RCTAppDependencyProvider()

let factory = RCTReactNativeFactory(delegate: delegate)
let view = factory.rootViewFactory.view(
    withModuleName: payload.moduleName,
    initialProperties: payload.initialProperties
)
```

Initial properties are the safest first host API. In the POC they include:

- `manifestId`
- `payloadVersion`
- `hostApiVersion`

For production, keep props small and serializable. Put richer native APIs behind
versioned native modules shipped in the app binary.

## Bundle And Serve A Payload

Build a release-style iOS bundle:

```bash
npm run bundle:ios
```

For the POC, the local server serves both `manifest.json` and
`portfolio.ios.bundle`:

```bash
node modules/xq-ios-shell-app/scripts/serve-remote.js
```

For a device on the same network:

```bash
HOST=0.0.0.0 node modules/xq-ios-shell-app/scripts/serve-remote.js
```

Then update the manifest URL to use the Mac's LAN IP instead of `127.0.0.1`.

## Versioning Rules

Use separate versions for separate concerns:

- `runtimeVersion`: native RN/runtime compatibility, changed when the binary's
  RN version or native module surface changes.
- `hostApiVersion`: shell-to-payload contract, changed when initial props or
  native APIs change.
- `payload.version`: remote screen version, changed when the JS payload changes.

The shell should reject unsupported runtime or host API versions before creating
the RN root view.

## Failure Handling

Consumers should handle these cases with native UI:

- manifest fetch timeout
- malformed manifest JSON
- unsupported `runtimeVersion`
- unsupported `hostApiVersion`
- unsupported payload kind
- unavailable bundle URL
- RN module name not registered in the bundle
- RN mount failure

The fallback should include enough diagnostics for development, but production
UI should avoid leaking internal URLs or implementation details.

## Testing

Recommended tests:

- manifest decoding accepts `react-native`
- wrong `runtimeVersion` is rejected
- wrong `hostApiVersion` is rejected
- unsupported payload kind falls back
- shell passes expected initial props to the RN adapter
- build and test run through the `.xcworkspace`

POC verification command:

```bash
./scripts/module test xq-ios-shell-app
```

The verified POC result was 3 tests passing with the RN-linked workspace, and
the simulator showed `REACT NATIVE MOUNTED` for `PortfolioRemote`.

## Production Hardening

Before production adoption, add:

- HTTPS-only manifest and bundle URLs
- bundle integrity checks or signatures
- manifest allowlist policy
- rollback to last-known-good payload
- telemetry for load time, failures, and fallback rate
- runtime compatibility matrix
- release process for native runtime updates
- clear policy for what can update remotely

Remote RN payloads should be treated as a controlled extension point of a native
binary, not as arbitrary plugin execution.

## References

- React Native: [Integration with Existing Apps](https://reactnative.dev/docs/integration-with-existing-apps)
- POC module: [`modules/xq-ios-shell-app`](../../modules/xq-ios-shell-app/)
