package tree_sitter_build2_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_build2 "codeberg.org/wreedb/tree-sitter-build2/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_build2.Language())
	if language == nil {
		t.Errorf("Error loading Build2 grammar")
	}
}
