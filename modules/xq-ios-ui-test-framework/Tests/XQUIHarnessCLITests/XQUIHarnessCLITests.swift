import Foundation
import XCTest
@testable import XQUIHarnessCLI

final class XQUIHarnessCLITests: XCTestCase {
    func testConfigurationRejectsUnsupportedSchema() throws {
        let url = try writeConfiguration(schemaVersion: 2)
        XCTAssertThrowsError(try UITestConfiguration.load(from: url)) { error in
            XCTAssertEqual(error as? CLIError, CLIError("Unsupported configuration schema version 2"))
        }
    }

    func testConfigurationResolvesRelativePaths() throws {
        let url = try writeConfiguration(schemaVersion: 1)
        let configuration = try UITestConfiguration.load(from: url)
            .resolvingPaths(relativeTo: url.deletingLastPathComponent())

        XCTAssertTrue(configuration.project.hasSuffix("App.xcodeproj"))
        XCTAssertTrue(configuration.resultDirectory.hasSuffix("build/results"))
    }

    func testDeviceSelectionRequiresExplicitIDWhenMultipleDevicesExist() {
        let devices = [
            ConnectedDevice(identifier: "one", name: "One"),
            ConnectedDevice(identifier: "two", name: "Two")
        ]

        XCTAssertThrowsError(try DeviceSelection.select(devices, requestedID: nil))
        XCTAssertEqual(try DeviceSelection.select(devices, requestedID: "two"), devices[1])
    }

    func testDeviceSelectionRejectsEmptyList() {
        XCTAssertThrowsError(try DeviceSelection.select([], requestedID: nil)) { error in
            XCTAssertEqual(error as? CLIError, CLIError("No connected physical iPhone found"))
        }
    }

    func testDeviceJSONDecodingFindsPhysicalIPhoneAndIgnoresSimulator() throws {
        let data = """
        {
          "result": {
            "devices": [
              {
                "identifier": "physical-id",
                "deviceProperties": { "name": "Test iPhone" },
                "hardwareProperties": { "platform": "iOS", "reality": "physical", "udid": "physical-udid" }
              },
              {
                "identifier": "sim-id",
                "deviceProperties": { "name": "iPhone Simulator" },
                "hardwareProperties": { "platform": "iOS", "reality": "simulator", "udid": "sim-udid" }
              }
            ]
          }
        }
        """.data(using: .utf8)!

        XCTAssertEqual(
            try DeviceDiscovery.decodeDevices(data),
            [ConnectedDevice(identifier: "physical-udid", name: "Test iPhone")]
        )
    }

    func testPreflightRejectsMissingIPAEnvironmentVariable() {
        let runner = FakeRunner(
            results: Array(repeating: CommandResult(exitCode: 0, output: Data()), count: 3) + [
                CommandResult(exitCode: 0, output: Data("3.2.1\n".utf8))
            ]
        )
        let orchestrator = TestOrchestrator(runner: runner, environment: [:])
        let configuration = UITestConfiguration(
            schemaVersion: 1,
            project: "/tmp/App.xcodeproj",
            scheme: "AppUITests",
            bundleIdentifier: "com.example.app",
            ipaEnvironmentVariable: "APP_IPA",
            resultDirectory: "/tmp/results",
            developmentTeam: nil
        )

        XCTAssertThrowsError(try orchestrator.preflight(configuration: configuration)) { error in
            XCTAssertEqual(error as? CLIError, CLIError("Missing environment variable APP_IPA"))
        }
    }

    func testArtifactValidationRejectsMissingIPAWithoutRunningCommands() {
        let runner = FakeRunner(results: [])
        let manager = ArtifactManager(runner: runner)

        XCTAssertThrowsError(
            try manager.validate(
                ipaURL: URL(fileURLWithPath: "/missing/app.ipa"),
                expectedBundleIdentifier: "com.example.app",
                temporaryDirectory: FileManager.default.temporaryDirectory
            )
        )
        XCTAssertTrue(runner.invocations.isEmpty)
    }

    func testArtifactValidationRejectsBundleMismatch() throws {
        let fixture = try ArtifactFixture(bundleIdentifier: "com.example.wrong")
        let runner = FakeRunner(results: [], onRun: fixture.handle)

        XCTAssertThrowsError(
            try ArtifactManager(runner: runner).validate(
                ipaURL: fixture.ipaURL,
                expectedBundleIdentifier: "com.example.app",
                temporaryDirectory: fixture.workURL
            )
        ) { error in
            XCTAssertEqual(
                error as? CLIError,
                CLIError("Bundle identifier mismatch: expected com.example.app, found com.example.wrong")
            )
        }
        XCTAssertFalse(runner.invocations.contains { $0.executable == "/usr/bin/codesign" })
    }

    func testArtifactValidationRejectsInvalidSignature() throws {
        let fixture = try ArtifactFixture(bundleIdentifier: "com.example.app", signatureExitCode: 1)
        let runner = FakeRunner(results: [], onRun: fixture.handle)

        XCTAssertThrowsError(
            try ArtifactManager(runner: runner).validate(
                ipaURL: fixture.ipaURL,
                expectedBundleIdentifier: "com.example.app",
                temporaryDirectory: fixture.workURL
            )
        ) { error in
            XCTAssertEqual(error as? CLIError, CLIError("Application signature is invalid: invalid signature"))
        }
    }

    func testRunRejectsInstallationFailureWithoutUninstalling() throws {
        let fixture = try OrchestratorFixture(installExitCode: 1, xcodeExitCode: 0)
        let runner = FakeRunner(results: [], onRun: fixture.handle)

        XCTAssertThrowsError(
            try TestOrchestrator(runner: runner, environment: ["APP_IPA": fixture.ipaURL.path])
                .run(configuration: fixture.configuration, requestedDeviceID: "device-1", suite: nil)
        ) { error in
            XCTAssertEqual(error as? CLIError, CLIError("Application update installation failed: install failed"))
        }
        XCTAssertFalse(runner.invocations.flatMap(\.arguments).contains("uninstall"))
        XCTAssertFalse(runner.invocations.contains { $0.executable == "/usr/bin/xcodebuild" })
    }

    func testRunBuildsSuiteCommandWritesReportsAndPropagatesXcodeExitCode() throws {
        let fixture = try OrchestratorFixture(installExitCode: 0, xcodeExitCode: 65)
        let runner = FakeRunner(results: [], onRun: fixture.handle)
        let exitCode = try TestOrchestrator(runner: runner, environment: ["APP_IPA": fixture.ipaURL.path])
            .run(
                configuration: fixture.configuration,
                requestedDeviceID: "device-1",
                suite: "AppUITests/PortfolioLifecycleTests"
            )

        XCTAssertEqual(exitCode, 65)
        let xcode = try XCTUnwrap(runner.invocations.first { $0.executable == "/usr/bin/xcodebuild" })
        XCTAssertTrue(xcode.arguments.contains("-only-testing:AppUITests/PortfolioLifecycleTests"))
        XCTAssertTrue(xcode.arguments.contains("platform=iOS,id=device-1"))
        XCTAssertTrue(xcode.arguments.contains("-allowProvisioningUpdates"))
        XCTAssertFalse(runner.invocations.flatMap(\.arguments).contains("uninstall"))

        let runURL = try XCTUnwrap(
            FileManager.default.contentsOfDirectory(
                at: fixture.resultsURL,
                includingPropertiesForKeys: nil
            ).first
        )
        XCTAssertTrue(FileManager.default.fileExists(atPath: runURL.appendingPathComponent("junit.xml").path))
        XCTAssertTrue(FileManager.default.fileExists(atPath: runURL.appendingPathComponent("xcodebuild.log").path))
        XCTAssertTrue(FileManager.default.fileExists(atPath: runURL.appendingPathComponent("xcbeautify.log").path))
        let metadata = try JSONDecoder.iso8601.decode(
            RunMetadata.self,
            from: Data(contentsOf: runURL.appendingPathComponent("run-metadata.json"))
        )
        XCTAssertEqual(metadata.exitCode, 65)
        XCTAssertEqual(metadata.deviceIdentifier, "device-1")
        XCTAssertEqual(metadata.suite, "AppUITests/PortfolioLifecycleTests")
    }

    private func writeConfiguration(schemaVersion: Int) throws -> URL {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let url = directory.appendingPathComponent("xq-ui-tests.json")
        let json = """
        {
          "schemaVersion": \(schemaVersion),
          "project": "App.xcodeproj",
          "scheme": "AppUITests",
          "bundleIdentifier": "com.example.app",
          "ipaEnvironmentVariable": "APP_IPA",
          "resultDirectory": "build/results"
        }
        """
        try Data(json.utf8).write(to: url)
        return url
    }
}

private final class FakeRunner: CommandRunning, @unchecked Sendable {
    struct Invocation: Equatable {
        let executable: String
        let arguments: [String]
    }

    private var results: [CommandResult]
    private let onRun: ((String, [String], URL?) throws -> CommandResult)?
    private(set) var invocations: [Invocation] = []

    init(
        results: [CommandResult],
        onRun: ((String, [String], URL?) throws -> CommandResult)? = nil
    ) {
        self.results = results
        self.onRun = onRun
    }

    func run(
        _ executable: String,
        arguments: [String],
        environment: [String: String]?,
        currentDirectory: URL?,
        input: Data?
    ) throws -> CommandResult {
        invocations.append(Invocation(executable: executable, arguments: arguments))
        if let onRun { return try onRun(executable, arguments, currentDirectory) }
        return results.isEmpty ? CommandResult(exitCode: 0, output: Data()) : results.removeFirst()
    }
}

private final class ArtifactFixture {
    let rootURL: URL
    let ipaURL: URL
    let workURL: URL
    let bundleIdentifier: String
    let signatureExitCode: Int32

    init(bundleIdentifier: String, signatureExitCode: Int32 = 0) throws {
        rootURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        ipaURL = rootURL.appendingPathComponent("app.ipa")
        workURL = rootURL.appendingPathComponent("work")
        self.bundleIdentifier = bundleIdentifier
        self.signatureExitCode = signatureExitCode
        try FileManager.default.createDirectory(at: workURL, withIntermediateDirectories: true)
        try Data().write(to: ipaURL)
    }

    func handle(_ executable: String, _ arguments: [String], _ currentDirectory: URL?) throws -> CommandResult {
        if executable == "/usr/bin/ditto" {
            let extractionURL = URL(fileURLWithPath: arguments.last!)
            let appURL = extractionURL.appendingPathComponent("Payload/Test.app")
            try FileManager.default.createDirectory(at: appURL, withIntermediateDirectories: true)
            let plist: [String: Any] = ["CFBundleIdentifier": bundleIdentifier]
            let data = try PropertyListSerialization.data(fromPropertyList: plist, format: .binary, options: 0)
            try data.write(to: appURL.appendingPathComponent("Info.plist"))
            return CommandResult(exitCode: 0, output: Data())
        }
        if executable == "/usr/bin/codesign" {
            return CommandResult(
                exitCode: signatureExitCode,
                output: signatureExitCode == 0 ? Data() : Data("invalid signature".utf8)
            )
        }
        return CommandResult(exitCode: 0, output: Data())
    }
}

private final class OrchestratorFixture {
    let rootURL: URL
    let ipaURL: URL
    let resultsURL: URL
    let configuration: UITestConfiguration
    private let installExitCode: Int32
    private let xcodeExitCode: Int32

    init(installExitCode: Int32, xcodeExitCode: Int32) throws {
        rootURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        ipaURL = rootURL.appendingPathComponent("app.ipa")
        resultsURL = rootURL.appendingPathComponent("results")
        self.installExitCode = installExitCode
        self.xcodeExitCode = xcodeExitCode
        configuration = UITestConfiguration(
            schemaVersion: 1,
            project: rootURL.appendingPathComponent("App.xcodeproj").path,
            scheme: "AppUITests",
            bundleIdentifier: "com.example.app",
            ipaEnvironmentVariable: "APP_IPA",
            resultDirectory: resultsURL.path,
            developmentTeam: "TEAM123"
        )
        try FileManager.default.createDirectory(at: rootURL, withIntermediateDirectories: true)
        try Data().write(to: ipaURL)
    }

    func handle(_ executable: String, _ arguments: [String], _ currentDirectory: URL?) throws -> CommandResult {
        if executable == "/usr/bin/env", arguments.first == "which" {
            return CommandResult(exitCode: 0, output: Data())
        }
        if executable == "/usr/bin/env", arguments == ["xcbeautify", "--version"] {
            return CommandResult(exitCode: 0, output: Data("3.2.1\n".utf8))
        }
        if executable == "/usr/bin/xcrun", arguments.prefix(3) == ["devicectl", "list", "devices"] {
            let outputIndex = arguments.firstIndex(of: "--json-output")!
            let outputURL = URL(fileURLWithPath: arguments[outputIndex + 1])
            let json = """
            {"result":{"devices":[{"deviceProperties":{"name":"Fixture iPhone"},"hardwareProperties":{"platform":"iOS","reality":"physical","udid":"device-1"}}]}}
            """
            try Data(json.utf8).write(to: outputURL)
            return CommandResult(exitCode: 0, output: Data())
        }
        if executable == "/usr/bin/ditto" {
            let extractionURL = URL(fileURLWithPath: arguments.last!)
            let appURL = extractionURL.appendingPathComponent("Payload/Test.app")
            try FileManager.default.createDirectory(at: appURL, withIntermediateDirectories: true)
            let plist = ["CFBundleIdentifier": "com.example.app"]
            let data = try PropertyListSerialization.data(fromPropertyList: plist, format: .binary, options: 0)
            try data.write(to: appURL.appendingPathComponent("Info.plist"))
            return CommandResult(exitCode: 0, output: Data())
        }
        if executable == "/usr/bin/xcrun", arguments.prefix(4) == ["devicectl", "device", "install", "app"] {
            return CommandResult(
                exitCode: installExitCode,
                output: installExitCode == 0 ? Data() : Data("install failed".utf8)
            )
        }
        if executable == "/usr/bin/xcodebuild" {
            return CommandResult(exitCode: xcodeExitCode, output: Data("xcode output".utf8))
        }
        if executable == "/usr/bin/env", arguments.first == "xcbeautify" {
            let reportURL = currentDirectory!.appendingPathComponent("build/reports")
            try FileManager.default.createDirectory(at: reportURL, withIntermediateDirectories: true)
            try Data("<testsuites/>".utf8).write(to: reportURL.appendingPathComponent("junit.xml"))
            return CommandResult(exitCode: 0, output: Data("report output".utf8))
        }
        return CommandResult(exitCode: 0, output: Data())
    }
}

private extension JSONDecoder {
    static var iso8601: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}
