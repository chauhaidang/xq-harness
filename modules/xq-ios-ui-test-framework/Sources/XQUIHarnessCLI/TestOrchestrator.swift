import Foundation

struct RunMetadata: Codable, Equatable {
    let bundleIdentifier: String
    let deviceIdentifier: String
    let deviceName: String
    let ipaPath: String
    let suite: String?
    let startedAt: Date
    let exitCode: Int32
}

struct TestOrchestrator {
    let runner: CommandRunning
    let environment: [String: String]
    let fileManager: FileManager

    init(runner: CommandRunning, environment: [String: String] = ProcessInfo.processInfo.environment, fileManager: FileManager = .default) {
        self.runner = runner
        self.environment = environment
        self.fileManager = fileManager
    }

    func preflight(configuration: UITestConfiguration) throws {
        for executable in ["xcodebuild", "xcrun", "xcbeautify"] {
            let result = try runner.run(
                "/usr/bin/env",
                arguments: ["which", executable],
                environment: nil,
                currentDirectory: nil,
                input: nil
            )
            guard result.exitCode == 0 else { throw CLIError("Required executable not found: \(executable)") }
        }
        let xcbeautifyVersion = try runner.run(
            "/usr/bin/env",
            arguments: ["xcbeautify", "--version"],
            environment: nil,
            currentDirectory: nil,
            input: nil
        )
        guard xcbeautifyVersion.exitCode == 0,
              xcbeautifyVersion.text.trimmingCharacters(in: .whitespacesAndNewlines) == "3.2.1" else {
            throw CLIError("xcbeautify 3.2.1 is required")
        }
        guard environment[configuration.ipaEnvironmentVariable]?.isEmpty == false else {
            throw CLIError("Missing environment variable \(configuration.ipaEnvironmentVariable)")
        }
    }

    func run(configuration: UITestConfiguration, requestedDeviceID: String?, suite: String?) throws -> Int32 {
        try preflight(configuration: configuration)
        let startedAt = Date()
        let runID = ISO8601DateFormatter().string(from: startedAt).replacingOccurrences(of: ":", with: "-")
        let resultURL = URL(fileURLWithPath: configuration.resultDirectory).appendingPathComponent(runID)
        let temporaryURL = resultURL.appendingPathComponent("work")
        try fileManager.createDirectory(at: temporaryURL, withIntermediateDirectories: true)

        let devices = try DeviceDiscovery(runner: runner).connectedDevices(temporaryDirectory: temporaryURL)
        let device = try DeviceSelection.select(devices, requestedID: requestedDeviceID)
        let ipaPath = environment[configuration.ipaEnvironmentVariable]!
        let application = try ArtifactManager(runner: runner).validate(
            ipaURL: URL(fileURLWithPath: ipaPath),
            expectedBundleIdentifier: configuration.bundleIdentifier,
            temporaryDirectory: temporaryURL
        )

        let install = try runner.run(
            "/usr/bin/xcrun",
            arguments: ["devicectl", "device", "install", "app", "--device", device.identifier, application.bundleURL.path],
            environment: nil,
            currentDirectory: nil,
            input: nil
        )
        guard install.exitCode == 0 else { throw CLIError("Application update installation failed: \(install.text)") }

        var arguments = [
            "-project", configuration.project,
            "-scheme", configuration.scheme,
            "-destination", "platform=iOS,id=\(device.identifier)",
            "-resultBundlePath", resultURL.appendingPathComponent("result.xcresult").path,
            "-allowProvisioningUpdates"
        ]
        if let suite { arguments += ["-only-testing:\(suite)"] }
        if let developmentTeam = configuration.developmentTeam {
            arguments.append("DEVELOPMENT_TEAM=\(developmentTeam)")
        }
        arguments.append("test")

        let xcode = try runner.run(
            "/usr/bin/xcodebuild",
            arguments: arguments,
            environment: ["NSUnbufferedIO": "YES"],
            currentDirectory: nil,
            input: nil
        )
        try xcode.output.write(to: resultURL.appendingPathComponent("xcodebuild.log"), options: .atomic)

        let report = try runner.run(
            "/usr/bin/env",
            arguments: ["xcbeautify", "--report", "junit"],
            environment: nil,
            currentDirectory: resultURL,
            input: xcode.output
        )
        try report.output.write(to: resultURL.appendingPathComponent("xcbeautify.log"), options: .atomic)

        let generatedJUnit = resultURL.appendingPathComponent("build/reports/junit.xml")
        let targetJUnit = resultURL.appendingPathComponent("junit.xml")
        if fileManager.fileExists(atPath: generatedJUnit.path) {
            try fileManager.moveItem(at: generatedJUnit, to: targetJUnit)
        }

        let metadata = RunMetadata(
            bundleIdentifier: configuration.bundleIdentifier,
            deviceIdentifier: device.identifier,
            deviceName: device.name,
            ipaPath: ipaPath,
            suite: suite,
            startedAt: startedAt,
            exitCode: xcode.exitCode
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        try encoder.encode(metadata).write(to: resultURL.appendingPathComponent("run-metadata.json"), options: .atomic)

        if xcode.exitCode == 0, report.exitCode != 0 { return report.exitCode }
        return xcode.exitCode
    }
}
