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
- The screen does not show average cost, realized gain, invested value, or
  bottom arrow controls.
- Users can manually update the current price for an asset.
- Users can deduct a buy transaction only through a destructive confirmation
  action.
- Unit tests prove summary copy, manual price updates, transaction deduction,
  and buy-lot creation behavior.

## Design Notes

- Commands: none.
- Queries: none.
- API: none.
- Tables: none.
- Domain rules: manual price update changes valuation only; buy-lot creation
  adds local units and cost basis; transaction deduction removes a local buy lot
  from units and cost calculations.
- UI surfaces: SwiftUI swipe-card portfolio screen, USD/VND toggle, portfolio
  total summary, price editor sheet, buy-lot editor sheet, and deduction
  confirmation dialog.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id <id> --unit 1 --integration 0 --e2e 0 --platform 1`.

| Layer | Expected proof |
| --- | --- |
| Unit | `./scripts/module test ios-xq-finance-app` |
| Integration | Not applicable; no persistence, provider, or API integration exists in this slice. |
| E2E | Not applicable; no UI automation contract exists yet. |
| Platform | `./scripts/module build ios-xq-finance-app` |
| Release | Not applicable until distribution is defined. |

## Harness Delta

No harness changes expected.

## Evidence

- `./scripts/module build ios-xq-finance-app` passed with `** BUILD SUCCEEDED **`.
- `./scripts/module test ios-xq-finance-app` passed with 4 XCTest cases and 0 failures.
- Native simulator screenshot captured at `/private/tmp/xq-finance-add-buy-lot.png`;
  `design-qa.md` records the final visual check as passed.
