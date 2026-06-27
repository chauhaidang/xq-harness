import Foundation

@MainActor
final class ShellViewModel: ObservableObject {
    @Published var manifestURLText: String
    @Published private(set) var state: ShellState
    @Published private(set) var events: [ShellEvent]
    @Published private(set) var renderedPayload: RenderedPayload?
    @Published private(set) var remoteTitle: String

    private let loader: RemoteManifestLoader

    init(loader: RemoteManifestLoader = RemoteManifestLoader()) {
        self.loader = loader
        self.manifestURLText = ShellConfig.defaultManifestURL
        self.state = .idle
        self.events = []
        self.remoteTitle = "No remote payload loaded"
    }

    func loadRemotePayload() async {
        guard let manifestURL = URL(string: manifestURLText) else {
            state = .failed("Manifest URL is invalid.")
            appendEvent("Rejected invalid manifest URL.")
            return
        }

        state = .loading
        appendEvent("Fetching manifest from \(manifestURL.absoluteString)")

        do {
            let manifest = try await loader.load(from: manifestURL)
            let validated = try RemoteManifestValidator.validate(
                manifest,
                expectedRuntime: ShellConfig.runtimeVersion
            )

            guard let renderedPayload = Self.renderedPayload(from: validated.manifest) else {
                state = .failed("React Native payload is missing moduleName.")
                appendEvent("Load failed: React Native payload is missing moduleName.")
                return
            }

            self.renderedPayload = renderedPayload
            remoteTitle = validated.manifest.title
            state = .loaded(validated.manifest)
            appendEvent(
                "Loaded \(validated.manifest.id) \(validated.manifest.version) as \(validated.manifest.payload.kind.rawValue)"
            )
        } catch {
            renderedPayload = nil
            state = .failed(error.localizedDescription)
            appendEvent("Load failed: \(error.localizedDescription)")
        }
    }

    func receiveBridgeMessage(_ message: String) {
        appendEvent("Remote payload: \(message)")
    }

    private func appendEvent(_ message: String) {
        events.insert(ShellEvent(timestamp: Date(), message: message), at: 0)
    }

    private static func renderedPayload(from manifest: RemoteManifest) -> RenderedPayload? {
        switch manifest.payload.kind {
        case .reactNative:
            guard let moduleName = manifest.payload.moduleName, !moduleName.isEmpty else {
                return nil
            }

            return .reactNative(
                .init(
                    moduleName: moduleName,
                    bundleURL: manifest.payload.url,
                    initialProperties: [
                        "manifestId": manifest.id,
                        "payloadVersion": manifest.version,
                        "hostApiVersion": manifest.hostApiVersion,
                        "runtimeVersion": manifest.runtimeVersion
                    ]
                )
            )
        }
    }
}

enum ShellState: Equatable {
    case idle
    case loading
    case loaded(RemoteManifest)
    case failed(String)

    var statusText: String {
        switch self {
        case .idle:
            return "Waiting for manifest"
        case .loading:
            return "Loading remote payload"
        case let .loaded(manifest):
            return "Loaded \(manifest.id) @ \(manifest.version)"
        case let .failed(message):
            return "Fallback active: \(message)"
        }
    }
}
