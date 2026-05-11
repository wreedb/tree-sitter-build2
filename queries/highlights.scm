;; @file tree-sitter-build2 highlight query
;; @author Will Reed <wreed@disroot.org>
;; @license LGPL-3.0-or-later WITH LGPL-3.0-linking-exception

(comment) @comment @spell

(boolean) @boolean
(number) @number
(string) @string
(variable) @property
(str) @string
(string
  (variable) @string.escape)

(path) @string.special.path
(negated_path
  (path) @comment) @comment

(type) @type.builtin

(function_name) @function.call
(fn_flag) @keyword.modifier

["$"] @character.special

[
  "+="
  "=+"
  "-="
  "=-"
  "?="
  "=?"
  "="
  ":"
  "@"
  "%"
  "?"
] @operator

(ternary_evaluation "?" @keyword.conditional.ternary)
(ternary_evaluation ":" @keyword.conditional.ternary)

[
  "if" "if!"
  "ife" "ife!"
  "ifn" "ifn!"
  "elif" "elif!"
  "elife" "elife!"
  "elifn" "elifn!"
  "else" "default"
  "case" "switch"
] @keyword.conditional

[
  "for"
  "while"
] @keyword.repeat

(break) @keyword.return
(continue) @keyword.return

(null) @type.builtin

(identifier) @property

(group
  path: (path) @constant)

(group
  left: (identifier) @constant)

(group
  right: (_) @property)

(tailing_configuration
  key: (identifier) @variable)

(configuration
  key: (identifier) @variable)
  
(directive
  (_
    [
      "define"
      "import"
      "include"
      "info"
      "source"
    ] @keyword.builtin))

(import
  (identifier) @variable)

(import
  from: (identifier) @module
  left: (identifier) @constant
  right: (identifier) @property)

(assignment
  key: (identifier) @variable)
  
"{" @punctuation.bracket
"}" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket

(open_tailing_scope) @punctuation.bracket

((path) @character.special
 (#match? @character.special "(\\*|\\*\\*)"))

((path) @number
 (#match? @number "^[0-9.]+$"))

((identifier) @number
 (#match? @number "^[0-9.]+$"))