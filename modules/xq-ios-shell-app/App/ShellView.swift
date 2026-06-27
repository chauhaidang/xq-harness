import SwiftUI

struct ShellView: View {
    @StateObject var viewModel: ShellViewModel

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                configPanel
                payloadPanel
                eventPanel
            }
            .padding(16)
            .navigationTitle("XQ iOS Shell")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var configPanel: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Remote manifest")
                .font(.headline)

            TextField("Manifest URL", text: $viewModel.manifestURLText)
                .textFieldStyle(.roundedBorder)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .font(.footnote.monospaced())

            HStack {
                Text("Runtime: \(ShellConfig.runtimeVersion)")
                    .font(.footnote.monospaced())
                    .foregroundStyle(.secondary)
                Spacer()
                Button("Load payload") {
                    Task {
                        await viewModel.loadRemotePayload()
                    }
                }
                .buttonStyle(.borderedProminent)
            }

            Text(viewModel.state.statusText)
                .font(.footnote)
                .foregroundStyle(statusColor)
        }
        .padding(16)
        .background(Color(.tertiarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    @ViewBuilder
    private var payloadPanel: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(viewModel.remoteTitle)
                .font(.headline)

            Group {
                if let payload = viewModel.renderedPayload {
                    payloadView(for: payload)
                } else {
                    FallbackView(reason: viewModel.state.statusText)
                }
            }
            .frame(minHeight: 320)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay {
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(.separator), lineWidth: 1)
            }
        }
    }

    @ViewBuilder
    private func payloadView(for payload: RenderedPayload) -> some View {
        switch payload {
        case let .reactNative(reactNativePayload):
            ReactNativePayloadView(payload: reactNativePayload) { message in
                viewModel.receiveBridgeMessage(message)
            }
        }
    }

    private var eventPanel: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Shell events")
                .font(.headline)

            ScrollView {
                LazyVStack(alignment: .leading, spacing: 8) {
                    ForEach(viewModel.events) { event in
                        Text("[\(event.timestamp.formatted(date: .omitted, time: .standard))] \(event.message)")
                            .font(.caption.monospaced())
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
            .frame(maxHeight: 180)
        }
    }

    private var statusColor: Color {
        switch viewModel.state {
        case .idle:
            return .secondary
        case .loading:
            return .orange
        case .loaded:
            return .green
        case .failed:
            return .red
        }
    }
}

#Preview {
    ShellView(viewModel: ShellViewModel())
}
