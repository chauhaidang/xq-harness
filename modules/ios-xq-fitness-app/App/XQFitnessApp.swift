import FitnessCore
import SwiftUI

@main
struct XQFitnessApp: App {
    private let bootstrap = FitnessBootstrap.make()

    var body: some Scene {
        WindowGroup {
            switch bootstrap {
            case .loaded(let store):
                FitnessRootView(store: store)
            case .failed(let message):
                PersistenceFailureView(message: message)
            }
        }
    }
}

private enum FitnessBootstrap {
    case loaded(FitnessStore)
    case failed(String)

    static func make(
        arguments: [String] = CommandLine.arguments,
        fileManager: FileManager = .default
    ) -> FitnessBootstrap {
        do {
            guard let applicationSupport = fileManager.urls(
                for: .applicationSupportDirectory,
                in: .userDomainMask
            ).first else {
                return .failed("Application Support is unavailable on this device.")
            }

            let directory = FitnessStorage.directory(
                baseURL: applicationSupport,
                arguments: arguments
            )
            try FitnessStorage.resetUITestDataIfRequested(
                directory: directory,
                arguments: arguments,
                fileManager: fileManager
            )
            let persistence = JSONFitnessPersistence(directory: directory)
            return .loaded(try FitnessStore(persistence: persistence))
        } catch {
            return .failed(error.localizedDescription)
        }
    }
}

private struct PersistenceFailureView: View {
    let message: String

    var body: some View {
        ContentUnavailableView(
            "Fitness Data Unavailable",
            systemImage: "externaldrive.badge.exclamationmark",
            description: Text(message)
        )
        .padding()
    }
}
