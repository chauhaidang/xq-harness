import SwiftUI

#if canImport(React) && canImport(React_RCTAppDelegate) && canImport(ReactAppDependencyProvider)
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
#endif

enum ReactNativeHostConfig {
    static let moduleName = "XQFinance"
}

struct ReactNativeHostView: View {
    var body: some View {
        #if canImport(React) && canImport(React_RCTAppDelegate) && canImport(ReactAppDependencyProvider)
        ReactNativeRootHostView()
        #else
        ReactNativeRuntimeUnavailableView()
        #endif
    }
}

#if canImport(React) && canImport(React_RCTAppDelegate) && canImport(ReactAppDependencyProvider)
private struct ReactNativeRootHostView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> UIView {
        let delegate = XQFinanceReactNativeFactoryDelegate()
        delegate.dependencyProvider = RCTAppDependencyProvider()

        let factory = RCTReactNativeFactory(delegate: delegate)
        context.coordinator.delegate = delegate
        context.coordinator.factory = factory

        return factory.rootViewFactory.view(
            withModuleName: ReactNativeHostConfig.moduleName,
            initialProperties: nil
        )
    }

    func updateUIView(_ uiView: UIView, context: Context) {}

    final class Coordinator {
        var factory: RCTReactNativeFactory?
        var delegate: XQFinanceReactNativeFactoryDelegate?
    }
}

private final class XQFinanceReactNativeFactoryDelegate: RCTDefaultReactNativeFactoryDelegate {
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        bundleURL()
    }

    override func bundleURL() -> URL? {
        if let embedded = Bundle.main.url(forResource: "main", withExtension: "jsbundle") {
            return embedded
        }
        #if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
        return nil
        #endif
    }
}
#endif

private struct ReactNativeRuntimeUnavailableView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("React Native runtime unavailable")
                .font(.headline)
            Text(
                "Run npm install and bundle exec pod install from modules/ios-xq-finance-app, " +
                "then build through ios-xq-finance-app.xcworkspace."
            )
            .font(.footnote)
            .foregroundStyle(.secondary)
        }
        .padding(24)
    }
}
