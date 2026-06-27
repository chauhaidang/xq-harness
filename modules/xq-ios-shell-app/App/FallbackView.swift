import SwiftUI

struct FallbackView: View {
    let reason: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fallback shell")
                .font(.title2.weight(.semibold))
            Text(reason)
                .foregroundStyle(.secondary)
            Divider()
            Text("This proves the shell can continue rendering even when the remote payload is unavailable or incompatible.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(20)
        .background(Color(.secondarySystemBackground))
    }
}
