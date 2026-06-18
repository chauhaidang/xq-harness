import Foundation

struct ConnectedDevice: Codable, Equatable, Sendable {
    let identifier: String
    let name: String
}

enum DeviceSelection {
    static func select(_ devices: [ConnectedDevice], requestedID: String?) throws -> ConnectedDevice {
        if let requestedID {
            guard let device = devices.first(where: { $0.identifier == requestedID }) else {
                throw CLIError("Requested device \(requestedID) is not connected")
            }
            return device
        }
        guard devices.count == 1 else {
            if devices.isEmpty { throw CLIError("No connected physical iPhone found") }
            throw CLIError("Multiple physical iPhones are connected; pass --device")
        }
        return devices[0]
    }
}

struct DeviceDiscovery {
    let runner: CommandRunning

    func connectedDevices(temporaryDirectory: URL) throws -> [ConnectedDevice] {
        let outputURL = temporaryDirectory.appendingPathComponent("devices.json")
        let result = try runner.run(
            "/usr/bin/xcrun",
            arguments: ["devicectl", "list", "devices", "--json-output", outputURL.path],
            environment: nil,
            currentDirectory: nil,
            input: nil
        )
        guard result.exitCode == 0 else { throw CLIError("devicectl failed: \(result.text)") }
        return try Self.decodeDevices(Data(contentsOf: outputURL))
    }

    static func decodeDevices(_ data: Data) throws -> [ConnectedDevice] {
        let response = try JSONDecoder().decode(DeviceListResponse.self, from: data)
        return response.result.devices.compactMap { device in
            guard device.hardwareProperties.platform == "iOS",
                  device.hardwareProperties.reality == "physical" else { return nil }
            return ConnectedDevice(identifier: device.hardwareProperties.udid, name: device.deviceProperties.name)
        }
    }
}

private struct DeviceListResponse: Decodable {
    let result: Result

    struct Result: Decodable {
        let devices: [Device]
    }

    struct Device: Decodable {
        let deviceProperties: DeviceProperties
        let hardwareProperties: HardwareProperties
    }

    struct DeviceProperties: Decodable {
        let name: String
    }

    struct HardwareProperties: Decodable {
        let platform: String
        let reality: String
        let udid: String
    }
}
