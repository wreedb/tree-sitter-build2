/**
 * @file Build2 grammar for tree-sitter
 * @author Will Reed
 * @license LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

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
        [$._multi_group, $._anon_group],
        [$._multi_path_group, $._single_path_group],
        [$.if_statement],
        [$.if_branch, $.binary_evaluation],
        [$.elif_branch, $.binary_evaluation],
        [$.configuration],
        [$.alternation, $.case_statement],
        [$.while_statement, $.binary_evaluation],
        [$.parameter_list],
    ],

    extras: $ =>
    [
        $.comment,
        $._line_continuation,
        /[ \t\f]|\r?\n/,
    ],

    reserved:
    {
        global: $ =>
        [
            "if",    "if!",
            "ife",   "ife!",
            "ifn",   "ifn!",
            "elif",  "elif!",
            "elife", "elife!",
            "elifn", "elifn!",
            "switch", "case", "default",
            "for", "while",
            "continue", "break",
            "true", "false", "[null]",
        ],
    },

    word: $ => $.identifier,
    
    rules:
    {

        document: $ => repeat(choice(
            $.dependency,
            $.configuration,
            $.assignment,
            $.directive,
            $.statement,
        )),
 
        // BEGIN: TYPES
        identifier: _ => /(\p{XID_Start}|_|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8})(\p{XID_Continue}|\$|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8}|[-.])*/,

        path: $ => token(seq(
            optional("+"),
            optional("/"),
            /[a-zA-Z0-9._]+|[*][*]|[*]/,
            repeat(seq("/", /[a-zA-Z0-9._\-]+|[*][*]|[*]/)),
            optional("/")
        )),

        // anything that can be assigned or normally used in place of a value
        evi: $ => choice(
            $.evaluation,
            $.value,
            $.identifier,
        ),
        
        true: _ => "true",
        false: _ => "false",
        null: _ => "[null]",
        break: _ => "break",
        continue: _ => "continue",
        boolean: $ => choice($.true, $.false),
        number: $ => /\d+(\.\d+)?/,
        variable: $ => seq("$", $.identifier),

        str: $ => token(seq(
            /[A-Za-z_-]/,
            /[A-Za-z0-9+=_.-]*/
        )),

        type: $ => choice(
            "bool",
            /u?int64s?/,
            /names?/,
            /paths?/,
            /dir_paths?/,
            "name_pair",
            "project_name",
            "cmdline",
            "target_triplet",
            "string",
            "json",
            seq("string", /s|_set|_map/),
            seq("json", /_array|_object|_set|_map/),
            "null",
        ),

        value: $ => choice(
            $.path,
            $.string,
            $.negated_path,
            $.pair,
            $.selection,
            $.number,
            $.boolean,
            $.str,
            $.variable,
            $.null,
        ),

        statement: $ => choice(
            $.if_statement,
            $.switch_statement,
            $.for_statement,
            $.while_statement,
            $.break_statement,
            $.continue_statement,
        ),

        negated_path: $ => seq("-", $.path),

        string: $ => choice(
            $._single_quoted_string,
            $._double_quoted_string,
        ),

        group: $ => seq(
            choice(
                $._single_group,
                $._multi_group,
                $._single_path_group,
                $._multi_path_group,
                $._anon_group,
            ),
            optional(seq(
                "@", $.path
            )),
        ),
        
        pair: $ => seq(
            field("left", $.identifier),
            "@",
            field("right", choice(
               $.boolean,
               $.string,
               $.variable,
               $.number,
               $.path,
            )),
        ),
        // END: TYPES

        type_annotation: $ => choice(
            seq(
                "[",
                $.type,
                "]",
            ),
            $.null,
        ),

        assignment: $ => prec.right(PREC.ASSIGNMENT, seq(
            field("key", $.identifier),
            optional($.type_annotation),
            $._assigner,
            optional(repeat1(field("value", choice($.value, $.identifier, $.evaluation)))),
            /\n/,
        )),

        configuration: $ => choice(
            seq(
                field("key", $.identifier),
                optional($.type_annotation),
                $._assigner,
                field("value", optional(repeat1(choice($.value, $.identifier, $.evaluation)))),
            ),
            seq(
                $.open_tailing_scope,
                repeat(seq(
                    field("key", choice($.identifier, $.variable)),
                    optional($.type_annotation),
                    $._assigner,
                    field("value", optional(repeat1(choice($.value, $.identifier, $.evaluation)))),
                    /\n/,
                )),
                "}",
            ),
        ),

        scope: $ => seq(
            "{",
            repeat(choice(
                $.assignment,
                $.statement,
                $.directive,
                $.dependency,
                $.configuration,
            )),
            "}",
        ),

        requirements: $ => seq(
            ":",
            repeat1(choice($.group, $.identifier, $.path, $.variable)),
        ),

        configuration: $ => seq(
            $.group, ":",
            choice(
                seq(
                    field("key", $.identifier),
                    optional($.type_annotation),
                    $._assigner,
                    field("value", optional(repeat1(choice($.value, $.identifier, $.evaluation)))),
                ),
                seq(
                    $.open_tailing_scope,
                    repeat(seq(
                        field("key", $.identifier),
                        optional($.type_annotation),
                        $._assigner,
                        field("value", optional(repeat1(choice($.value, $.identifier, $.evaluation)))),
                        /\n/,
                    )),
                    "}",
                ),
            ),
        ),

        alternation: $ => sep1(
            $.evi,
            "|",
        ),

        parameter_list: $ => sep1(
            choice($.function, $.value),
            ",",
        ),
        
        binary_expression: $ => {
            const table =
            [
                ["==", PREC.EQUAL],
                ["!=", PREC.EQUAL],
                [">=", PREC.RELATIONAL],
                ["<=", PREC.RELATIONAL],
                [">",  PREC.RELATIONAL],
                ["<",  PREC.RELATIONAL],
                ["||", PREC.RELATIONAL],
                ["&&", PREC.RELATIONAL],
            ];
            return choice(...table.map(([operator, precedence]) => {
                return prec.left(precedence, seq(
                    field("left", choice($.value, $.identifier, $.evaluation)),
                    $._comparator,
                    field("right", choice($.value, $.identifier, $.evaluation)),
                ));
            }));
        },

        continue_statement: $ => $.continue,
        break_statement: $ => $.break,
        
        for_statement: $ => seq(
            "for", $.identifier, ":", repeat1($.evi),
            field("body", seq(
                "{",
                repeat(choice(
                    $.statement,
                    $.directive,
                    $.assignment,
                    $.configuration,
                    $.dependency,
                )),
                "}",
            ))
        ),

        while_statement: $ => seq(
            "while", choice(
                seq("(", $.binary_expression, ")"),
                $.evi,
            ),
            field("body", seq(
                "{",
                repeat(choice(
                    $.statement,
                    $.directive,
                    $.assignment,
                    $.configuration,
                    $.dependency,
                )),
                "}",
            )),
        ),
        
        case_statement: $ => seq(
            "case",
            choice($.evi, $.alternation),
            field("consequence", choice(
                $.statement,
                $.directive,
                $.assignment,
                $.configuration,
                $.dependency,
            )),
        ),
        
        case_default_statement: $ => seq(
            "default",
            field("consequence", choice(
                $.statement,
                $.directive,
                $.assignment,
                $.configuration,
                $.dependency,
            )),
        ),
        
        switch_statement: $ => seq(
            "switch",
            $.evi,
            "{",
            repeat($.case_statement),
            optional($.case_default_statement),
            "}",
        ),

        if_statement: $ => seq(
            $.if_branch,
            repeat($.elif_branch),
            optional($.else_branch),
        ),
        
        if_branch: $ => seq(
            choice("if", "ife", "ifn", "if!", "ife!", "ifn!"),
            field("condition", choice(
                seq("(", $.binary_expression, ")"),
                $.evi,
            )),
            field("consequence", choice(
                $.scope,
                $.assignment,
                $.directive,
                $.statement,
            )),
        ),

        elif_branch: $ => seq(
            choice("elif", "elife", "elifn", "elif!", "elife!", "elifn!"),
            field("condition", choice(
                seq("(", $.binary_expression, ")"),
                $.evi,
            )),
            field("consequence", choice(
                $.scope,
                $.assignment,
                $.directive,
                $.statement,
            )),
        ),
        
        else_branch: $ => seq(
            "else",
            field("consequence", choice(
                $.scope,
                $.assignment,
                $.directive,
                $.statement,
            )),
        ),

        selection: $ => seq(
            "$",
            "(",
            field("from", $.variable),
            ":",
            field("resource", $.identifier),
            ")",
        ),

        dependency: $ => seq(
            choice($.group, $.path),
            repeat1($.requirements),
            optional(seq(":", $.tailing_configuration)),
            /\n/,
        ),

        // BEGIN: EVALUATIONS
        evaluation: $ => choice(
            $.ternary_evaluation,
            $.binary_evaluation,
            $.function,
        ),

        binary_evaluation: $ => seq(
            "(",
            choice($.binary_expression, $.value, $.identifier),
            ")",
        ),

        ternary_evaluation: $ => seq(
            "(",
            choice($.binary_expression, $.value, $.identifier),
            "?",
            choice($.value, $.identifier),
            ":",
            choice($.value, $.identifier),
            ")",
        ),
        // END: EVALUATIONS

        // BEGIN: DIRECTIVES
        info: $ => seq(
            "info",
            field("value", choice(
                $.boolean,
                $.string,
                $.variable,
                $.number,
                $.path,
                $.evaluation,
            )),
        ),

        import: $ => seq(
            "import",
            $.identifier,
            $._assigner,
            field("from", $.identifier),
            "%",
            seq(
                field("left", $.identifier),
                "{",
                field("right", repeat1(choice($.identifier, $.path))),
                "}",
            ),
        ),

        include: $ => seq("include", $.path),
        source: $ => seq("source", $.path),

        define: $ => prec.right(PREC.ASSIGNMENT, seq(
            "define",
            optional($.type_annotation),
            field("name", $.identifier),
            ":",
            optional(field("value", $.evi))
        )),


        directive: $ => choice(
            $.define,
            $.import,
            $.include,
            $.info,
            $.source,
        ),
        // END: DIRECTIVES

        // BEGIN: FUNCTIONS
        function: $ => seq(
            "$",
            $.function_name,
            "(",
            optional($.parameter_list),
            optional(seq(
                ",",
                $.fn_flag,
            )),
            ")",
        ),

        fn_flag: $ => choice(
            "icase",
            "contains",
            "contains_once",
            "starts_with",
            "ends_with",
            "first_only",
            "last_only",
            "dedup",
            "return_subs",
            "return_match",
            "format_first_only",
            "format_no_copy",
            "format_copy_empty",
            "return_lines",
            "json",
            "json5",
            "json5e",
        ),
        
        function_name: $ => choice(
            "null",
            "empty",
            "defined",
            "visibility",
            "getenv",
            "generate_uuid",
            "type",
            "first",
            "second",
            "quote",
            "sha256sum",
            "xxh64sum",
            seq(optional("string."), choice(
                "icasecmp",
                "contains",
                "starts_with",
                "ends_with",
                "compare",
                "replace",
                "trim",
                "ucase",
                "lcase",
                "size",
                "front",
                "back",
                "sort",
                "find",
                "find_index",
                "filter",
                "filter_out",
                "keys",
                "split",
            )),
            "string",
            "integer_sequence",
            "size",
            "front",
            "back",
            "sort",
            "find",
            "find_index",
            seq(optional("path."), choice(
                "representation",
                "posix_representation",
                "posix_string",
                "absolute",
                "simple",
                "sub_path",
                "super_path",
                "directory",
                "root_directory",
                "leaf",
                "relative",
                "base",
                "extension",
                "complete",
                "canonicalize",
                seq(optional("try_"), "normalize"),
                seq(optional("try_"), "actualize"),
            )),
            "process_path",
            "path",
            "path.match",
            seq(optional("name."), choice(
                "target_type",
                "project",
                "is_a",
            )),
            seq("regex.", choice(
                "match",
                "find_match",
                seq("filter_", optional("out_"), "match"),
                "find_search",
                seq("filter_", optional("out_"), "search"),
                "replace",
                "replace_lines",
                "split",
                "merge",
                "apply",
            )),
            "value_type",
            "value_size",
            "member_name",
            "member_value",
            "object_names",
            "array_size",
            "array_front",
            "array_back",
            "serialize",
            seq("array_find", optional("_index")),
            seq("json.", choice("load", "parse",)),
            seq("process.", choice(
                "run",
                "run_regex",
                "search",
            )),
            "recall",
            "effect",
            "name",
            seq(optional("env_"), "checksum"),
        ),
        
        // END: FUNCTIONS

        open_tailing_scope: $ => token(/\{[ \t\f]*\r?\n/),
        tailing_configuration: $ => choice(
            seq(
                field("key", $.identifier),
                optional($.type_annotation),
                $._assigner,
                field("value", optional(repeat1(choice($.value, $.identifier)))),
            ),
            seq(
                $.open_tailing_scope,
                repeat(seq(
                    field("key", $.identifier),
                    optional($.type_annotation),
                    $._assigner,
                    field("value", optional(repeat1(choice($.value, $.identifier)))),
                    /\n/,
                )),
                "}",
            ),
        ),

        comment: _ => token(choice(
            seq("#", /(\\+(.|\r?\n)|[^\\\n])*/),
            seq(
                "#\\",
                /([^#]|[^\\])*/,
                "#\\",
            ),
        )),

        _assigner: $ => choice(
            "=",
            "=+",
            "+=",
            "-=",
            "=-",
            "?=",
            "=?",
        ),

        _single_group: $ => seq(
            field("left", $.identifier),
            $._ibrace,
            field("right", repeat1(choice($.identifier, $.path, $.negated_path, $.variable))),
            "}",
        ),

        _multi_group: $ => seq(
            field("left", seq(
                "{",
                repeat1(choice($.identifier, $.path, $.negated_path, $.variable)),
                "}",
            )),
            field("right", seq(
                "{",
                repeat1(choice($.identifier, $.path, $.variable, $.negated_path)),
                "}",
            )),  
        ),

        _anon_group: $ => seq(
            "{",
            field("members", repeat1(choice($.identifier, $.path, $.negated_path, $.variable))),
            "}",
        ),

        _single_path_group: $ => seq(
            field("path", $.path),
            field("right", seq(
                $._ibrace,
                repeat1(choice($.identifier, $.path, $.negated_path, $.variable)),
                "}",
            )),
        ),
        
        _multi_path_group: $ => seq(
            field("path", $.path),
            field("left", seq(
                $._ibrace,
                repeat1(choice($.identifier, $.path, $.negated_path, $.variable)),
                "}",
            )),
            field("right", seq(
                "{",
                repeat1(choice($.identifier, $.path, $.negated_path, $.variable)),
                "}",
            )),
        ),

        _double_quoted_string_content: $ => token.immediate(prec(1, /[^"\\$]+/)),
        _single_quoted_string_content: $ => token.immediate(prec(1, /[^'\\$]+/)),

        _double_quoted_string: $ => seq(
            '"', repeat(choice($._double_quoted_string_content, $.variable)), '"'
        ),

        _single_quoted_string: $ => seq(
            "'", repeat($._single_quoted_string_content), "'"
        ),

        _comparator: _ => choice(
            "==",
            "!=",
            ">=",
            "<=",
            ">",
            "<",
            "&&",
            "||",
        ),
        _line_continuation: _ => seq("\\", /\r?\n/),
        _ibrace: $ => alias(token.immediate("{"), "{"),
    }
});
