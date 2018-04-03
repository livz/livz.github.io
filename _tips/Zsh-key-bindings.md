---
title: Essential Key Bindings For ZSH On iTerm
layout: tip
date: 2017-03-13
categories: [Howto]
---

## Overview

The following key bindings are incredibly handy and one of the first things I've set up after switching to ZSH:

```bash
# Navigation
bindkey   '^[[1;5D'   backward-word          # Ctrl-Left arrow
bindkey   '^[[1;5C'   forward-word           # Ctrl-Right arrow
bindkey   '^W'        backward-kill-word     # Ctrl-W
bindkey   '^U'        backward-kill-line     # Ctrl-U
bindkey   '^K'        kill-line              # Ctrl-K
bindkey   '^A'        beginning-of-line      # Ctrl-A
bindkey   '^[OH'      beginning-of-line      # Home
bindkey   '^E'        end-of-line            # Ctrl-E
bindkey   '^[OF'      end-of-line            # End
bindkey   '^[[3~'     delete-char            # Delete 
  
# History substring search
source ~/Downloads/zsh-history-substring-search/zsh-history-substring-search.zsh

# History search using Up, Down arrows
bindkey   "^[[A"      history-substring-search-up     # Up
bindkey   "^[[B"      history-substring-search-down   # Down
```

<div class="box-note">
To find the keycodes to use for _bindkey_, open a terminal and press **CTRL(^) + V**, followed by the key combination. 
</div>
