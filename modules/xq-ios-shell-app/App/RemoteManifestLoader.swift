import Foundation

enum RemoteManifestLoaderError: LocalizedError {
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "The shell did not receive a valid HTTP response."
        }
    }
}

struct RemoteManifestLoader {
    func load(from url: URL) async throws -> RemoteManifest {
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let httpResponse = response as? HTTPURLResponse, 200 ..< 300 ~= httpResponse.statusCode else {
            throw RemoteManifestLoaderError.invalidResponse
        }

        return try JSONDecoder().decode(RemoteManifest.self, from: data)
    }
}
