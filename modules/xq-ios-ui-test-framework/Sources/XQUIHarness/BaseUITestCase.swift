import XCTest

@MainActor
open class BaseUITestCase: XCTestCase {
    public private(set) var application: XCUIApplication?

    @discardableResult
    public func launchApplication(
        _ descriptor: ApplicationDescriptor,
        reset: Bool = false
    ) -> XCUIApplication {
        let app = XCUIApplication(bundleIdentifier: descriptor.bundleIdentifier)
        app.launchArguments = descriptor.launchConfiguration.arguments(reset: reset)
        app.launchEnvironment = descriptor.launchConfiguration.environment
        app.launch()
        application = app
        return app
    }

    @discardableResult
    public func relaunchApplication(
        _ descriptor: ApplicationDescriptor,
        reset: Bool = false
    ) -> XCUIApplication {
        application?.terminate()
        return launchApplication(descriptor, reset: reset)
    }

    public func captureScreenshot(named name: String) {
        guard let application else {
            XCTFail("Cannot capture a screenshot before launching an application")
            return
        }
        let attachment = XCTAttachment(screenshot: application.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    open override func tearDown() {
        application?.terminate()
        application = nil
        super.tearDown()
    }

    open override func record(_ issue: XCTIssue) {
        if let application {
            captureScreenshot(named: "Failure - \(name)")

            let hierarchy = XCTAttachment(string: application.debugDescription)
            hierarchy.name = "Accessibility hierarchy"
            hierarchy.lifetime = .keepAlways
            add(hierarchy)
        }
        super.record(issue)
    }
}
