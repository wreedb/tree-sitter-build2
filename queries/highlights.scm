(dependency
  (name) @keyword)

(multi_target
  rhs: (subject
    (name) @keyword))

(single_target
  rhs: (subject
    (name) @keyword))

(multi_target
  lhs: (subject
    (name) @function))

(single_target
  lhs: (name) @function)

(path) @function

(assignment
  variable: (name) @keyword)

(glob) @character.special

(keyword) @constant.macro

(string) @string

(path_target
  (path) @function)

(path_target
  (subject
    (name) @keyword))
