import XQUIHarness

enum TestApplication {
    static let descriptor = ApplicationDescriptor(
        bundleIdentifier: "com.xq.finance.ios-xq-finance-app",
        launchConfiguration: LaunchConfiguration(
            arguments: ["--xq-ui-testing"],
            resetArguments: ["--xq-ui-testing-reset"]
        )
    )
}
