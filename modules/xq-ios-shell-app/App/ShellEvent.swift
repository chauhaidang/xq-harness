import Foundation

struct ShellEvent: Identifiable, Equatable {
    let id = UUID()
    let timestamp: Date
    let message: String
}
