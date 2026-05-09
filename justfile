default: regen

clean:
    -rm -fr *.wasm *.so .build/ .cache/ .zig-cache/ zig-out/

regen:
    tree-sitter generate
    tree-sitter build --reuse-allocator
    tree-sitter build --reuse-allocator --wasm

play: regen
    tree-sitter playground
