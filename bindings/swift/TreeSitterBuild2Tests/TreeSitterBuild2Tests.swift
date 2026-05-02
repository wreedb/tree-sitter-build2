import XCTest
import SwiftTreeSitter
import TreeSitterBuild2

final class TreeSitterBuild2Tests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_build2())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Build2 grammar")
    }
}
