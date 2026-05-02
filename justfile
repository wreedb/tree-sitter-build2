default:
    @just --list

all: regen wasm play

regen:
    tree-sitter generate

wasm: regen
    tree-sitter build --wasm

play: wasm
    tree-sitter playground

clean:
    -rm -fr *.so *.wasm .build/ .zig-cache/ zig-out/
