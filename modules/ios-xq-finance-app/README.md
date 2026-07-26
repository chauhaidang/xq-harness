# iOS XQ Finance App

Native SwiftUI finance portfolio app for iPhone/iPad.

## Testing

Shared contract: [iOS native app test strategy](../../docs/product/ios-native-app-test-strategy.md).

**Unit (CI):**

```bash
./scripts/module ci ios-xq-finance-app
```

**UI (Simulator, never CI):**

```bash
modules/ios-xq-finance-app/scripts/run-ui-tests.sh
```

See [BUILD_AND_TEST.md](BUILD_AND_TEST.md). Physical-device UI/IPA is tech debt.
