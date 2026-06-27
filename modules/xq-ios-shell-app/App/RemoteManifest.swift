import Foundation

struct RemoteManifest: Decodable, Equatable {
    struct Payload: Decodable, Equatable {
        let kind: PayloadKind
        let url: URL
        let moduleName: String?
    }

    let id: String
    let version: String
    let runtimeVersion: String
    let hostApiVersion: String
    let title: String
    let payload: Payload
}

enum PayloadKind: String, Decodable, Equatable {
    case reactNative = "react-native"
}

struct ValidatedRemoteManifest: Equatable {
    let manifest: RemoteManifest
}

enum RemoteManifestValidationError: LocalizedError, Equatable {
    case unsupportedRuntime(expected: String, actual: String)
    case unsupportedPayloadKind(String)

    var errorDescription: String? {
        switch self {
        case let .unsupportedRuntime(expected, actual):
            return "Runtime mismatch. Expected \(expected), got \(actual)."
        case let .unsupportedPayloadKind(kind):
            return "Unsupported payload kind \(kind)."
        }
    }
}

enum RemoteManifestValidator {
    static func validate(_ manifest: RemoteManifest, expectedRuntime: String) throws -> ValidatedRemoteManifest {
        guard manifest.runtimeVersion == expectedRuntime else {
            throw RemoteManifestValidationError.unsupportedRuntime(
                expected: expectedRuntime,
                actual: manifest.runtimeVersion
            )
        }

        return ValidatedRemoteManifest(manifest: manifest)
    }
}
