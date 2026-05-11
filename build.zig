const std = @import("std");
const fmt = std.fmt;
const semver = std.SemanticVersion;

pub const FileLines = struct {
    alloc:      std.mem.Allocator,
    file_data:  []const u8,
    slices:     std.ArrayList([]const u8),

    pub fn read(alloc: std.mem.Allocator, dir: std.fs.Dir, filename: []const u8) !FileLines
    {

        const data = try dir.readFileAlloc(alloc, filename, std.math.maxInt(usize));

        var slices: std.ArrayList([]const u8) = .empty;
        var itr = std.mem.splitScalar(u8, data, '\n');
        while (itr.next()) |line|
        {
            try slices.append(alloc, std.mem.trim(u8, line, "\r"));
        }

        return
        .{
            .alloc = alloc,
            .file_data = data,
            .slices = slices,
        };
    }

    pub fn deinit(self: *FileLines) void
    {
        self.alloc.free(self.file_data);
        self.slices.deinit(self.alloc);
    }

    pub fn lines(self: *const FileLines) [][]const u8
    {
        return self.slices.items;
    }
};

pub fn build(b: *std.Build) !void
{
    var allocator: std.heap.ArenaAllocator = .init(std.heap.page_allocator);
    const arena = allocator.allocator();

    defer allocator.deinit();

    var fh = try FileLines.read(arena, std.fs.cwd(), ".version");
    defer fh.deinit();

    const version = try semver.parse(fh.lines()[0]);
    const treesitter_abi_version: semver = .{
        .major = 15,
        .minor = 0,
        .patch = 0
    };

    var buffer: [6]u8 = undefined;
    const soversion_str = try fmt.bufPrint(&buffer, "{d}.{d}.{d}", .{
        treesitter_abi_version.major,
        version.major,
        0
    });

    const soversion: semver = try semver.parse(soversion_str);

    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const strip = b.option(bool, "strip", "Discard debug symbols") orelse false;
    const reuse_alloc = b.option(bool, "reuse-allocator", "Reuse the library allocator") orelse false;

    const library_name = "tree-sitter-build2";

    const pc_desc = "Tree-sitter grammar for Build2 syntax";
    const pc_url = "https://codeberg.org/wreedb/tree-sitter-build2";
    const pc_text = b.fmt(
        \\prefix=${{pcfiledir}}/../..
        \\exec_prefix=${{prefix}}
        \\libdir=${{prefix}}/lib
        \\includedir=${{prefix}}/include
        \\
        \\name: {s}
        \\description: {s}
        \\url: {s}
        \\version: {d}.{d}.{d}
        \\libs: -L${{libdir}} -l{s}
        \\cflags: -I${{includedir}}
    , .{
        library_name,
        pc_desc,
        pc_url,
        version.major,
        version.minor,
        version.patch,
        library_name
    });

    var generate_pc = try std.fs.cwd().createFile("tree-sitter-build2.pc", .{ .truncate = true });
    try generate_pc.writeAll(pc_text);
    generate_pc.close();

    const pc_step = b.addInstallFileWithDir(
        b.path("tree-sitter-build2.pc"),
        .lib,
        "pkgconfig/tree-sitter-build2.pc",
    );

    b.getInstallStep().dependOn(&pc_step.step);

    const lib_shared: *std.Build.Step.Compile = b.addLibrary(.{
        .name = library_name,
        .linkage = .dynamic,
        .version = soversion,
        .root_module = b.createModule(.{
            .target = target,
            .optimize = optimize,
            .link_libc = true,
            .pic = true,
            .strip = strip,
        }),
        .use_llvm = true,
    });

    const lib_static: *std.Build.Step.Compile = b.addLibrary(.{
        .name = library_name,
        .linkage = .static,
        .root_module = b.createModule(.{
            .target = target,
            .optimize = optimize,
            .link_libc = true,
            .pic = true,
            .strip = strip,
        }),
        .use_llvm = true,
    });

    lib_shared.addCSourceFile(.{
        .file = b.path("src/parser.c"),
        .flags = &.{"-std=c11"},
    });

    lib_static.addCSourceFile(.{
        .file = b.path("src/parser.c"),
        .flags = &.{"-std=c11"},
    });

    if (fileExists(b, "src/scanner.c")) {
        lib_shared.addCSourceFile(.{
            .file = b.path("src/scanner.c"),
            .flags = &.{"-std=c11"},
        });
        lib_static.addCSourceFile(.{
            .file = b.path("src/scanner.c"),
            .flags = &.{"-std=c11"},
        });
    }

    if (reuse_alloc) {
        lib_shared.root_module.addCMacro("TREE_SITTER_REUSE_ALLOCATOR", "");
        lib_static.root_module.addCMacro("TREE_SITTER_REUSE_ALLOCATOR", "");
    }
    if (optimize == .Debug) {
        lib_shared.root_module.addCMacro("TREE_SITTER_DEBUG", "");
        lib_static.root_module.addCMacro("TREE_SITTER_DEBUG", "");
    }

    lib_shared.addIncludePath(b.path("src"));
    lib_static.addIncludePath(b.path("src"));

    // ... ??
    // b.installFile("src/node-types.json", "node-types.json");

    lib_shared.installHeader(
        b.path("bindings/c/tree_sitter/tree-sitter-build2.h"),
        "tree_sitter/tree-sitter-build2.h",
    );

    b.installArtifact(lib_shared);
    b.installArtifact(lib_static);

    if (fileExists(b, "queries")) {
        b.installDirectory(.{
            .source_dir = b.path("queries"),
            .install_dir = .prefix,
            .install_subdir = "share/tree-sitter/queries/build2",
            .include_extensions = &.{"scm"},
        });
    }

    const module = b.addModule(library_name, .{
        .root_source_file = b.path("bindings/zig/root.zig"),
        .target = target,
        .optimize = optimize,
        .strip = strip,
    });

    module.linkLibrary(lib_shared);
    module.linkLibrary(lib_static);

    const tests = b.addTest(.{
        .root_module = b.createModule(.{
            .root_source_file = b.path("bindings/zig/test.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });

    tests.root_module.addImport(library_name, module);

    // HACK: fetch tree-sitter dependency only when testing this module
    if (b.pkg_hash.len == 0) {
        var args = try std.process.argsWithAllocator(b.allocator);
        defer args.deinit();
        while (args.next()) |a| {
            if (std.mem.eql(u8, a, "test")) {
                const ts_dep = b.lazyDependency("tree_sitter", .{}) orelse continue;
                tests.root_module.addImport("tree-sitter", ts_dep.module("tree-sitter"));
                break;
            }
        }
    }

    const run_tests = b.addRunArtifact(tests);
    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&run_tests.step);
}

inline fn fileExists(b: *std.Build, filename: []const u8) bool {
    const dir = b.build_root.handle;
    dir.access(filename, .{}) catch return false;
    return true;
}
