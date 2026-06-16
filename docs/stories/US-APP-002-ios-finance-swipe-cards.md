# US-APP-002 iOS Finance Swipe Cards

## Status

implemented

## Lane

normal

## Product Contract

Implement the first interactive `XQ Finance` portfolio surface as a native iOS
swipe-card browser. Each card represents an asset view with current total value,
manual price editing, and buy lots that can be added or deducted.

## Relevant Product Docs

- `docs/product/ios-xq-finance-app.md`

## Acceptance Criteria

- The app launches into a card-stack finance UI instead of the minimal overview
  copy screen.
- Users can move through asset cards by dragging horizontally on the card stack.
- Users can switch display currency with a large USD/VND toggle.
- The screen shows total current portfolio value across all assets below the
  currency toggle and above the card stack.
- Each asset card shows current total value in USD or VND.
- Each buy-lot row shows units, price per unit, subtotal, and a delete action.
- Users can add a buy lot by entering units and price per unit in USD.
- Adding a buy lot makes the entered price per unit the asset's latest current
  price and recalculates current total value from total units owned.
- The screen does not show average cost, realized gain, invested value, or
  bottom arrow controls.
- Users can manually update the current price for an asset.
- Updating current price recalculates current total value from total units
  owned without changing buy-lot history.
- Users can deduct a buy transaction only through a destructive confirmation
  action.
- Price updates, buy-lot additions, and buy-lot deductions are saved to local
  device storage.
- If the app storage snapshot is unavailable after a reinstall/update cycle,
  the app attempts to recover the latest portfolio snapshot from Keychain.
- A physical-device smoke script proves an update-style reinstall with the same
  bundle ID preserves the local portfolio snapshot.
- Unit tests prove summary copy, manual price updates, transaction deduction,
  buy-lot creation behavior, decimal-comma input, and portfolio snapshot
  encoding behavior.

## Design Notes

- Commands: none.
- Queries: none.
- API: none.
- Tables: none.
- Domain rules: manual price update changes valuation only; buy-lot creation
  adds local units and cost basis, promotes the entered unit price to latest
  current price, and recalculates current value; transaction deduction removes a
  local buy lot from units and cost calculations; local portfolio mutations are
  persisted as a versioned JSON snapshot and mirrored to Keychain for recovery.
- UI surfaces: SwiftUI swipe-card portfolio screen, USD/VND toggle, portfolio
  total summary, price editor sheet, buy-lot editor sheet, and deduction
  confirmation dialog.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id <id> --unit 1 --integration 0 --e2e 0 --platform 1`.

| Layer | Expected proof |
| --- | --- |
| Unit | `./scripts/module test ios-xq-finance-app` |
| Integration | Not applicable; persistence is local-only and covered by snapshot unit tests in this slice. |
| E2E | Not applicable; no UI automation contract exists yet. |
| Platform | `./scripts/module build ios-xq-finance-app`; `modules/ios-xq-finance-app/scripts/verify-device-reinstall-persistence.sh` for physical-device reinstall persistence |
| Release | Not applicable until distribution is defined. |

## Harness Delta

No harness changes expected.

## Evidence

- `./scripts/module build ios-xq-finance-app` passed with `** BUILD SUCCEEDED **`.
- `./scripts/module test ios-xq-finance-app` passed with 4 XCTest cases and 0 failures.
- Native simulator screenshot captured at `/private/tmp/xq-finance-add-buy-lot.png`;
  `design-qa.md` records the final visual check as passed.
- `./scripts/module test ios-xq-finance-app` passed with 7 XCTest cases and 0 failures
  after adding local persistence.
- Physical iPhone test passed on device `00008101-000E548E34F0001E` with 7 XCTest
  cases and 0 failures after adding local persistence.
- `modules/ios-xq-finance-app/scripts/verify-device-reinstall-persistence.sh`
  passed on device `00008101-000E548E34F0001E`: first install seeded a temporary
  persistence marker, second install ran without uninstalling, verify launch
  found the marker and restored the original portfolio.
- Physical iPhone XCTest passed on device `00008101-000E548E34F0001E` with 7
  tests and 0 failures after fixing add-buy-lot valuation; simulator test build
  succeeded but simulator launch hung waiting for the test runner and was
  cancelled.
