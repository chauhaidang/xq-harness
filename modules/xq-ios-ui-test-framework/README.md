# XQ iOS UI Test Framework

`XQUIHarness` is a reusable Swift Package for black-box XCUITest suites. It
ships a library of launch, interaction, waiting, assertion, and failure-capture
helpers plus the `xq-ui-test` physical-device runner.

Application bundle IDs, accessibility identifiers, screen objects, and
business journeys belong to consumer repositories. They are deliberately not
part of this package.

## Products

- `XQUIHarness`: link this library to an iOS UI-test target.
- `xq-ui-test`: validate and update-install a signed IPA, run a selected suite
  on a physical iPhone, and emit XCResult and JUnit evidence.

## Local development

```bash
swift build
swift test
```

## Consumer dependency

Before 1.0, pin updates to the current minor line:

```swift
.package(
    url: "git@github.com:chauhaidang/xq-ios-ui-test-framework.git",
    .upToNextMinor(from: "0.1.0")
)
```

See [CONSUMER-GUIDE.md](Documentation/CONSUMER-GUIDE.md) and
[PUBLISHING.md](Documentation/PUBLISHING.md).
