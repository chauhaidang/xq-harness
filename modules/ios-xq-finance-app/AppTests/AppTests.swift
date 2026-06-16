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
        XCTAssertEqual(asset.currentPrice, 170, accuracy: 0.001)
        XCTAssertEqual(asset.currentValue, (initialUnits + 2.5) * 170, accuracy: 0.001)
    }

    func testDecimalCommaInputIsAccepted() throws {
        XCTAssertEqual("0,5".decimalNumber, 0.5)
        XCTAssertEqual(" 170,25 ".decimalNumber, 170.25)
        XCTAssertEqual("0.75".decimalNumber, 0.75)
    }

    func testPortfolioSnapshotRoundTripsAssets() throws {
        var asset = FinanceAsset.fixtures[0]
        asset.updateCurrentPrice(199.99)
        asset.addBuyLot(units: 0.5, unitPrice: 180, date: "Jun 16, 2026")

        let snapshot = PortfolioSnapshot(assets: [asset])
        let data = try XCTUnwrap(PortfolioStore.encode(snapshot))
        let decoded = try XCTUnwrap(PortfolioStore.decode(data))
        let restoredAsset = try XCTUnwrap(decoded.financeAssets.first)

        XCTAssertEqual(decoded.version, 1)
        XCTAssertEqual(restoredAsset.id, asset.id)
        XCTAssertEqual(restoredAsset.symbol, "AAPL")
        XCTAssertEqual(restoredAsset.name, "Apple Inc.")
        XCTAssertEqual(restoredAsset.currentPrice, 180, accuracy: 0.001)
        XCTAssertEqual(restoredAsset.transactions.count, asset.transactions.count)
        XCTAssertEqual(restoredAsset.transactions.first?.units, 0.5)
        XCTAssertEqual(restoredAsset.transactions.first?.unitPrice, 180)
    }

    func testPortfolioPersistenceSignatureChangesWhenAssetsChange() throws {
        var assets = FinanceAsset.fixtures
        let originalSignature = PortfolioStore.signature(for: assets)

        assets[0].addBuyLot(units: 1, unitPrice: 170, date: "Jun 16, 2026")

        XCTAssertNotEqual(PortfolioStore.signature(for: assets), originalSignature)
    }
}
