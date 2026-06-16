import XCTest
@testable import ios_xq_finance_app

final class AppTests: XCTestCase {
    func testDefaultSummaryNamesFinanceApp() throws {
        let summary = FinanceAppSummary.default

        XCTAssertEqual(summary.title, "XQ Finance")
        XCTAssertEqual(summary.subtitle, "Swipe through assets, update prices, and deduct sold lots.")
    }

    func testUpdatingCurrentPriceChangesValuationOnly() throws {
        var asset = FinanceAsset.fixtures[0]
        let units = asset.unitsOwned
        let totalCost = asset.totalCost

        asset.updateCurrentPrice(200)

        XCTAssertEqual(asset.unitsOwned, units, accuracy: 0.001)
        XCTAssertEqual(asset.totalCost, totalCost, accuracy: 0.001)
        XCTAssertEqual(asset.currentValue, units * 200, accuracy: 0.001)
    }

    func testDeductingTransactionRemovesBuyLot() throws {
        var asset = FinanceAsset.fixtures[0]
        let transaction = try XCTUnwrap(asset.transactions.last)

        asset.deduct(transactionID: transaction.id)

        XCTAssertFalse(asset.transactions.contains(transaction))
        XCTAssertEqual(asset.unitsOwned, 60, accuracy: 0.001)
    }

    func testAddingBuyLotUpdatesUnitsCostAndValuation() throws {
        var asset = FinanceAsset.fixtures[0]
        let initialUnits = asset.unitsOwned
        let initialCost = asset.totalCost
        let initialTransactionCount = asset.transactions.count

        asset.addBuyLot(units: 2.5, unitPrice: 170, date: "Jun 16, 2026")

        XCTAssertEqual(asset.transactions.count, initialTransactionCount + 1)
        XCTAssertEqual(asset.transactions.first?.units, 2.5)
        XCTAssertEqual(asset.transactions.first?.unitPrice, 170)
        XCTAssertEqual(asset.transactions.first?.date, "Jun 16, 2026")
        XCTAssertEqual(asset.unitsOwned, initialUnits + 2.5, accuracy: 0.001)
        XCTAssertEqual(asset.totalCost, initialCost + 425, accuracy: 0.001)
        XCTAssertEqual(asset.currentValue, asset.unitsOwned * asset.currentPrice, accuracy: 0.001)
    }

    func testDecimalCommaInputIsAccepted() throws {
        XCTAssertEqual("0,5".decimalNumber, 0.5)
        XCTAssertEqual(" 170,25 ".decimalNumber, 170.25)
        XCTAssertEqual("0.75".decimalNumber, 0.75)
    }
}
