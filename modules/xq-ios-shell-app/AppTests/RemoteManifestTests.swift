import XCTest
@testable import xq_ios_shell_app

final class RemoteManifestTests: XCTestCase {
    func testManifestDecodesAndValidates() throws {
        let data = """
        {
          "id": "portfolio-home",
          "version": "0.1.0",
          "runtimeVersion": "rn-shell-v1",
          "hostApiVersion": "1.0",
          "title": "Portfolio Home",
          "payload": {
            "kind": "react-native",
            "url": "http://127.0.0.1:8123/portfolio.ios.bundle",
            "moduleName": "PortfolioRemote"
          }
        }
        """.data(using: .utf8)!

        let manifest = try JSONDecoder().decode(RemoteManifest.self, from: data)
        let validated = try RemoteManifestValidator.validate(manifest, expectedRuntime: ShellConfig.runtimeVersion)

        XCTAssertEqual(validated.manifest.id, "portfolio-home")
        XCTAssertEqual(validated.manifest.payload.kind, .reactNative)
        XCTAssertEqual(validated.manifest.payload.moduleName, "PortfolioRemote")
    }

    func testManifestAcceptsReactNativeKind() throws {
        let manifest = RemoteManifest(
            id: "portfolio-home",
            version: "0.2.0",
            runtimeVersion: "rn-shell-v1",
            hostApiVersion: "1.0",
            title: "Portfolio Bundle",
            payload: .init(
                kind: .reactNative,
                url: URL(string: "http://127.0.0.1:8123/portfolio.ios.bundle")!,
                moduleName: "PortfolioRemote"
            )
        )

        let validated = try RemoteManifestValidator.validate(manifest, expectedRuntime: ShellConfig.runtimeVersion)

        XCTAssertEqual(validated.manifest.payload.kind, .reactNative)
    }

    func testManifestRejectsWrongRuntime() throws {
        let manifest = RemoteManifest(
            id: "portfolio-home",
            version: "0.1.0",
            runtimeVersion: "other-runtime",
            hostApiVersion: "1.0",
            title: "Portfolio Home",
            payload: .init(
                kind: .reactNative,
                url: URL(string: "http://127.0.0.1:8123/portfolio.ios.bundle")!,
                moduleName: "PortfolioRemote"
            )
        )

        XCTAssertThrowsError(
            try RemoteManifestValidator.validate(manifest, expectedRuntime: ShellConfig.runtimeVersion)
        ) { error in
            XCTAssertEqual(
                error as? RemoteManifestValidationError,
                .unsupportedRuntime(expected: "rn-shell-v1", actual: "other-runtime")
            )
        }
    }
}
