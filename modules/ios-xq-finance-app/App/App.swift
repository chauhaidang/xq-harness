#if DEBUG
import Darwin
#endif
import Security
import SwiftUI

@main
struct XQFinanceApp: App {
    init() {
        #if DEBUG
        PersistenceSmokeTestRunner.runIfRequested()
        #endif
    }

    var body: some Scene {
        WindowGroup {
            ContentView(summary: FinanceAppSummary.default)
        }
    }
}

struct FinanceAppSummary {
    let title: String
    let subtitle: String

    static let `default` = FinanceAppSummary(
        title: "XQ Finance",
        subtitle: "Swipe through assets, update prices, and deduct sold lots."
    )
}

struct FinanceAsset: Identifiable {
    let id: UUID
    let symbol: String
    let name: String
    let accent: Color
    var currentPrice: Double
    var transactions: [BuyTransaction]

    var unitsOwned: Double {
        transactions.reduce(0) { $0 + $1.units }
    }

    var totalCost: Double {
        transactions.reduce(0) { $0 + $1.totalCost }
    }

    var currentValue: Double {
        unitsOwned * currentPrice
    }

    mutating func addBuyLot(units: Double, unitPrice: Double, date: String) {
        let normalizedUnitPrice = max(0, unitPrice)
        let transaction = BuyTransaction(
            id: UUID(),
            date: date,
            units: max(0, units),
            unitPrice: normalizedUnitPrice
        )
        transactions.insert(transaction, at: 0)
        currentPrice = normalizedUnitPrice
    }

    mutating func updateCurrentPrice(_ price: Double) {
        currentPrice = max(0, price)
    }

    mutating func deduct(transactionID: UUID) {
        transactions.removeAll { $0.id == transactionID }
    }
}

struct BuyTransaction: Identifiable, Codable, Equatable {
    let id: UUID
    let date: String
    let units: Double
    let unitPrice: Double

    var totalCost: Double {
        units * unitPrice
    }

    var shortDate: String {
        date
            .replacingOccurrences(of: ", 2024", with: "")
            .replacingOccurrences(of: ", 2023", with: "")
    }
}

enum PortfolioStore {
    private static let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return encoder
    }()

    private static let decoder = JSONDecoder()

    private static var portfolioURL: URL? {
        guard let baseURL = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else {
            return nil
        }
        return baseURL
            .appendingPathComponent("XQFinance", isDirectory: true)
            .appendingPathComponent("portfolio.json")
    }

    static func loadAssets() -> [FinanceAsset] {
        if let data = loadPrimarySnapshotData(), let snapshot = decode(data) {
            return snapshot.financeAssets
        }

        if let data = KeychainPortfolioSnapshot.load(), let snapshot = decode(data) {
            writePrimarySnapshotData(data)
            return snapshot.financeAssets
        }

        return FinanceAsset.fixtures
    }

    static func save(_ assets: [FinanceAsset]) {
        guard let data = encode(PortfolioSnapshot(assets: assets)) else { return }
        writePrimarySnapshotData(data)
        KeychainPortfolioSnapshot.save(data)
    }

    static func signature(for assets: [FinanceAsset]) -> String {
        guard let data = encode(PortfolioSnapshot(assets: assets)) else { return "" }
        return String(decoding: data, as: UTF8.self)
    }

    static func encode(_ snapshot: PortfolioSnapshot) -> Data? {
        try? encoder.encode(snapshot)
    }

    static func decode(_ data: Data) -> PortfolioSnapshot? {
        try? decoder.decode(PortfolioSnapshot.self, from: data)
    }

    private static func loadPrimarySnapshotData() -> Data? {
        guard let portfolioURL else { return nil }
        return try? Data(contentsOf: portfolioURL)
    }

    private static func writePrimarySnapshotData(_ data: Data) {
        guard let portfolioURL else { return }
        do {
            try FileManager.default.createDirectory(
                at: portfolioURL.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            try data.write(to: portfolioURL, options: [.atomic])
        } catch {
            // Keychain fallback still gives the app a recovery path if file write fails.
        }
    }
}

struct PortfolioSnapshot: Codable, Equatable {
    let version: Int
    let assets: [PortfolioAssetSnapshot]

    init(version: Int = 1, assets: [PortfolioAssetSnapshot]) {
        self.version = version
        self.assets = assets
    }

    init(assets: [FinanceAsset]) {
        self.version = 1
        self.assets = assets.map(PortfolioAssetSnapshot.init(asset:))
    }

    var financeAssets: [FinanceAsset] {
        assets.map(\.financeAsset)
    }
}

struct PortfolioAssetSnapshot: Codable, Equatable {
    let id: UUID
    let symbol: String
    let name: String
    let currentPrice: Double
    let transactions: [BuyTransaction]

    init(asset: FinanceAsset) {
        id = asset.id
        symbol = asset.symbol
        name = asset.name
        currentPrice = asset.currentPrice
        transactions = asset.transactions
    }

    var financeAsset: FinanceAsset {
        FinanceAsset(
            id: id,
            symbol: symbol,
            name: name,
            accent: FinanceAsset.accent(for: symbol),
            currentPrice: currentPrice,
            transactions: transactions
        )
    }
}

private enum KeychainPortfolioSnapshot {
    private static let service = "com.xq.finance.ios-xq-finance-app.portfolio"
    private static let defaultAccount = "latestPortfolioSnapshot"

    static func load(account: String = defaultAccount) -> Data? {
        var query = baseQuery(account: account)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess else { return nil }
        return result as? Data
    }

    static func save(_ data: Data, account: String = defaultAccount) {
        let attributes: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]

        let updateStatus = SecItemUpdate(baseQuery(account: account) as CFDictionary, attributes as CFDictionary)
        if updateStatus == errSecSuccess {
            return
        }

        var addQuery = baseQuery(account: account)
        addQuery[kSecValueData as String] = data
        addQuery[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(addQuery as CFDictionary, nil)
    }

    static func delete(account: String = defaultAccount) {
        SecItemDelete(baseQuery(account: account) as CFDictionary)
    }

    private static func baseQuery(account: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
    }
}

#if DEBUG
enum PersistenceSmokeTestRunner {
    private static let flag = "--xq-persistence-smoke"
    private static let seedCommand = "seed"
    private static let verifyCommand = "verify"
    private static let restoreCommand = "restore"
    private static let backupAccount = "reinstallPersistenceSmokeBackup"
    private static let smokeAssetID = UUID(uuidString: "5AE61D43-67EE-4C1F-8ED4-B5D5A3799825")!
    private static let smokeTransactionID = UUID(uuidString: "F3117862-9382-44A2-8407-1EAD34F70A5D")!
    private static let smokeSymbol = "XQSMOKE"
    private static let smokePrice = 1234.56
    private static let smokeUnits = 7.5
    private static let smokeUnitPrice = 11.22

    static func runIfRequested(arguments: [String] = CommandLine.arguments) {
        guard
            let flagIndex = arguments.firstIndex(of: flag),
            arguments.indices.contains(flagIndex + 1)
        else {
            return
        }

        let status: Int32
        switch arguments[flagIndex + 1] {
        case seedCommand:
            status = seed()
        case verifyCommand:
            status = verifyAndRestore()
        case restoreCommand:
            status = restoreOriginalPortfolio()
        default:
            status = 64
        }

        exit(status)
    }

    private static func seed() -> Int32 {
        let originalSnapshot = PortfolioSnapshot(assets: PortfolioStore.loadAssets())
        guard let backupData = PortfolioStore.encode(originalSnapshot) else { return 65 }
        KeychainPortfolioSnapshot.save(backupData, account: backupAccount)

        var assets = originalSnapshot.financeAssets.filter { $0.symbol != smokeSymbol }
        assets.insert(smokeAsset, at: 0)
        PortfolioStore.save(assets)
        return 0
    }

    private static func verifyAndRestore() -> Int32 {
        let assets = PortfolioStore.loadAssets()
        guard let asset = assets.first(where: { $0.id == smokeAssetID && $0.symbol == smokeSymbol }) else {
            return 66
        }
        guard asset.currentPrice == smokePrice else { return 67 }
        guard let transaction = asset.transactions.first(where: { $0.id == smokeTransactionID }) else {
            return 68
        }
        guard transaction.units == smokeUnits && transaction.unitPrice == smokeUnitPrice else {
            return 69
        }

        return restoreOriginalPortfolio()
    }

    private static func restoreOriginalPortfolio() -> Int32 {
        guard let backupData = KeychainPortfolioSnapshot.load(account: backupAccount) else {
            return 70
        }
        guard let snapshot = PortfolioStore.decode(backupData) else {
            return 71
        }

        PortfolioStore.save(snapshot.financeAssets)
        KeychainPortfolioSnapshot.delete(account: backupAccount)
        return 0
    }

    private static var smokeAsset: FinanceAsset {
        FinanceAsset(
            id: smokeAssetID,
            symbol: smokeSymbol,
            name: "XQ Persistence Smoke",
            accent: FinanceAsset.accent(for: smokeSymbol),
            currentPrice: smokePrice,
            transactions: [
                BuyTransaction(
                    id: smokeTransactionID,
                    date: "Jun 16, 2026",
                    units: smokeUnits,
                    unitPrice: smokeUnitPrice
                )
            ]
        )
    }
}
#endif

struct ContentView: View {
    let summary: FinanceAppSummary

    @State private var assets: [FinanceAsset]
    @State private var activeIndex = 0
    @State private var dragOffset: CGSize = .zero
    @State private var selectedTransaction: TransactionSelection?
    @State private var isShowingDeductConfirmation = false
    @State private var activeSheet: AssetSheet?
    @State private var displayCurrency = DisplayCurrency.usd

    init(summary: FinanceAppSummary, assets: [FinanceAsset]? = nil) {
        self.summary = summary
        _assets = State(initialValue: assets ?? PortfolioStore.loadAssets())
    }

    private var portfolioTotalValue: Double {
        assets.reduce(0) { $0 + $1.currentValue }
    }

    private var persistenceSignature: String {
        PortfolioStore.signature(for: assets)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                XQPalette.background.ignoresSafeArea()

                VStack(spacing: 12) {
                    HeaderView(
                        title: summary.title,
                        position: activeIndex + 1,
                        count: assets.count
                    )

                    CurrencyToggleView(displayCurrency: $displayCurrency)

                    PortfolioSummaryView(
                        totalValue: portfolioTotalValue,
                        displayCurrency: displayCurrency
                    )

                    AssetDeckView(
                        assets: assets,
                        activeIndex: activeIndex,
                        dragOffset: dragOffset,
                        displayCurrency: displayCurrency,
                        onEditPrice: { activeSheet = .editPrice($0.id) },
                        onAddBuyLot: { activeSheet = .addBuyLot($0.id) },
                        onSelectTransaction: { asset, transaction in
                            selectedTransaction = TransactionSelection(
                                assetID: asset.id,
                                transaction: transaction
                            )
                            isShowingDeductConfirmation = true
                        }
                    )
                    .gesture(
                        DragGesture()
                            .onChanged { dragOffset = $0.translation }
                            .onEnded { value in
                                handleDragEnd(value.translation)
                            }
                    )

                    Text("Swipe card to switch assets")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(XQPalette.muted)
                        .padding(.bottom, 4)
                }
                .padding(.horizontal, 22)
                .padding(.top, 54)
                .padding(.bottom, 10)
            }
            .navigationBarTitleDisplayMode(.inline)
        }
        .onChange(of: persistenceSignature) { _, _ in
            PortfolioStore.save(assets)
        }
        .sheet(item: $activeSheet) { sheet in
            if let index = assets.firstIndex(where: { $0.id == sheet.assetID }) {
                switch sheet {
                case .editPrice:
                    PriceEditorSheet(asset: $assets[index])
                        .presentationDetents([.medium])
                case .addBuyLot:
                    BuyLotEditorSheet(asset: $assets[index])
                        .presentationDetents([.medium])
                }
            } else {
                Text("Asset unavailable")
                    .presentationDetents([.medium])
            }
        }
        .confirmationDialog(
            "Deduct this transaction?",
            isPresented: $isShowingDeductConfirmation,
            titleVisibility: .visible,
            presenting: selectedTransaction
        ) { selection in
            Button("Confirm Deduction", role: .destructive) {
                deduct(selection)
            }
            Button("Cancel", role: .cancel) {}
        } message: { selection in
            Text("This removes \(selection.transaction.units.formattedUnits) units from the asset's buy lots.")
        }
    }

    private func handleDragEnd(_ translation: CGSize) {
        if translation.width > 90 {
            moveToNextCard(direction: .right)
        } else if translation.width < -90 {
            moveToNextCard(direction: .left)
        } else {
            withAnimation(.spring(response: 0.34, dampingFraction: 0.78)) {
                dragOffset = .zero
            }
        }
    }

    private func moveToNextCard(direction: SwipeDirection) {
        withAnimation(.spring(response: 0.36, dampingFraction: 0.82)) {
            dragOffset = CGSize(width: direction == .right ? 520 : -520, height: -20)
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            activeIndex = (activeIndex + 1) % assets.count
            dragOffset = .zero
        }
    }

    private func deduct(_ selection: TransactionSelection) {
        guard let index = assets.firstIndex(where: { $0.id == selection.assetID }) else { return }
        withAnimation(.spring(response: 0.32, dampingFraction: 0.86)) {
            assets[index].deduct(transactionID: selection.transaction.id)
        }
    }
}

private enum SwipeDirection {
    case left
    case right
}

private enum AssetSheet: Identifiable {
    case editPrice(UUID)
    case addBuyLot(UUID)

    var id: String {
        switch self {
        case .editPrice(let assetID):
            return "edit-price-\(assetID.uuidString)"
        case .addBuyLot(let assetID):
            return "add-buy-lot-\(assetID.uuidString)"
        }
    }

    var assetID: UUID {
        switch self {
        case .editPrice(let assetID), .addBuyLot(let assetID):
            return assetID
        }
    }
}

private enum DisplayCurrency: String, CaseIterable, Identifiable {
    case usd = "USD"
    case vnd = "VND"

    var id: String {
        rawValue
    }

    func amount(fromUSD amount: Double) -> Double {
        switch self {
        case .usd:
            return amount
        case .vnd:
            return amount * 25_500
        }
    }

    func formatted(fromUSD amount: Double) -> String {
        switch self {
        case .usd:
            return amount.currency
        case .vnd:
            return self.amount(fromUSD: amount).vndCurrency
        }
    }
}

private struct HeaderView: View {
    let title: String
    let position: Int
    let count: Int

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(XQPalette.ink)

            Spacer()

            Text("\(position) / \(count)")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(XQPalette.muted)
        }
    }
}

private struct CurrencyToggleView: View {
    @Binding var displayCurrency: DisplayCurrency

    var body: some View {
        HStack(spacing: 0) {
            ForEach(DisplayCurrency.allCases) { currency in
                Button {
                    withAnimation(.spring(response: 0.28, dampingFraction: 0.86)) {
                        displayCurrency = currency
                    }
                } label: {
                    Text(currency.rawValue)
                        .font(.system(size: 17, weight: .heavy, design: .rounded))
                        .foregroundStyle(displayCurrency == currency ? .white : XQPalette.muted)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(
                            Capsule()
                                .fill(displayCurrency == currency ? XQPalette.ink : .clear)
                                .shadow(
                                    color: XQPalette.shadow.opacity(displayCurrency == currency ? 0.16 : 0),
                                    radius: 10,
                                    x: 0,
                                    y: 6
                                )
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(.white, in: Capsule())
        .overlay(Capsule().stroke(XQPalette.divider, lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Display currency")
    }
}

private struct PortfolioSummaryView: View {
    let totalValue: Double
    let displayCurrency: DisplayCurrency

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Portfolio total")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(XQPalette.muted)

            Text(displayCurrency.formatted(fromUSD: totalValue))
                .font(.system(size: displayCurrency == .usd ? 31 : 25, weight: .heavy, design: .rounded))
                .foregroundStyle(XQPalette.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.58)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 18)
        .padding(.vertical, 13)
        .background(.white, in: RoundedRectangle(cornerRadius: 18))
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(XQPalette.divider, lineWidth: 1)
        )
    }
}

private struct AssetDeckView: View {
    let assets: [FinanceAsset]
    let activeIndex: Int
    let dragOffset: CGSize
    let displayCurrency: DisplayCurrency
    let onEditPrice: (FinanceAsset) -> Void
    let onAddBuyLot: (FinanceAsset) -> Void
    let onSelectTransaction: (FinanceAsset, BuyTransaction) -> Void

    var body: some View {
        ZStack {
            ForEach(0..<min(3, assets.count), id: \.self) { deckPosition in
                let assetIndex = (activeIndex + deckPosition) % assets.count
                let asset = assets[assetIndex]

                AssetCardView(
                    asset: asset,
                    isActive: deckPosition == 0,
                    displayCurrency: displayCurrency,
                    onEditPrice: { onEditPrice(asset) },
                    onAddBuyLot: { onAddBuyLot(asset) },
                    onSelectTransaction: { onSelectTransaction(asset, $0) }
                )
                .offset(x: xOffset(for: deckPosition), y: yOffset(for: deckPosition))
                .rotationEffect(.degrees(rotation(for: deckPosition)))
                .scaleEffect(scale(for: deckPosition))
                .zIndex(Double(3 - deckPosition))
                .allowsHitTesting(deckPosition == 0)
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: 520)
    }

    private func xOffset(for deckPosition: Int) -> CGFloat {
        guard deckPosition == 0 else { return CGFloat(deckPosition) * 44 }
        return dragOffset.width
    }

    private func yOffset(for deckPosition: Int) -> CGFloat {
        guard deckPosition == 0 else { return CGFloat(deckPosition) * 20 }
        return dragOffset.height * 0.16
    }

    private func rotation(for deckPosition: Int) -> Double {
        guard deckPosition == 0 else { return Double(deckPosition) * 3.5 }
        return Double(dragOffset.width / 28)
    }

    private func scale(for deckPosition: Int) -> CGFloat {
        deckPosition == 0 ? 1 : 1 - CGFloat(deckPosition) * 0.045
    }
}

private struct AssetCardView: View {
    let asset: FinanceAsset
    let isActive: Bool
    let displayCurrency: DisplayCurrency
    let onEditPrice: () -> Void
    let onAddBuyLot: () -> Void
    let onSelectTransaction: (BuyTransaction) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                AssetIconView(asset: asset)

                VStack(alignment: .leading, spacing: 4) {
                    Text(asset.symbol)
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundStyle(XQPalette.ink)

                    Text(asset.name)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(XQPalette.muted)
                }

                Spacer()

                Button {
                    onEditPrice()
                } label: {
                    Label("Edit price", systemImage: "pencil")
                        .font(.system(size: 14, weight: .semibold))
                        .labelStyle(.titleAndIcon)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(.white, in: Capsule())
                        .overlay(
                            Capsule().stroke(XQPalette.divider, lineWidth: 1)
                        )
                }
                .buttonStyle(.plain)
                .foregroundStyle(XQPalette.ink)
                .accessibilityLabel("Update current price for \(asset.symbol)")
            }

            VStack(alignment: .leading, spacing: 8) {
                Text(displayCurrency.formatted(fromUSD: asset.currentValue))
                    .font(.system(size: displayCurrency == .usd ? 38 : 30, weight: .heavy, design: .rounded))
                    .minimumScaleFactor(0.62)
                    .lineLimit(1)
                    .foregroundStyle(XQPalette.ink)

                Text("Current total value")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(XQPalette.muted)
            }

            VStack(spacing: 0) {
                HStack(spacing: 8) {
                    Text("Buy Lots")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(XQPalette.ink)

                    Text("\(asset.transactions.count)")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(XQPalette.muted)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(XQPalette.softFill, in: Capsule())

                    Spacer()

                    Button {
                        onAddBuyLot()
                    } label: {
                        Label("Add", systemImage: "plus")
                            .font(.system(size: 13, weight: .bold))
                            .labelStyle(.titleAndIcon)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(XQPalette.ink, in: Capsule())
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.white)
                    .accessibilityLabel("Add buy lot for \(asset.symbol)")
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 11)

                Divider().overlay(XQPalette.divider)

                TransactionHeaderRow()

                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(asset.transactions) { transaction in
                            TransactionRow(
                                transaction: transaction,
                                displayCurrency: displayCurrency,
                                onDeduct: { onSelectTransaction(transaction) }
                            )

                            if transaction.id != asset.transactions.last?.id {
                                Divider()
                                    .padding(.leading, 16)
                                    .overlay(XQPalette.divider)
                            }
                        }
                    }
                }
                .scrollIndicators(.hidden)
            }
            .background(.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 18))
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(XQPalette.divider, lineWidth: 1)
            )
        }
        .padding(18)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(.white, in: RoundedRectangle(cornerRadius: 26))
        .overlay(
            RoundedRectangle(cornerRadius: 28)
                .stroke(isActive ? XQPalette.divider : XQPalette.divider.opacity(0.5), lineWidth: 1)
        )
        .shadow(color: XQPalette.shadow.opacity(isActive ? 0.18 : 0.08), radius: isActive ? 22 : 12, x: 0, y: isActive ? 16 : 8)
    }
}

private struct TransactionHeaderRow: View {
    var body: some View {
        HStack(spacing: 10) {
            Text("Units")
                .frame(width: 64, alignment: .leading)

            Text("Price / unit")
                .frame(width: 84, alignment: .leading)

            Spacer(minLength: 4)

            Text("Subtotal")
                .frame(width: 86, alignment: .trailing)

            Color.clear.frame(width: 38, height: 1)
        }
        .font(.system(size: 12, weight: .bold))
        .foregroundStyle(XQPalette.muted)
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
        .background(XQPalette.softFill.opacity(0.72))
    }
}

private struct TransactionRow: View {
    let transaction: BuyTransaction
    let displayCurrency: DisplayCurrency
    let onDeduct: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            Text(transaction.units.formattedUnits)
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundStyle(XQPalette.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.72)
                .frame(width: 64, alignment: .leading)

            Text(displayCurrency.formatted(fromUSD: transaction.unitPrice))
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(XQPalette.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.68)
                .frame(width: 84, alignment: .leading)

            Spacer(minLength: 4)

            Text(displayCurrency.formatted(fromUSD: transaction.totalCost))
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(XQPalette.ink)
                .frame(width: 86, alignment: .trailing)
                .minimumScaleFactor(0.64)
                .lineLimit(1)

            Button(role: .destructive) {
                onDeduct()
            } label: {
                Image(systemName: "trash")
                    .font(.system(size: 14, weight: .bold))
                    .frame(width: 34, height: 34)
                    .background(XQPalette.destructive.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
            .foregroundStyle(XQPalette.destructive)
            .accessibilityLabel("Deduct transaction from \(transaction.date)")
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .contentShape(Rectangle())
    }
}

private struct PriceEditorSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var asset: FinanceAsset
    @State private var priceText = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Current Price") {
                    TextField("Price", text: $priceText)
                        .keyboardType(.decimalPad)
                        .font(.system(size: 28, weight: .bold, design: .rounded))

                    Text("Current price is entered in USD. Updating price changes total value only; it does not change units owned.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Update \(asset.symbol)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        if let price = priceText.decimalNumber {
                            asset.updateCurrentPrice(price)
                        }
                        dismiss()
                    }
                    .disabled(priceText.decimalNumber == nil)
                }
            }
            .onAppear {
                priceText = String(format: "%.2f", asset.currentPrice)
            }
        }
    }
}

private struct BuyLotEditorSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var asset: FinanceAsset
    @State private var unitsText = ""
    @State private var unitPriceText = ""

    private var units: Double? {
        unitsText.decimalNumber
    }

    private var unitPrice: Double? {
        unitPriceText.decimalNumber
    }

    private var subtotal: Double? {
        guard let units, let unitPrice else { return nil }
        return units * unitPrice
    }

    private var canSave: Bool {
        guard let units, let unitPrice else { return false }
        return units > 0 && unitPrice > 0
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Buy Lot") {
                    TextField("Units", text: $unitsText)
                        .keyboardType(.decimalPad)

                    TextField("Price per unit", text: $unitPriceText)
                        .keyboardType(.decimalPad)

                    HStack {
                        Text("Subtotal")
                        Spacer()
                        Text(subtotal?.currency ?? "$0.00")
                            .font(.system(size: 17, weight: .bold, design: .rounded))
                    }
                }

                Section {
                    Text("Buy lots are entered in USD. Adding a lot increases units owned and current total value for this asset.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Add \(asset.symbol) Lot")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        guard let units, let unitPrice else { return }
                        asset.addBuyLot(
                            units: units,
                            unitPrice: unitPrice,
                            date: Date.now.buyLotDate
                        )
                        dismiss()
                    }
                    .disabled(!canSave)
                }
            }
        }
    }
}

private struct AssetIconView: View {
    let asset: FinanceAsset

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(asset.accent.gradient)

            Text(String(asset.symbol.prefix(1)))
                .font(.system(size: 32, weight: .black, design: .rounded))
                .foregroundStyle(.white)
        }
        .frame(width: 60, height: 60)
        .shadow(color: asset.accent.opacity(0.24), radius: 10, y: 8)
    }
}

struct TransactionSelection: Identifiable {
    let assetID: UUID
    let transaction: BuyTransaction

    var id: UUID {
        transaction.id
    }
}

private enum XQPalette {
    static let background = Color(red: 0.965, green: 0.974, blue: 0.988)
    static let ink = Color(red: 0.045, green: 0.102, blue: 0.207)
    static let muted = Color(red: 0.394, green: 0.456, blue: 0.578)
    static let divider = Color(red: 0.858, green: 0.887, blue: 0.926)
    static let softFill = Color(red: 0.928, green: 0.944, blue: 0.968)
    static let shadow = Color(red: 0.035, green: 0.068, blue: 0.13)
    static let positive = Color(red: 0.08, green: 0.68, blue: 0.31)
    static let destructive = Color(red: 0.95, green: 0.22, blue: 0.18)
}

private extension Double {
    var currency: String {
        Self.currencyFormatter.string(from: NSNumber(value: self)) ?? "$0.00"
    }

    var compactCurrency: String {
        Self.compactCurrencyFormatter.string(from: NSNumber(value: self)) ?? "$0"
    }

    var vndCurrency: String {
        "VND \(Self.vndFormatter.string(from: NSNumber(value: self)) ?? "0")"
    }

    var signedCurrency: String {
        let formatted = abs(self).currency
        return self >= 0 ? "+\(formatted)" : "-\(formatted)"
    }

    var signedPercent: String {
        let percent = abs(self) * 100
        return "\(self >= 0 ? "+" : "-")\(String(format: "%.2f", percent))%"
    }

    var formattedUnits: String {
        String(format: "%.3f", self)
    }

    private static let currencyFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.maximumFractionDigits = 2
        formatter.minimumFractionDigits = 2
        formatter.locale = Locale(identifier: "en_US")
        return formatter
    }()

    private static let compactCurrencyFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.maximumFractionDigits = 0
        formatter.minimumFractionDigits = 0
        formatter.locale = Locale(identifier: "en_US")
        return formatter
    }()

    private static let vndFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0
        formatter.minimumFractionDigits = 0
        formatter.locale = Locale(identifier: "vi_VN")
        return formatter
    }()
}

extension String {
    var decimalNumber: Double? {
        let normalized = trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: ",", with: ".")
        return Double(normalized)
    }
}

private extension Date {
    var buyLotDate: String {
        Self.buyLotFormatter.string(from: self)
    }

    private static let buyLotFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter
    }()
}

extension FinanceAsset {
    static func accent(for symbol: String) -> Color {
        switch symbol {
        case "AAPL":
            return Color(red: 0.06, green: 0.11, blue: 0.2)
        case "BTC":
            return Color(red: 0.98, green: 0.58, blue: 0.04)
        case "ETH":
            return Color(red: 0.29, green: 0.38, blue: 0.83)
        default:
            return XQPalette.ink
        }
    }

    static let fixtures = [
        FinanceAsset(
            id: UUID(uuidString: "46C64E8D-039F-4E41-8E0C-7D6D970E3F91")!,
            symbol: "AAPL",
            name: "Apple Inc.",
            accent: Self.accent(for: "AAPL"),
            currentPrice: 174.65,
            transactions: [
                BuyTransaction(id: UUID(uuidString: "52AD1788-4E1C-4797-9BD9-F5B77C9388E2")!, date: "May 6, 2024", units: 10.000, unitPrice: 169.21),
                BuyTransaction(id: UUID(uuidString: "4A8E62BF-6FDE-482A-9F56-768440E28A5D")!, date: "Apr 15, 2024", units: 15.000, unitPrice: 165.32),
                BuyTransaction(id: UUID(uuidString: "16D2410E-4110-480A-8E83-11DB28DA44E3")!, date: "Mar 1, 2024", units: 20.000, unitPrice: 155.10),
                BuyTransaction(id: UUID(uuidString: "F9403430-4133-491E-84E9-1172DD6D9C5D")!, date: "Jan 16, 2024", units: 15.000, unitPrice: 145.85),
                BuyTransaction(id: UUID(uuidString: "52EC4676-C263-4F45-83F5-7E0F355BF2F3")!, date: "Dec 1, 2023", units: 12.342, unitPrice: 124.56)
            ]
        ),
        FinanceAsset(
            id: UUID(uuidString: "87A05B55-3282-49EA-98E4-3A2C05B34B20")!,
            symbol: "BTC",
            name: "Bitcoin",
            accent: Self.accent(for: "BTC"),
            currentPrice: 68420.00,
            transactions: [
                BuyTransaction(id: UUID(uuidString: "3AE792AC-4B1E-4712-A302-33E6D9F1D1BD")!, date: "May 5, 2024", units: 0.080, unitPrice: 64210.00),
                BuyTransaction(id: UUID(uuidString: "0FD21708-A91A-4095-86C6-550958F2AD68")!, date: "Apr 20, 2024", units: 0.145, unitPrice: 60280.00),
                BuyTransaction(id: UUID(uuidString: "0D839E30-F8F8-437E-86C2-7E92EA94372B")!, date: "Mar 11, 2024", units: 0.210, unitPrice: 53640.00)
            ]
        ),
        FinanceAsset(
            id: UUID(uuidString: "2B90ACF5-4B3D-4F57-9E70-A3363A1F515C")!,
            symbol: "ETH",
            name: "Ethereum",
            accent: Self.accent(for: "ETH"),
            currentPrice: 3520.25,
            transactions: [
                BuyTransaction(id: UUID(uuidString: "68BC655E-1F43-4D68-9227-78C4BAA5E7ED")!, date: "May 2, 2024", units: 1.200, unitPrice: 3120.40),
                BuyTransaction(id: UUID(uuidString: "8799CF8C-0E5F-4D5B-A706-C4AEB2282A28")!, date: "Feb 19, 2024", units: 2.000, unitPrice: 2860.00),
                BuyTransaction(id: UUID(uuidString: "A94A411C-1A2F-4F69-9D7A-4229964C5B17")!, date: "Nov 9, 2023", units: 1.500, unitPrice: 1978.22)
            ]
        )
    ]
}

#Preview {
    ContentView(summary: .default, assets: FinanceAsset.fixtures)
}
