import XCTest

enum TestApplication {
    static let descriptor = ApplicationDescriptor(
        bundleIdentifier: "com.xq.fitness.ios-xq-fitness-app",
        launchConfiguration: LaunchConfiguration(
            arguments: ["--xq-ui-testing"],
            resetArguments: ["--xq-ui-testing-reset"]
        )
    )
}

@MainActor
class FitnessUITestCase: BaseUITestCase {
    var fitnessApp: XCUIApplication {
        guard let application else {
            preconditionFailure("Fitness UI tests must launch through shared setUp")
        }
        return application
    }

    override func setUp() {
        super.setUp()
        continueAfterFailure = false

        let app = launchApplication(TestApplication.descriptor, reset: true)
        RoutineListScreen(application: app).emptyState.requireExistence()
    }

    @discardableResult
    func relaunchPreservingTestData() -> XCUIApplication {
        relaunchApplication(TestApplication.descriptor)
    }

    @discardableResult
    func resetToCleanState() -> XCUIApplication {
        let app = relaunchApplication(TestApplication.descriptor, reset: true)
        RoutineListScreen(application: app).emptyState.requireExistence()
        return app
    }
}
