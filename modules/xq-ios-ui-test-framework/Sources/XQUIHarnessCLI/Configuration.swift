import Foundation

struct UITestConfiguration: Codable, Equatable {
    static let supportedSchemaVersion = 1

    let schemaVersion: Int
    let project: String
    let scheme: String
    let bundleIdentifier: String
    let ipaEnvironmentVariable: String
    let resultDirectory: String
    let developmentTeam: String?

    static func load(from url: URL) throws -> Self {
        let configuration = try JSONDecoder().decode(Self.self, from: Data(contentsOf: url))
        guard configuration.schemaVersion == supportedSchemaVersion else {
            throw CLIError("Unsupported configuration schema version \(configuration.schemaVersion)")
        }
        guard !configuration.bundleIdentifier.isEmpty,
              !configuration.project.isEmpty,
              !configuration.scheme.isEmpty,
              !configuration.ipaEnvironmentVariable.isEmpty else {
            throw CLIError("Configuration contains an empty required value")
        }
        return configuration
    }

    func resolvingPaths(relativeTo directory: URL) -> Self {
        Self(
            schemaVersion: schemaVersion,
            project: Self.resolve(project, relativeTo: directory),
            scheme: scheme,
            bundleIdentifier: bundleIdentifier,
            ipaEnvironmentVariable: ipaEnvironmentVariable,
            resultDirectory: Self.resolve(resultDirectory, relativeTo: directory),
            developmentTeam: developmentTeam
        )
    }

    private static func resolve(_ path: String, relativeTo directory: URL) -> String {
        if path.hasPrefix("/") { return path }
        return directory.appendingPathComponent(path).standardizedFileURL.path
    }
}

struct CLIError: Error, CustomStringConvertible, Equatable {
    let description: String
    init(_ description: String) { self.description = description }
}
