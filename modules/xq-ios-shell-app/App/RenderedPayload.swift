import Foundation

enum RenderedPayload: Equatable {
    struct ReactNative: Equatable {
        let moduleName: String
        let bundleURL: URL
        let initialProperties: [String: String]
    }

    case reactNative(ReactNative)
}
