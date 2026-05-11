--- @file Build2 file-type plugin for Neovim
--- @author Will Reed <wreed@disroot.org>
--- @project https://codeberg.org/wreedb/tree-sitter-build2
--- @license LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
---
--- last updated: 05.11.2026
---

if vim.b.did_ftplugin then
    return
end

vim.b.did_ftplugin = true

vim.opt_local.comments = ":#"
vim.opt_local.commentstring = "# %s"

vim.b.undo_ftplugin = "setlocal comments< commentstring<"

vim.treesitter.start()
