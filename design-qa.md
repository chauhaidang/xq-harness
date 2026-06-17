# Design QA

final result: passed

## Target

- Selected reference: `/Users/automation2/.codex/generated_images/019ece3d-dd43-7481-a5d8-705e08795aaf/ig_05922bb5a4bd8014016a30b7fef74881919251b4975a9fe630.png`
- Native screenshot: `/private/tmp/xq-finance-add-buy-lot.png`

## Checks

- The native screen keeps the selected Asset Focus Swipe direction with a simpler
  active asset card, stacked next-card preview, large USD/VND toggle, portfolio
  total summary, buy-lot list, add-lot action, edit-price action, and
  destructive deduct controls.
- Header clears the Dynamic Island on the iPhone 16 simulator.
- Current total value, units, price per unit, subtotal, add, and delete actions
  are readable without incoherent overlap.
- The unused menu/filter chrome and bottom arrow controls are absent.

## Notes

- The implementation uses SwiftUI system symbols and fixture data; no external
  finance data, persistence, authentication, or provider integration is present.
