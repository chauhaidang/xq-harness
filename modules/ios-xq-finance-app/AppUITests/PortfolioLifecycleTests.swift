import XCTest
import XQUIHarness

@MainActor
final class PortfolioLifecycleTests: BaseUITestCase {
    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    func testPortfolioLifecyclePersistsInIsolatedStorage() {
        var app = launchApplication(TestApplication.descriptor, reset: true)
        var portfolio = PortfolioScreen(application: app)
        portfolio.emptyPortfolio.requireExistence()

        portfolio.openAddAsset().add(symbol: "XQTEST", name: "XQ Test Asset", startingPrice: "100")
        XCTAssertEqual(portfolio.assetSymbol.requireExistence().label, "XQTEST")

        portfolio.openPriceEditor().save(price: "120")
        portfolio.openBuyLotEditor().add(units: "2", price: "120")
        portfolio.transactionRow.requireExistence()

        portfolio.deductFirstTransaction()
        XCTAssertTrue(portfolio.transactionRow.waitForNonExistence(timeout: 8))

        app = relaunchApplication(TestApplication.descriptor)
        portfolio = PortfolioScreen(application: app)
        XCTAssertEqual(portfolio.assetSymbol.requireExistence().label, "XQTEST")
        XCTAssertFalse(portfolio.transactionRow.exists)
        captureScreenshot(named: "Persisted portfolio after relaunch")
    }
}
