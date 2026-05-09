(comment) @comment @spell

(type) @type.builtin
(number) @number
(path) @string.special.path
(string) @string

(variable) @function

(flag) @string

(string
  (variable) @string.escape)


(group
  lhs: (name) @keyword.builtin)

(group
  rhs: (name) @property)


(assignment_expression
  value: (value
    (name) @string))

(dependency
  value: (identifier) @string)
 
(pair
  lhs: (name) @label)

[
  "%"
  "@"
  "="
  "=="
  "!="
  "?="
  "=?"
  ">="
  "<="
  "<"
  ">"
  "+="
  "=+"
  "-="
  "=-"
] @operator

(import
  rhs: (identifier) @property)

(import
  lhs: (identifier) @keyword.builtin)

[
  "{"
  "}"
  "["
  "]"
] @punctuation.bracket

[
  "if" "ife" "ifn"
  "if!" "ife!" "ifn!"
  "elif" "elife" "elifn"
  "elif!" "elife!" "elifn!"
  "else"
] @keyword.conditional

(scope_begin) @punctuation.bracket

(directive
  (_
    [
     "using"
     "define"
     "include"
     "source"
     "import"
    ] @keyword.builtin))

(using
  (name) @property)

(define
  name: (identifier) @variable)

(define
  value: (name) @property)

(xname) @string
(negated_path) @comment
(negated_path
  (path) @comment)

(selection
  ["$(" ")"] @punctuation.special)

(import
  from: (identifier) @module)
  
(selection
  resource: (identifier) @constant)
  
(((identifier) @boolean)
  (#match? @boolean "^(true|false)$"))
  
(((identifier) @number)
  (#match? @number "^[0-9.]+$"))

(((path) @number)
  (#match? @number "^[0-9.]+$"))

((path) @character.special
 (#match? @character.special "(\\*|\\*\\*)"))

((identifier) @property
 (#match? @property "^manifest$"))