set unstable := true

ts := require("tree-sitter")

version := `cat .version`

default:
    @just --list

[group("tree-sitter")]
generate:
    @{{ts}} generate

[group("tree-sitter")]
build: generate
    @{{ts}} build --reuse-allocator

[group("tree-sitter")]
wasm: generate
    @{{ts}} build --reuse-allocator --wasm

[group("tree-sitter")]
play: wasm
    @{{ts}} playground

[group("clean")]
clean:
    -rm -rf *.so *.wasm *.a *.o *.pc build/ .build/ .zig-cache/ zig-out/

[group("clean")]
reallyclean: clean
    -rm -fr src/

[group("maintainence")]
version:
    @cat .version
    @echo -en '\n'

[group("maintainence")]
reuse:
    @reuse lint

[group("maintainence")]
commit:
    convco commit -i

[group("maintainence")]
bump amount="patch":
    @pysemver bump {{amount}} {{version}}

[group("maintainence")]
changelog:
    @git cliff
