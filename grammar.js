const PREC =
{
    ASSIGNMENT: -2,
    CONDITIONAL: -1,
    DEFAULT: 0,
    EQUAL: 6,
    RELATIONAL: 7,
    UNARY: 14
};

const sep1 = (rule, separator) =>
{
    return seq(rule, repeat(seq(separator, rule)));
};

export default grammar({
    name: "build2",

    conflicts: $ =>
    [
        [$.name],
        [$.name, $._dep_normal],
        [$.name, $._dep_configuration],
        [$._multi_prefix_group, $.lone_group],
        [$._single_path_group, $._multi_path_group, $._dep_normal],
        [$._single_path_group, $._multi_path_group],
        [$.assignment_expression, $._dep_normal],
    ],

    extras: $ =>
    [
        $.comment,
        $.line_continuation,
        /[ \t\f]|\r?\n/,
    ],
    word: $ => $.identifier,
    
    rules:
    {
        document: $ => repeat(choice(
            $.dependency,
            $.assignment,
            $.directive,
            $.statement,
        )),

        line_continuation: _ => seq("\\", /\r?\n/),
        
        identifier: _ => /(\p{XID_Start}|_|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8})(\p{XID_Continue}|\$|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8}|[-.])*/,
        
        comment: _ => token(choice(
            seq("#", /(\\+(.|\r?\n)|[^\\\n])*/),
            seq(
                "#\\",
                /([^#]|#[^\\])*/,
                "#\\",
            ),
        )),

        statement: $ => choice($.if_statement),

        config: $ => seq(
            "config.",
            $._config_subname,
        ),

        _config_subname: $ => token(choice(
            "cxx.coptions",
            "cxx.poptions",
            "cxx.loptions",
            "cxx",
        )),

        value: $ => choice(
            $.name,
            $.xname,
            $.number,
            $.pair,
            $.string,
            $.path,
            $.variable,
            $.flag,
            $.selection,
        ),

        assignment: $ => $.assignment_expression,
        assignment_expression: $ => prec.right(PREC.ASSIGNMENT, seq(
            field("key", $.identifier),
            field("operator", choice("=", "=+", "+=", "=-", "-=", "?=", "=?")),
            optional(repeat1(field("value", $.value))),
            /\n/
        )),

        pair: $ => seq(
            field("lhs", $.name),
            "@",
            field("rhs", choice($.name, $.string, $.path, $.number, $.variable)),
        ),


        _if_scope: $ => seq(
            "{",
            repeat(choice($.assignment_expression, $.directive)),
            "}",
        ),

        binary_expression: $ => {
            const table = [
                ["==", PREC.EQUAL],
                ["!=", PREC.EQUAL],
                [">=", PREC.RELATIONAL],
                ["<=", PREC.RELATIONAL],
                [">",  PREC.RELATIONAL],
                ["<",  PREC.RELATIONAL],
            ];
        
            return choice(...table.map(([operator, precedence]) => {
                return prec.left(precedence, seq(
                    field("left", choice($.value, $.variable)),
                    field("operator", operator),
                    field("right", choice($.value, $.variable)),
                ));
            }));
        },

        name: $ => $.identifier,
        xname: $ => /[A-Za-z][A-Za-z0-9-_.+]*/,

        path: $ => token(seq(
            optional("/"),
            /[a-zA-Z0-9._]+|[*][*]|[*]/,
            repeat(seq("/", /[a-zA-Z0-9._\-]+|[*][*]|[*]/)),
            optional("/"),
        )),
        
        negated_path: $ => seq("-", $.path),

        number: $ => /\d+(\.\d+)?/,

        flag: $ => seq(
            choice("--", "-"),
            /[A-Za-z]/,
            /[A-Za-z0-9_.=-]+/,
        ),
        
        type: $ => choice(
             /bool/,
             /u?int64s?/,
             seq(/string/, optional(choice(/s/, /_set/, /_map/))),
             /names?/,
             /paths?/,
             /dir_paths?/,
             /name_pair/,
             /project_name/,
             /cmdline/,
             /target_triplet/,
             seq(/json/, optional(choice(/_array/, /_object/, /_set/, /_map/))),
        ),

        postfix: $ => seq(
            "@",
            $.path,
        ),


        _single_prefix_group: $ => seq(
            field("lhs", $.name),
            "{",
            field("rhs", sep1(choice($.name, $.path), token.immediate(/[ \t\f]+/))),
            "}",
        ),
        
        _multi_prefix_group: $ => seq(
            "{",
            field("lhs", sep1(choice($.name, $.path), token.immediate(/[ \t\f]+/))),
            "}",
            "{",
            field("rhs", sep1(choice($.name, $.path), token.immediate(/[ \t\f]+/))),
            "}",
        ),

        if_statement: $ => seq(
            $.if_branch,
            repeat($.elif_branch),
            optional($.else_branch),
        ),
        
        if_branch: $ => seq(
            choice("if", "ife", "ifn", "if!", "ife!", "ifn!"),
            "(",
            choice($.value, $.binary_expression),
            ")",
            $._if_scope,
        ),

        elif_branch: $ => seq(
            choice("elif", "elife", "elifn", "elif!", "elife!", "elifn!"),
            "(", choice($.value, $.binary_expression), ")",
            $._if_scope,
        ),

        else_branch: $ => seq(
            "else",
            $._if_scope,
        ),

        selection: $ => seq(
            "$(",
            field("from", $.variable),
            ":",
            field("resource", $.identifier),
            ")"
        ),
        
        group: $ => seq(
            choice(
                $._single_prefix_group,
                $._multi_prefix_group,
                $._single_path_group,
                $._multi_path_group,
            ),
            optional($.postfix),
        ),

        
        _single_path_group: $ => seq(
            field("lhs", $.path),
            field("rhs", seq(
                "{",
                sep1(choice($.name, $.path, $.negated_path, $.variable), " "),
                "}",
            )),
        ),

        _multi_path_group: $ => seq(
            $.path,
            field("lhs", seq(
                "{",
                sep1(choice($.name, $.path, $.negated_path, $.variable), " "),
                "}",
            )),
            field("rhs", seq(
                "{",
                sep1(choice($.name, $.path, $.negated_path, $.variable), " "),
                "}",
            )),
        ),
        
        variable: $ => seq("$", $.identifier),

        _dqstring_content: $ => token.immediate(prec(1, /[^"\\$]+/)),
        _sqstring_content: $ => token.immediate(prec(1, /[^'\\$]+/)),

        
        _sqstring: $ => seq(
            "'", repeat($._sqstring_content), "'",
        ),
        
        _dqstring: $ => seq(
            '"', repeat(choice($._dqstring_content, $.variable)), '"',
        ),

        string: $ => choice($._dqstring, $._sqstring),

        type_annotation: $ => seq(
            "[",
            $.type,
            "]",
        ),

        directive: $ => choice($.using, $.define, $.include, $.source, $.import),

        using: $ => seq(
            "using",
            $.name
        ),

        define: $ => seq(
            "define",
            optional($.type_annotation),
            field("name", $.identifier),
            ":",
            field("value", choice($.name, $.path, $.string, $.variable))
        ),


        include: $ => seq(
            "include", $.path,
        ),
        
        source: $ => seq(
            "source", $.path,
        ),

        import: $ => seq(
            "import",
            $.identifier,
            choice("=", "+=", "=+", "-=", "=-", "?=", "=?"),
            field("from", $.identifier),
            "%",
            field("resource", seq(
                field("lhs", $.identifier),
                "{",
                field("rhs", sep1(choice($.identifier, $.path), token.immediate(/[ \t\f]+/))),
                "}",
            )),
        ),
    
        scope_begin: _ => /\{[ \t\f]*\r?\n/, 

        scope: $ => seq(
            $.scope_begin,
            repeat(choice($.assignment_expression, $.directive)),
            "}",
        ),

        _dep_configuration: $ => seq(
            $.group,
            ":",
            field("configuration", seq(
                field("key", $.identifier),
                optional(" "),
                choice("=", "+=", "=+", "-=", "=-", "?=", "=?"),
                optional(" "),
                field("value", choice($.identifier, $.value)),
            )),
        ),

        lone_group: $ =>  seq(
            "{",
            field("members", sep1(choice($.name, $.path, $.negated_path), token.immediate(/[ \t\f]+/))),
            "}",
        ),

        _dep_normal: $ => seq(
            choice($.group, $.path),
            repeat1(seq(
                ":",
                field("prerequisites",
                    sep1(
                        choice($.group, $.identifier, $.path, $.negated_path, $.lone_group),
                        token.immediate(/[ \t\f]+/)
                    ),
                )
            )),
            optional(seq(":",  choice(
                $.scope,
                $.assignment_expression,
                field("configuration", seq(
                    field("key", $.identifier),
                    optional(" "),
                    choice("=", "+=", "=+", "-=", "=-", "?=", "=?"),
                    optional(" "),
                    field("value", choice($.identifier, $.value)),
                )),
            ))),
        ),

        dependency: $ => choice($._dep_configuration, $._dep_normal),

    },
});
