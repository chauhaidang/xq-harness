# iOS XQ Finance App

## Product Surface

`ios-xq-finance-app` is the native iOS surface for the future XQ finance app.

## Current Contract

- The app is a SwiftUI iOS application module under `modules/ios-xq-finance-app`.
- The launch surface identifies the product as `XQ Finance`.
- The primary screen is a swipe-card portfolio browser. Each card represents one
  asset and shows current total value in the selected display currency plus a
  buy-lot list.
- A thumb-sized USD/VND toggle controls the display currency for the portfolio
  summary, asset card value, and buy-lot prices.
- A portfolio summary below the currency toggle shows the total current value
  across all local assets.
- Buy-lot rows show units, price per unit, subtotal, and a destructive delete
  action.
- Users can add a buy lot for the active asset by entering units and price per
  unit in USD. Adding a buy lot inserts it at the top of the local buy-lot list
  and updates units owned, asset current value, and portfolio total.
- Users move between asset cards by swiping horizontally on the card stack.
- Users can manually update the current price for each asset. Manual price
  updates are entered in USD and change current total value only; they do not
  change units owned or buy transaction history.
- Users can deduct a buy transaction from an asset through a destructive
  confirmation action. Deduction removes that buy lot from local portfolio
  calculations.
- The current slice does not expose a menu, filters, bottom arrow controls,
  average cost, realized gain, invested value, or gain/loss summaries.
- Current asset and transaction data is local fixture data for the UI slice.
- Financial account data, authentication, provider integrations, persistence,
  and analytics are not part of the current contract.

## Validation

- Module registration is validated through `./scripts/module info ios-xq-finance-app`.
- App build and unit tests are run through `./scripts/module build ios-xq-finance-app`
  and `./scripts/module test ios-xq-finance-app` on machines with Xcode and an
  iOS simulator matching `modules.yaml`.
