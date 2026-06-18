import Foundation

struct CommandResult: Equatable {
    let exitCode: Int32
    let output: Data

    var text: String { String(decoding: output, as: UTF8.self) }
}

protocol CommandRunning {
    func run(
        _ executable: String,
        arguments: [String],
        environment: [String: String]?,
        currentDirectory: URL?,
        input: Data?
    ) throws -> CommandResult
}

struct SystemCommandRunner: CommandRunning {
    func run(
        _ executable: String,
        arguments: [String],
        environment: [String: String]? = nil,
        currentDirectory: URL? = nil,
        input: Data? = nil
    ) throws -> CommandResult {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = arguments
        process.currentDirectoryURL = currentDirectory
        if let environment {
            process.environment = ProcessInfo.processInfo.environment.merging(environment) { _, new in new }
        }

        let output = Pipe()
        process.standardOutput = output
        process.standardError = output
        if let input {
            let stdin = Pipe()
            process.standardInput = stdin
            try process.run()
            stdin.fileHandleForWriting.write(input)
            try stdin.fileHandleForWriting.close()
        } else {
            try process.run()
        }

        let data = output.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()
        return CommandResult(exitCode: process.terminationStatus, output: data)
    }
}
