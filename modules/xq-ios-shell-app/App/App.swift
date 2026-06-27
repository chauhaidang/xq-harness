import SwiftUI

@main
struct XQIOSShellApp: App {
    var body: some Scene {
        WindowGroup {
            ShellView(viewModel: ShellViewModel())
        }
    }
}
