default: regen

clean:
    -rm -fr *.wasm *.so .build/ .cache/ .zig-cache/ zig-out/

regen:
    tree-sitter generate
    tree-sitter build --debug --reuse-allocator
    tree-sitter build --debug --reuse-allocator --wasm

play: regen
    tree-sitter playground
