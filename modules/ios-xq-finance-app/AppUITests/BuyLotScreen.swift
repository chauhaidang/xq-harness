import XCTest
import XQUIHarness

@MainActor
struct BuyLotScreen: ScreenObject {
    let application: XCUIApplication

    func add(units: String, price: String) {
        application.textFields[XQAccessibilityIdentifier.buyLotUnitsField.rawValue].replaceText(with: units)
        application.textFields[XQAccessibilityIdentifier.buyLotPriceField.rawValue].replaceText(with: price)
        application.buttons[XQAccessibilityIdentifier.buyLotSaveButton.rawValue].tapWhenHittable()
    }
}
