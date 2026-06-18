// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "XQUIHarness",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "XQUIHarness", targets: ["XQUIHarness"]),
        .executable(name: "xq-ui-test", targets: ["XQUIHarnessCLI"])
    ],
    targets: [
        .target(name: "XQUIHarness"),
        .executableTarget(name: "XQUIHarnessCLI"),
        .testTarget(name: "XQUIHarnessTests", dependencies: ["XQUIHarness"]),
        .testTarget(name: "XQUIHarnessCLITests", dependencies: ["XQUIHarnessCLI"])
    ],
    swiftLanguageVersions: [.v5]
)
