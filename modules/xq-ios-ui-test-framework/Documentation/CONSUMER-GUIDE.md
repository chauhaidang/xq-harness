# Consumer Guide

## UI-test target

Add `XQUIHarness` to an application-owned `bundle.ui-testing` target. Keep
screen objects and journeys in that application repository.

```swift
import XQUIHarness

let descriptor = ApplicationDescriptor(
    bundleIdentifier: "com.example.app",
    launchConfiguration: LaunchConfiguration(
        arguments: ["--ui-testing"],
        resetArguments: ["--reset-test-data"]
    )
)
```

Stable accessibility identifiers and isolated test persistence are part of the
consumer contract. A reset argument must never clear normal user data.

## Runner configuration

Create `xq-ui-tests.json` next to the consumer project:

```json
{
  "schemaVersion": 1,
  "project": "Example.xcodeproj",
  "scheme": "Example-ui-tests",
  "bundleIdentifier": "com.example.app",
  "ipaEnvironmentVariable": "EXAMPLE_IPA",
  "resultDirectory": "build/ui-test-results",
  "developmentTeam": "TEAMID"
}
```

Run a suite:

```bash
EXAMPLE_IPA=/absolute/path/Example.ipa \
swift run --package-path /path/to/xq-ios-ui-test-framework xq-ui-test run \
  --config xq-ui-tests.json \
  --device <device-udid> \
  --suite ExampleUITests/ExampleJourneyTests
```

The runner validates the signed artifact, installs it as an update without
uninstalling, and invokes the consumer's Xcode UI-test scheme.
