import XCTest
import XQUIHarness

@MainActor
struct PortfolioScreen: ScreenObject {
    let application: XCUIApplication

    var emptyPortfolio: XCUIElement {
        application.descendants(matching: .any)[XQAccessibilityIdentifier.emptyPortfolio.rawValue]
    }

    var assetSymbol: XCUIElement {
        application.descendants(matching: .any)[XQAccessibilityIdentifier.assetSymbol.rawValue]
    }

    var transactionRow: XCUIElement {
        application.descendants(matching: .any)[XQAccessibilityIdentifier.transactionRow.rawValue]
    }

    func openAddAsset() -> AddAssetScreen {
        application.buttons[XQAccessibilityIdentifier.addAssetButton.rawValue].firstMatch.tapWhenHittable()
        return AddAssetScreen(application: application)
    }

    func openPriceEditor() -> PriceEditorScreen {
        application.buttons[XQAccessibilityIdentifier.editPriceButton.rawValue].tapWhenHittable()
        return PriceEditorScreen(application: application)
    }

    func openBuyLotEditor() -> BuyLotScreen {
        application.buttons[XQAccessibilityIdentifier.addBuyLotButton.rawValue].tapWhenHittable()
        return BuyLotScreen(application: application)
    }

    func deductFirstTransaction() {
        application.buttons[XQAccessibilityIdentifier.deductTransactionButton.rawValue].firstMatch.tapWhenHittable()
        let confirmationButtons = application.sheets.buttons
            .matching(identifier: XQAccessibilityIdentifier.confirmDeductionButton.rawValue)
        confirmationButtons.element(boundBy: 1).tapWhenHittable()
    }
}
