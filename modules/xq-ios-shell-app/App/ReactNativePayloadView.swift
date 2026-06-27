import SwiftUI

#if canImport(React) && canImport(React_RCTAppDelegate) && canImport(ReactAppDependencyProvider)
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
#endif

struct ReactNativePayloadView: View {
    let payload: RenderedPayload.ReactNative
    let onEvent: (String) -> Void

    var body: some View {
        #if canImport(React) && canImport(React_RCTAppDelegate) && canImport(ReactAppDependencyProvider)
        ReactNativeRootView(payload: payload)
            .onAppear {
                onEvent("React Native runtime mounted \(payload.moduleName).")
            }
        #else
        ReactNativeRuntimeUnavailableView(payload: payload)
            .onAppear {
                onEvent("React Native runtime is not linked into this shell build.")
            }
        #endif
    }
}

#if canImport(React) && canImport(React_RCTAppDelegate) && canImport(ReactAppDependencyProvider)
private struct ReactNativeRootView: UIViewRepresentable {
    let payload: RenderedPayload.ReactNative

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> UIView {
        let delegate = ReactNativeFactoryDelegate(bundleURL: payload.bundleURL)
        delegate.dependencyProvider = RCTAppDependencyProvider()

        let factory = RCTReactNativeFactory(delegate: delegate)
        context.coordinator.delegate = delegate
        context.coordinator.factory = factory

        return factory.rootViewFactory.view(
            withModuleName: payload.moduleName,
            initialProperties: payload.initialProperties
        )
    }

    func updateUIView(_ uiView: UIView, context: Context) {}

    final class Coordinator {
        var factory: RCTReactNativeFactory?
        var delegate: ReactNativeFactoryDelegate?
    }
}

private final class ReactNativeFactoryDelegate: RCTDefaultReactNativeFactoryDelegate {
    private let remoteBundleURL: URL

    init(bundleURL: URL) {
        self.remoteBundleURL = bundleURL
        super.init()
    }

    override func sourceURL(for bridge: RCTBridge) -> URL? {
        bundleURL()
    }

    override func bundleURL() -> URL? {
        remoteBundleURL
    }
}
#endif

private struct ReactNativeRuntimeUnavailableView: View {
    let payload: RenderedPayload.ReactNative

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("React Native runtime unavailable")
                .font(.title2.weight(.semibold))
            Text("The manifest is valid, but this shell binary was built without React Native linked.")
                .foregroundStyle(.secondary)

            Divider()

            LabeledContent("Module", value: payload.moduleName)
            LabeledContent("Bundle", value: payload.bundleURL.absoluteString)
                .font(.footnote.monospaced())

            Text("Link React Native into the iOS target, then this adapter can mount the remote bundle with RCTRootView.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(20)
        .background(Color(.secondarySystemBackground))
    }
}
