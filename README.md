tree-sitter-build2
==================

[Build2](https://build2.org) `buildfile` syntax grammar for [tree-sitter](https://tree-sitter.github.io).

---
Using with [Neovim](https://neovim.io)
--------------------------------------
The easiest way to get set up is to use the provided installation script:
```sh
./misc/nvim/install.sh
# to uninstall:
./misc/nvim/install.sh --uninstall
```
This will install the grammar, query files and file-type detection and plugin  
into your `$XDG_CONFIG_HOME/nvim` (which is `~/.config/nvim` by default).

#### Note:
> This approach requires a recent enough version of Neovim to have the  
> `vim.treesitter.*` API available, which is roughly 0.9.0 and newer.

---
Installing to your system
-------------------------
The simplest way is to use the provide [GNU Makefile](https://gnu.org/software/make):
```sh
PREFIX=/your/prefix make
# with root permission as needed
PREFIX=/your/prefix make install
```
Alternatively with [CMake](https://cmake.org):
```sh
cmake -B .build \
    -DCMAKE_INSTALL_PREFIX=/your/prefix \
    -DCMAKE_BUILD_TYPE=Release
cmake --build .build
# with root permission as needed
cmake --install .build
```
Alternatively with [Zig](https://ziglang.org)
```
zig build --release=safe --prefix /your/prefix
```

---
License
-------
This repository is licensed under the [GNU Lesser General Public License](https://gnu.org/licenses/lgpl-3.0.html) version  
3.0 or later WITH [LGPL-3.0-linking-exception](LICENSES/LGPL-3.0-linking.exception.txt). See the [LICENSES subdirectory](/LICENSES)   
or the included [COPYING](/COPYING) text for more information.