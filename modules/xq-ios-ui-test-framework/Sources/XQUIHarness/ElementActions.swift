import XCTest

public extension XCUIElement {
    @MainActor
    @discardableResult
    func requireExistence(timeout: TimeInterval = 8, file: StaticString = #filePath, line: UInt = #line) -> Self {
        XCTAssertTrue(waitForExistence(timeout: timeout), "Element did not appear: \(self)", file: file, line: line)
        return self
    }

    @MainActor
    func tapWhenHittable(timeout: TimeInterval = 8, file: StaticString = #filePath, line: UInt = #line) {
        requireExistence(timeout: timeout, file: file, line: line)
        let hittable = NSPredicate(format: "hittable == true")
        let expectation = XCTNSPredicateExpectation(predicate: hittable, object: self)
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: timeout), .completed, "Element is not hittable: \(self)", file: file, line: line)
        tap()
    }

    @MainActor
    func replaceText(with value: String, timeout: TimeInterval = 8, file: StaticString = #filePath, line: UInt = #line) {
        tapWhenHittable(timeout: timeout, file: file, line: line)
        if let currentValue = self.value as? String, !currentValue.isEmpty {
            typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: currentValue.count))
        }
        typeText(value)
    }
}

public protocol ScreenObject {
    var application: XCUIApplication { get }
}
