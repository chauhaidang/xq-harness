import Foundation

public struct ApplicationDescriptor: Equatable, Sendable {
    public let bundleIdentifier: String
    public let launchConfiguration: LaunchConfiguration

    public init(bundleIdentifier: String, launchConfiguration: LaunchConfiguration = .init()) {
        self.bundleIdentifier = bundleIdentifier
        self.launchConfiguration = launchConfiguration
    }
}

public struct LaunchConfiguration: Equatable, Sendable {
    public var arguments: [String]
    public var environment: [String: String]
    public var resetArguments: [String]

    public init(
        arguments: [String] = [],
        environment: [String: String] = [:],
        resetArguments: [String] = []
    ) {
        self.arguments = arguments
        self.environment = environment
        self.resetArguments = resetArguments
    }

    public func arguments(reset: Bool) -> [String] {
        reset ? arguments + resetArguments : arguments
    }
}
