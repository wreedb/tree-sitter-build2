default:
    @just --list

clean:
    -rm -f *.so *.wasm tree-sitter-build2.pc

regen:
    tree-sitter generate

build: regen
    tree-sitter build

wasm: regen
    tree-sitter build --wasm

play: wasm
    tree-sitter playground

distclean: clean
    -rm -fr node_modules/ build/ zig-out/ .zig-cache/ .build/

REALLYclean: distclean
    -rm -fr src/
