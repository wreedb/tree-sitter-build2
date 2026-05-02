/**
 * @file Tree-sitter grammar for Build2 'buildfile' syntax
 * @author Will Reed <wreed@disroot.org>
 * @license LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
    name: "build2",

    extras: $ => [
        /\s/,
        $._line_continuation
    ],
    
    conflicts: $ => [
        [$.single_target, $.dependency],
        [$.assignment, $.dependency],
        [$.dependency, $.path_target]
    ],

    rules: {
        
        document: $ => optional(
            repeat(
                choice(
                    $.directive,
                    $.dependency,
                    $.assignment
                )
            )
        ),

        _line_continuation: $ => token(seq('\\', /\r?\n/)),

        path: $ => token(prec(2, seq(
            choice(
                './', 
                '../',
                seq(/[a-zA-Z0-9_.-]+/, '/') 
            ),
            repeat(/[a-zA-Z0-9_./-]/)
        ))),

        name: $ => token(prec(1, /[a-zA-Z_][a-zA-Z0-9_.]*/)),

        _prefix: $ => choice(
            token.immediate("-"),
            token.immediate("+")
        ),
        
        single_target: $ => seq(
            field("lhs", $.name),
            "{",
            field("rhs", $.subject),
            "}"
        ),
        
        multi_target: $ => seq(
            "{",
            field("lhs", $.subject),
            "}",
            "{",
            field("rhs", $.subject),
            "}"
        ),

        subject: $ => choice(
            seq(optional($._prefix), $.name),
            seq(optional($._prefix), $.path),
            $.glob,
            sep1(seq(optional($._prefix), $.name), " "),
            sep1(seq(optional($._prefix), $.path), " "),
            sep1($.glob, " "),
        ),

        target_attribute: $ => seq(
            "[",
            field("key", $.name),
            "=",
            field("value", $.name),
            "]"
        ),

        dependency: $ => seq(
            optional($.target_attribute),
            choice(
                sep1(
                    choice($.path, $.path_target, $.name, $.single_target, $.multi_target),
                    choice(" ", ":"),
                ),
                seq(
                    choice($.path, $.path_target, $.name, $.single_target, $.multi_target),
                    ":",
                    $.assignment
                ),
            )
        ),


        glob: $ => seq("*", optional("*")),

        assigner: $ => choice(
            "=",
            "+=",
            "-="
        ),

        value: $ => $.string,
        quoted_string: $ => choice(
            seq(
                token('"'),
                optional(token(/[^"\n\r;]+/)),
                token('"')
            ),
            seq(
                token("'"),
                optional(token(/[^'\n\r;]+/)),
                token("'")
            ),
        ),
            
        string: $ => choice(
            $.quoted_string,
            token(/[^\s"'=:<\n\r\[\]\{\};][^"'\n\r\[\]\{\};]*/),
        ),

        assignment: $ => seq(
            field("variable", $.name),
            optional(" "),
            optional(seq(

                optional(" ")
            )),
            $.assigner,
            optional(" "),
            $.value,
        ),
        
        keyword: $ => choice(
            token(prec(2, "define")),
            token(prec(2, "using")),
            token(prec(2, "include")),
            token(prec(2, "info")),
        ),

        directive: $ => seq(
            $.keyword,
            " ",
            choice($.string, $.path)
        ),

        path_target: $ => seq(
            $.path,
            "{",
            $.subject,
            "}"
        ),
    }
});

function sep1(rule, separator)
{
    return seq(rule, repeat(seq(separator, rule)));
}

function sep(rule, separator)
{
    return optional(sep1(rule, separator));
}
