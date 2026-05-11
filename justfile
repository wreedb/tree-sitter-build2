default:
    @just --list

clean:
    -rm -fr *.so *.wasm src/

regen:
    tree-sitter generate

build: regen
    tree-sitter build

wasm: regen
    tree-sitter build --wasm

play: wasm
    tree-sitter playground
