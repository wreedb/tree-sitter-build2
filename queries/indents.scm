(scope "{" @indent.begin)
(scope "}" @indent.end)

(for_statement
  body: "{" @indent.begin)

(for_statement
  body: "}" @indent.end)

(while_statement
  body: "{" @indent.begin)

(while_statement
  body: "}" @indent.end)

(open_tailing_scope) @indent.begin

(configuration "}" @indent.end)

(switch_statement "{" @indent.begin)
(switch_statement "}" @indent.end)
