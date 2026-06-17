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
  across all local assets, followed by an editable USD-to-VND exchange rate row.
- The app launches empty on first install. A top-bar add button and empty-state
  prompt let users create their first asset.
- The Add Asset sheet lets users enter symbol, name, native currency, and an
  optional starting price.
- Each asset has a native currency chosen at creation time. Asset prices,
  buy lots, and manual price updates are stored in that native currency.
- Buy-lot rows show units, price per unit, subtotal, and a destructive delete
  action.
- Users can add a buy lot for the active asset by entering units and price per
  unit in the asset's native currency. Adding a buy lot inserts it at the top
  of the local buy-lot list and updates units owned, the asset's latest price,
  asset current value, and portfolio total.
- Users move between asset cards by swiping horizontally on the card stack.
- Users can manually update the current price for each asset in the asset's
  native currency. Manual price updates change current total value only; they do
  not change units owned or buy transaction history.
- Asset current total value is always calculated as total units owned multiplied
  by the asset's latest current price, then converted for display through the
  selected currency and exchange rate.
- Users can deduct a buy transaction from an asset through a destructive
  confirmation action. Deduction removes that buy lot from local portfolio
  calculations.
- Local portfolio data is persisted on device as a JSON snapshot in Application
  Support and mirrored to Keychain as the latest recovery snapshot.
- On launch, the app loads the Application Support snapshot first, restores
  from the Keychain snapshot if the file is missing, and starts empty when
  neither local snapshot exists.
- The current slice does not expose a menu, filters, bottom arrow controls,
  average cost, realized gain, invested value, or gain/loss summaries.
- Financial account data, authentication, provider integrations, cloud backup,
  export/import, and analytics are not part of the current contract.

## Validation

- Module registration is validated through `./scripts/module info ios-xq-finance-app`.
- App build and unit tests are run through `./scripts/module build ios-xq-finance-app`
  and `./scripts/module test ios-xq-finance-app` on machines with Xcode and an
  iOS simulator matching `modules.yaml`.
- Physical-device validation can run the same XCTest suite with `xcodebuild`
  targeting a plugged-in iPhone destination.
- Update-style reinstall persistence is validated on a physical device by
  `modules/ios-xq-finance-app/scripts/verify-device-reinstall-persistence.sh`.
