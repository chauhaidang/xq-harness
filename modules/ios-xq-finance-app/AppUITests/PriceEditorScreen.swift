import XCTest
import XQUIHarness

@MainActor
struct PriceEditorScreen: ScreenObject {
    let application: XCUIApplication

    func save(price: String) {
        application.textFields[XQAccessibilityIdentifier.currentPriceField.rawValue].replaceText(with: price)
        application.buttons[XQAccessibilityIdentifier.priceSaveButton.rawValue].tapWhenHittable()
    }
}
