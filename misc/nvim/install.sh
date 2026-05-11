#!/usr/bin/env bash

# @file Installer for the Build2 tree-sitter parser with Neovim
# @author Will Reed <wreed@disroot.org>
# @project https://codeberg.org/wreedb/tree-sitter-build2
# @license LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
#
# last updated: 05.11.2026
#

CC="${CC:-cc}"
CFLAGS="${CFLAGS:--O2 -pipe -fPIC -g}"

argzero="$(basename $0)"

function die()
{
    echo -en "\033[1;31m>>>\033[m $@\n" >&2
    exit 1
}

function warn()
{
    echo -en "\033[1;33m>>>\033[m $@\n" >&2
}

function msg()
{
    echo -en "\033[1;32m>>>\033[m $@\n"
}

function has()
{
    if command -v $1 >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

function xdgconfighome()
{
    echo "${XDG_CONFIG_HOME:-$HOME/.config}"
}

function buildgrammar()
{
    if has tree-sitter; then
        tree-sitter build || die "failed to build grammar"
    else
        "${CC}" "${CFLAGS}" -o build2.so -shared src/parser.c || die "failed to build grammar"
    fi
    msg "built parser"
}

function installparser()
{
    local xdgcfg="$(xdgconfighome)"
    install -dm 0755 "${xdgcfg}/nvim/parser" "${xdgcfg}/nvim/queries" || die "failed to install neovim config subdirectories 'parser' and 'queries'"
    install -m 0755 build2.so "${xdgcfg}/nvim/parser/build2.so" || die "failed to install parser library"
    cp -r queries/ "${xdgcfg}/nvim/queries/build2" || die "failed to install query files"
    msg "installed parser"
}

function installnvimfiles()
{
    local xdgcfg="$(xdgconfighome)"
    install -dm 0755 "${xdgcfg}/nvim/ftplugin" "${xdgcfg}/nvim/ftdetect"
    install -m 0644 misc/nvim/ftdetect.lua "${xdgcfg}/nvim/ftdetect/build2.lua"
    install -m 0644 misc/nvim/ftplugin.lua "${xdgcfg}/nvim/ftplugin/build2.lua"
    msg "installed file-type detection and plugin"
}

function do_uninstall()
{
    local xdgcfg="$(xdgconfighome)"
    rm -f "${xdgcfg}/nvim/ftplugin/build2.lua"
    rm -f "${xdgcfg}/nvim/ftdetect/build2.lua"
    warn "removed file-type detection and plugin"
    rm -f "${xdgcfg}/nvim/parser/build2.so"
    warn "removed parser"
    if [[ -d "${xdgcfg}/nvim/queries/build2" ]]; then
        rm -fr "${xdgcfg}/nvim/queries/build2"
        warn "removed queries"
    fi
}

function usage()
{
    printf 'usage: %s [option...]\n\n' "${argzero}"
    printf 'Installer for the build2 tree-sitter grammar with Neovim\n\n'
    printf 'Options:\n\n'
    printf '    -u, --uninstall    Uninstall the parser and plugin file(s).\n'
    printf '    -h, --help         Display this usage info\n\n'
    printf 'Report bugs to https://codeberg.org/wreedb/tree-sitter-build2/issues\n'
    exit 0
}

if has getopt; then
    :
else
    die "unable to find command 'getopt', required for this script."
fi

ARGUMENTS=$(getopt -o uh --long uninstall,help --name "${argzero}" -- "$@")

if [[ $? -ne 0 ]]; then
    exit 1
fi

eval set -- "${ARGUMENTS}"

O_HELP=0
O_UNINSTALL=0

while true; do

    case ${1} in

        --uninstall|-u)
            do_uninstall || die "failed uninstall process"
            msg "uninstalled."
            exit
            ;;
        --help|-h)
            usage
            exit
            ;;
        --)
            shift
            break
            ;;
        -)
            break
            ;;
        *)
            die "unexpected option: ${1}"
            ;;

    esac

done

buildgrammar || die "failed building grammar"
installparser || die "failed installing parser"
installnvimfiles || die "failed installing auxiliary neovim files"
msg "done."
exit
