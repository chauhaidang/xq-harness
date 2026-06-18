import XCTest
import XQUIHarness

@MainActor
struct AddAssetScreen: ScreenObject {
    let application: XCUIApplication

    func add(symbol: String, name: String, startingPrice: String) {
        application.textFields[XQAccessibilityIdentifier.symbolField.rawValue].replaceText(with: symbol)
        application.textFields[XQAccessibilityIdentifier.nameField.rawValue].replaceText(with: name)
        application.textFields[XQAccessibilityIdentifier.startingPriceField.rawValue].replaceText(with: startingPrice)
        application.buttons[XQAccessibilityIdentifier.addAssetSaveButton.rawValue].tapWhenHittable()
    }
}
