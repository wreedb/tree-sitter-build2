(boolean) @boolean

(glob) @string.special

(variable
  ["$"] @character.special)

(variable
  (identifier) @property)

(assignment
  key: (identifier) @variable)

(assignment
  value: (value) @string)
    
(dependency
  (target
    lhs: (identifier) @keyword.builtin))

(dependency
  (target
    lhs: (group
      (identifier) @keyword.builtin)))

(dependency
  (target
    rhs: (group
      (identifier) @property)))

(comment) @comment
(number) @number
(string) @string

(if_statement
  ["if" "ifn" "ife" "if!" "ifn!" "ife!" "elif" "elif!" "elifn" "elifn!" "elife" "elife!" "else"] @keyword.builtin)

(import_directive
  ["import"] @function.builtin)

(import_directive
  (identifier) @keyword.builtin)

(import_directive
  resource: (group
    (identifier) @variable))

(define_directive
  ["define"] @function.macro)

(info_directive
  ["info"] @function.macro)

(include_directive
  ["include"] @function.macro)

(using_directive
  ["using"] @function.macro)

(using_directive
  (identifier) @variable)

(include_directive
  (path) @string.special.path)

(define_directive
  (identifier) @property)

(define_directive
  (value
    (string) @string))

(define_directive
  (value
    (path) @string.special.path))

(define_directive
  (value
    (variable) @variable))

(define_directive
  (value
    (identifier) @variable))

(dependency
  (rule_hint
    ["rule_hint"] @function.macro))

(dependency
  (rule_hint
    value: (identifier) @variable))

(annotation) @label
(annotation
  ["[" "]"] @punctuation.bracket)

(type) @type

["=" "?=" "!=" "==" ">=" "<="] @operator

(string
  (double_string
    (variable
      (identifier) @variable)))

(string
  (double_string
    (variable
      ["$"] @character.special)))

(path) @string.special.path