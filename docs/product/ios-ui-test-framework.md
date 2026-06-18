# iOS UI Test Framework

## Product Surface

`xq-ios-ui-test-framework` is a shippable Swift Package for consumer-owned
XCUITest suites and serial physical-iPhone execution.

## Current Contract

- `XQUIHarness` provides application descriptors, launch configuration,
  bounded waits, element actions/assertions, relaunch support, screenshots,
  accessibility hierarchy capture, and failure attachments.
- `xq-ui-test` provides `preflight`, `devices`, and `run` commands.
- Consumer configuration is Codable JSON with schema version 1.
- The runner discovers physical iPhones through structured `devicectl` JSON,
  validates IPA bundle identity and signature, and update-installs without an
  uninstall operation.
- The runner invokes the consumer UI-test scheme through `xcodebuild`, permits
  automatic test-runner provisioning, and propagates the authoritative test or
  report exit code.
- Every completed test invocation emits XCResult, JUnit XML, raw Xcode and
  xcbeautify logs, and JSON metadata beneath a timestamped result directory.
- Bundle IDs, accessibility identifiers, screen objects, business values,
  persistence policy, and journeys remain in consumer repositories.
- Version `0.x` consumers use `.upToNextMinor`; version `1.x` consumers may use
  `from:` semantic-version ranges.

## Distribution

The monorepo directory is the development source. Tags matching
`ios-ui-test-framework-vX.Y.Z` validate `VERSION`, split the module subtree,
push it to the private `chauhaidang/xq-ios-ui-test-framework` repository, create
an immutable `X.Y.Z` tag, and publish GitHub release notes.

Release write credentials and consumer read credentials are configured outside
the repository. Local consumers use a path dependency; published consumers use
the private Git URL and a semantic version.

## Validation

- `swift build` and `swift test` validate the package and CLI contracts.
- The module CI compiles the XQ Finance UI-test consumer against the local path.
- A physical-device acceptance run validates signed IPA installation, the
  consumer lifecycle journey, relaunch persistence, and report artifacts.
