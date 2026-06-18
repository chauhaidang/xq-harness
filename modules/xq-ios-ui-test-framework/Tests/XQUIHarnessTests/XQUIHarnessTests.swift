import XCTest
@testable import XQUIHarness

final class XQUIHarnessTests: XCTestCase {
    func testLaunchConfigurationAddsResetArgumentsOnlyWhenRequested() {
        let configuration = LaunchConfiguration(
            arguments: ["--ui-testing"],
            environment: ["MODE": "test"],
            resetArguments: ["--reset-test-data"]
        )

        XCTAssertEqual(configuration.arguments(reset: false), ["--ui-testing"])
        XCTAssertEqual(configuration.arguments(reset: true), ["--ui-testing", "--reset-test-data"])
        XCTAssertEqual(configuration.environment, ["MODE": "test"])
    }

    func testApplicationDescriptorKeepsBundleIdentifierAndLaunchConfiguration() {
        let launch = LaunchConfiguration(arguments: ["--test"])
        let descriptor = ApplicationDescriptor(bundleIdentifier: "com.example.app", launchConfiguration: launch)

        XCTAssertEqual(descriptor.bundleIdentifier, "com.example.app")
        XCTAssertEqual(descriptor.launchConfiguration, launch)
    }
}
