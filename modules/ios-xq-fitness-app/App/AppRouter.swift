import Foundation
import Observation

@Observable
final class AppRouter {
    var path: [AppRoute] = []
    var sheet: SheetDestination?
}

enum AppRoute: Hashable {
    case routine(UUID)
    case trainingDay(routineID: UUID, dayID: UUID)
    case snapshotReport(routineID: UUID)
}

enum SheetDestination: Identifiable, Equatable {
    case createRoutine
    case exercise(routineID: UUID, dayID: UUID, exerciseID: UUID?)

    var id: String {
        switch self {
        case .createRoutine:
            return "create-routine"
        case let .exercise(routineID, dayID, exerciseID):
            return "exercise-\(routineID)-\(dayID)-\(exerciseID?.uuidString ?? "new")"
        }
    }
}
