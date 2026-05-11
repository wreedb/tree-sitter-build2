--- @file Build2 file-type detection for Neovim
--- @author Will Reed <wreed@disroot.org>
--- @project https://codeberg.org/wreedb/tree-sitter-build2
--- @license LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
---
--- last updated: 05.11.2026
---

vim.api.nvim_create_autocmd({ "BufRead", "BufNewFile" }, {
    pattern = { "*.build", "buildfile" },
    callback = function()
        vim.bo.filetype = "build2"
    end
})
