import Foundation

struct ValidatedApplication: Equatable {
    let bundleURL: URL
    let bundleIdentifier: String
}

struct ArtifactManager {
    let runner: CommandRunning
    let fileManager: FileManager

    init(runner: CommandRunning, fileManager: FileManager = .default) {
        self.runner = runner
        self.fileManager = fileManager
    }

    func validate(ipaURL: URL, expectedBundleIdentifier: String, temporaryDirectory: URL) throws -> ValidatedApplication {
        guard fileManager.fileExists(atPath: ipaURL.path) else { throw CLIError("IPA not found at \(ipaURL.path)") }
        let extractionURL = temporaryDirectory.appendingPathComponent("ipa")
        try fileManager.createDirectory(at: extractionURL, withIntermediateDirectories: true)
        let extraction = try runner.run(
            "/usr/bin/ditto",
            arguments: ["-x", "-k", ipaURL.path, extractionURL.path],
            environment: nil,
            currentDirectory: nil,
            input: nil
        )
        guard extraction.exitCode == 0 else { throw CLIError("Unable to extract IPA: \(extraction.text)") }

        let payloadURL = extractionURL.appendingPathComponent("Payload")
        let appURL = try fileManager.contentsOfDirectory(at: payloadURL, includingPropertiesForKeys: nil)
            .first { $0.pathExtension == "app" }
        guard let appURL else { throw CLIError("IPA does not contain an application bundle") }

        let plistURL = appURL.appendingPathComponent("Info.plist")
        let plist = try PropertyListSerialization.propertyList(from: Data(contentsOf: plistURL), format: nil) as? [String: Any]
        guard let bundleIdentifier = plist?["CFBundleIdentifier"] as? String else {
            throw CLIError("Application Info.plist has no bundle identifier")
        }
        guard bundleIdentifier == expectedBundleIdentifier else {
            throw CLIError("Bundle identifier mismatch: expected \(expectedBundleIdentifier), found \(bundleIdentifier)")
        }

        let signature = try runner.run(
            "/usr/bin/codesign",
            arguments: ["--verify", "--deep", "--strict", appURL.path],
            environment: nil,
            currentDirectory: nil,
            input: nil
        )
        guard signature.exitCode == 0 else { throw CLIError("Application signature is invalid: \(signature.text)") }
        return ValidatedApplication(bundleURL: appURL, bundleIdentifier: bundleIdentifier)
    }
}
