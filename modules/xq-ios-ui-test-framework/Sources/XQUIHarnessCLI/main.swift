import Foundation

private struct Arguments {
    let command: String
    let configPath: String?
    let deviceID: String?
    let suite: String?

    init(_ values: [String]) throws {
        guard let command = values.first else { throw CLIError(Self.usage) }
        self.command = command
        var configPath: String?
        var deviceID: String?
        var suite: String?
        var index = 1
        while index < values.count {
            guard index + 1 < values.count else { throw CLIError(Self.usage) }
            switch values[index] {
            case "--config": configPath = values[index + 1]
            case "--device": deviceID = values[index + 1]
            case "--suite": suite = values[index + 1]
            default: throw CLIError("Unknown argument \(values[index])\n\(Self.usage)")
            }
            index += 2
        }
        self.configPath = configPath
        self.deviceID = deviceID
        self.suite = suite
    }

    static let usage = "Usage: xq-ui-test <preflight|devices|run> --config <path> [--device <udid>] [--suite <target/class>]"
}

do {
    let arguments = try Arguments(Array(CommandLine.arguments.dropFirst()))
    let runner = SystemCommandRunner()

    switch arguments.command {
    case "devices":
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let devices = try DeviceDiscovery(runner: runner).connectedDevices(temporaryDirectory: directory)
        devices.forEach { print("\($0.identifier)\t\($0.name)") }
    case "preflight", "run":
        guard let configPath = arguments.configPath else { throw CLIError(Arguments.usage) }
        let configURL = URL(fileURLWithPath: configPath).standardizedFileURL
        let configuration = try UITestConfiguration.load(from: configURL)
            .resolvingPaths(relativeTo: configURL.deletingLastPathComponent())
        let orchestrator = TestOrchestrator(runner: runner)
        if arguments.command == "preflight" {
            try orchestrator.preflight(configuration: configuration)
            print("Preflight passed")
        } else {
            exit(try orchestrator.run(configuration: configuration, requestedDeviceID: arguments.deviceID, suite: arguments.suite))
        }
    default:
        throw CLIError(Arguments.usage)
    }
} catch {
    fputs("xq-ui-test: \(error)\n", stderr)
    exit(1)
}
