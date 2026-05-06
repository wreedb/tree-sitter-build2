/**
 * @file Build2 grammar for tree-sitter
 * @author Will Reed <wreed@disroot.org>
 * @license LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// @ts-ignore
const sep1 = (rule, separator) => {
    return seq(rule, repeat(seq(separator, rule)));
};

// @ts-ignore
const sep = (rule, separator) => {
    return optional(sep1(rule, separator));
};

export default grammar({
    name: "build2",
    
    extras: $ => [
        $.comment,
        $._line_continuation,
        /[\s\f\uFEFF\u2060\u200B]|\r?\n/
    ],
    
    conflicts: $ => [
        [$.dependency, $._single_target],
        [$.dependency, $.assignment],
        [$.dependency],
        [$.dependency, $.group],
        [$.assignment],
        [$._multi_target, $.dependency],
    ],
    
    word: $ => $.identifier,

    rules: {
        source: $ => optional(
            repeat(
                choice(
                    $.directive,
                    $.dependency,
                    $.assignment,
                    $.statement,
                    $.scope
                )
            )
        ),
        
        _line_continuation: $ => token(seq('\\', /\r?\n/)),
        
        _kw_switch: $ => token("switch"),
        _kw_case: $ => token("case"),
        
        _kw_if_begin: $ => choice(
            token("if"),
            token("if!"),
            token("ifn"),
            token("ifn!"),
            token("ife"),
            token("ife!"),
        ),

        _kw_if_cont: $ => choice(
            token("elif"),
            token("elif!"),
            token("elifn"),
            token("elifn!"),
            token("elife"),
            token("elife!")
        ),
        
        type: $ => token(choice(
            "bool",
            "int64",
            "int64s",
            "uint64",
            "uint64s",
            "string",
            "strings",
            "string_set",
            "string_map",
            "path",
            "paths",
            "dir_path",
            "dir_paths",
            "json",
            "json_array",
            "json_object",
            "json_set",
            "json_map",
            "name",
            "names",
            "name_pair",
            "cmdline",
            "project_name",
            "target_triplet"
        )),
        
        _type_annotation: $ => seq(
            "[", $.type, "]"
        ),
        
        annotation: $ => seq(
            "[",
            token("see_through"),
            "]"
        ),
        
        rule_hint: $ => seq(
            "[",
            field("key", token("rule_hint")),
            "=",
            field("value", $.identifier),
            "]"
        ),

        scope: $ => seq(
            "{",
            /\n/,
            sep(choice($.statement, $.assignment, $.directive), /\n/),
            /\n/,
            "}",
        ),

        _kw_if_end: $ => token("else"),
        
        comparator: $ => choice(
            token("=="),
            token("!="),
            token(">="),
            token("<="),
            token("<"),
            token(">")
        ),

        statement: $ => choice(
            $.if_statement,
            $.switch_statement
        ),


        if_condition: $ => choice(
            $.value_noident,
            seq("(", $.value_noident, $.comparator, $.value_noident, ")"),
        ),

        _initial_if_branch: $ => seq(
            $._kw_if_begin,
            $.if_condition,
            choice(
                choice($.assignment, $.dependency, $.directive),
                seq(
                    "{",
                    optional(repeat(choice($.assignment, $.dependency, $.directive))),
                    "}"
                )
            )
        ),

        _middle_if_branch: $ => seq(
            $._kw_if_cont,
            $.if_condition,
            choice(
                choice($.dependency, $.assignment, $.directive),
                seq(
                    "{", 
                    optional(repeat(choice($.assignment, $.dependency, $.directive))),
                    "}"
                ),
            ),
        ),

        _end_if_branch: $ => seq(
            $._kw_if_end,
            choice(
                choice($.dependency, $.assignment, $.directive),
                seq(
                    "{", 
                    optional(repeat(choice($.assignment, $.dependency, $.directive))),
                    "}"
                ),
            ),
        ),

        if_statement: $ => seq(
            field("initial_branch", $._initial_if_branch),
            optional(field("middle_branches", repeat($._middle_if_branch))),
            optional(field("end_branch", $._end_if_branch))
        ),

        switch_statement: $ => seq(
            $._kw_switch,
            "{",
            repeat(seq(
                $._kw_case,
                sep1($.value, ","),
                "{",
                choice($.directive, $.assignment, $.dependency),
                "}"
            )),
            optional(seq(
                token("default"),
                sep1($.value, ","),
                "{",
                choice($.directive, $.assignment, $.dependency),
                "}"
            )),
            "}"
        ),
        
        double_string_fragment: _ => token.immediate(prec(1, /[^"\\\r\n]+/)),
        single_string_fragment: _ => token.immediate(prec(1, /[^'\\\r\n]+/)),
        string_fragment: $ => choice(
            $.double_string_fragment,
            $.single_string_fragment,
        ),
        
        string: $ => choice(
            seq(
                '"',
                repeat($.double_string_fragment),
                '"',
            ),
            seq(
                '\'',
                repeat($.single_string_fragment),
                '\'',
            ),
        ),
        
        _prefix: $ => choice(
            "-", "+"
        ),
        
        _single_target: $ => seq(
            field("lhs", $.identifier),
            field("rhs", $.group),
        ),
        
        group: $ => seq(
            "{",
                sep1(choice(
                    seq(optional($._prefix), $.identifier),
                    seq(optional($._prefix), $.path),
                    seq(optional($._prefix), $.variable),
                    $.pathglob,
                    $.glob,
                )," "),
            "}"
        ),
        
        _multi_target: $ => seq(
            field("lhs", $.group),
            field("rhs", $.group)
        ),
        
        target: $ => choice($._single_target, $._multi_target),
        
        _assigner: _ => choice(
            token("="),
            token("+="),
            token("-="),
            token("=+"),
            token("=-"),
            token("?="),
        ),
        
        assignment: $ => seq(
            field("key", choice($.identifier, $.variable)),
            optional(repeat1(" ")),
            optional(field("type", $._type_annotation)),
            optional(repeat1(" ")),
            $._assigner,
            optional(repeat1(" ")),
            repeat1(field("value", $.value))
        ),
        
        comment: _ => token(
            choice(
                seq("#", /(\\+(.|\r?\n)|[^\\\n])*/),
                seq("#\\", /[^*]*/, "#\\")
            )
        ),
        
        variable: $ => seq(
            "$",
            $.identifier,
        ),
        
        identifier: $ => token(seq(
            /[a-zA-Z]/,
            /[a-zA-Z0-9_.]*/
        )),

        flag: $ => token(seq(
            "--",
            /[a-zA-Z0-9_-]*/
        )),

        number: $ => /\d+(\.\d+)?/,
        boolean: $ => choice(
            token("true"),
            token("false")
        ),
 
        value_noident: $ => choice(
            $.string,
            $.number,
            $.variable,
            $.path,
            $.boolean,
            $.pathglob,
            $.flag,
        ),

        value: $ => choice(
            $.string,
            $.identifier,
            $.number,
            $.boolean,
            $.variable,
            $.variable_path,
            $.path,
            $.pathglob,
            $.flag
        ),
        
        glob: $ => token(seq("*", optional("*"))),
        
        define_directive: $ => seq(
            $._kw_define,
            optional($.annotation),
            $.identifier,
            ":",
            $.value
        ),
        
        using_directive: $ => seq(
            $._kw_using,
            $.identifier
        ),
        
        include_directive: $ => seq(
            $._kw_include,
            $.path
        ),

        import_directive: $ => seq(
            $._kw_import,
            $.identifier,
            $._assigner,
            $._import_traversal,
        ),

        _import_traversal: $ => seq(
            field("from", $.identifier),
            "%",
            field("resource",
                seq(
                    $.identifier,
                    $.group,
                ),
            ),
        ),
        
        _kw_define: $ => token("define"),
        _kw_using: $ => token("using"),
        _kw_include: $ => token("include"),
        _kw_import: $ => token("import"),
        _kw_info: $ => token("info"),
        _kw_export: $ => token("export"),
        
        info_directive: $ => seq(
            $._kw_info,
            $.value
        ),

        pathglob: $ => choice(
            token("*/"),
            token("/*"),
            token("**/"),
            token("/**"),
        ),
        
        directive_keyword: $ => choice(
            $._kw_define,
            $._kw_using,
            $._kw_include,
            $._kw_import,
            $._kw_info,
            $._kw_export
        ),
        
        directive: $ => choice(
            $.define_directive,
            $.using_directive,
            $.include_directive,
            $.import_directive,
            $.info_directive,
            $.config_directive,
        ),
        
        path: $ => token(prec(2, seq(
            choice(
                "./",
                "../",
                seq(/[a-zA-Z0-9_.-]/, "/")
            ),
            repeat(/[a-zA-Z0-9_./]/)
        ))),
        
        _dependency_configuration: $ => choice(
            seq(
                $.target,
                ":",
                "{",
                    optional(repeat(choice(
                        $.assignment,
                        $.directive,
                    ))),
                "}",
            ),
            seq(
                $.target,
                ":",
                $.assignment
            ),
        ),
        
        _kw_config: $ => token("config"),
        
        config_directive: $ => seq(
            $._kw_config,
            optional($._type_annotation),
            $.identifier,
            $._assigner,
            $.value,
        ),

        variable_path: $ => prec(2, seq(
            $.variable,
            "/",
            /[a-zA-Z0-9.]/,
            /[a-zA-Z0-9_.-]*/,
        )),
        
        dependency: $ => seq(
            optional($.rule_hint),
            choice(
                $._dependency_configuration,
                $.group,
                seq(
                    choice($.identifier, $.target, $.path),
                    ":",
                    repeat1(choice($.identifier, $.variable, $.variable_path, $.target, $.path, $.glob, $.string, $.dependency)),
                ),
            ),
        ),
        
    }
});
