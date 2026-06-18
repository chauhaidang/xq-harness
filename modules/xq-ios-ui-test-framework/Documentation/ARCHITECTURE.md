# Architecture

The package has two products and a strict ownership boundary.

```text
XQUIHarness library
  -> imported by consumer-owned UI-test target
  -> consumer owns identifiers, screens, and journeys

xq-ui-test executable
  -> reads consumer JSON configuration
  -> validates IPA and physical device
  -> update-installs app without uninstalling
  -> invokes xcodebuild
  -> writes XCResult, JUnit XML, logs, and metadata
```

`XQUIHarnessCLI` uses structured `devicectl` output. Tool and process calls are
behind `CommandRunning` so failures can be tested without a device.

The framework never owns product bundle IDs, product test data, or business
workflows. The consumer never reimplements device provisioning or reporting.
