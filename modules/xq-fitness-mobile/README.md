# XQ Fitness Mobile

Private Expo/React Native application for managing workout routines, workout
days, exercises, weekly snapshots, and reports.

## Toolchain

- Node.js 22+ and npm 11
- Expo 49 / React Native 0.72
- Xcode 16 and CocoaPods for local physical-device builds
- A connected, paired iPhone for device verification

The committed `ios/` project is authoritative. Routine builds do not run
`expo prebuild`, and simulator builds are not supported by this module.

## Portable build and unit tests

These are the only checks run by GitHub Actions:

```bash
./scripts/module ci xq-fitness-mobile
```

From this directory, the equivalent commands are:

```bash
npm ci --include=dev
npm run build:check
npm run test:unit
```

`build:check` produces an ignored Expo iOS bundle under `dist/`; it does not
invoke Xcode, signing, containers, or a device.

## Local integration tests

Integration tests are intentionally local-only and require the sibling
`xq-test-infra` module plus Docker:

```bash
npm run test:integration:local
```

The command starts the environment from `test-env/`, waits for the gateway,
runs Jest, generates the integration report, collects service logs, and always
stops the environment. Generated reports are ignored under
`__tests__/integration/tsr/`.

## Local physical-device verification

Set all required machine-local values; do not commit them:

```bash
export DEVELOPMENT_TEAM="<apple-team-id>"
export DEVICE_UDID="<connected-device-udid>"
export DEVICE_GATEWAY_URL="http://<reachable-host>:8080"
```

Then run:

```bash
npm run ios:device:doctor
npm run ios:device:verify
```

The verification command installs locked Pods, archives a standalone Release
build with an embedded JavaScript bundle, exports it using automatic development
signing, installs it with `xcrun devicectl`, and launches
`com.xqfitness.app`. The device must be paired, trusted, and able to reach
`DEVICE_GATEWAY_URL`; Metro is not used.

Individual steps are also available as `ios:device:build`,
`ios:device:install`, and `ios:device:launch`.

## Runtime configuration

- `DEVICE_GATEWAY_URL` supplies the physical-device API gateway at build time.
- `ENABLE_API_LOGGING=true` enables diagnostic request/response logging.
- Sensitive request headers are redacted, but diagnostic logging should remain
  disabled outside development troubleshooting.

The application API lives under
`/xq-fitness-write-service/api/v1` on the configured gateway.

## Notable dependencies

- Expo and React Native provide the application runtime and native bridge.
- React Navigation provides stack and bottom-tab navigation.
- Axios provides gateway HTTP access.
- The application icon is project-owned and carried with the imported module.
