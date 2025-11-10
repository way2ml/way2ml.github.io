---
title: How to use tmux to smooth my workflow
date: 2025-11-10
author: Jie Huang
---

# Tmux is your friend

## How to save and restore sessions? 

```bash
# Fix color umatched
set-option -sa terminal-overrides ",xterm*:Tc"

set -g mouse on
set-option -g set-clipboard on

# Use vim keybindings
bind -r k select-pane -U
bind -r j select-pane -D
bind -r h select-pane -L
bind -r l select-pane -R

# Numbering starts at 1
set -g base-index 1
set -g pane-base-index 1
set-window-option -g pane-base-index 1
set-option -g renumber-windows on

# Force tmux to open new panes/windows in the current pane's directory
bind c new-window -c "#{pane_current_path}"
bind % split-window -h -c "#{pane_current_path}"
bind '"' split-window -v -c "#{pane_current_path}"


# Plugin list
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-yank'
set -g @plugin 'nordtheme/tmux'
set -g @plugin 'tmux-plugins/tmux-resurrect' # Restore tmux environment after system restart.

# init TPM (must at the end)
run '~/.tmux/plugins/tpm/tpm'
```
The plugin [tmux-resurrect](https://github.com/tmux-plugins/tmux-resurrect) is used to realise restore tmux environment. The keys for save and 
restore the environment is `Ctrl b s/r`.

## How to start new panel with current path? 
Add the following two lines in the configuration 
file `~/.tmux.conf`

```bash
bind '"' split-window -v -c "#{pane_current_path}"
bind % split-window -h -c "#{pane_current_path}"
```

Then update the configuration with this command

```bash
tmux source-file ~/.tmux.conf
```

## How to add image with caption
This is test to add image with 
```{figure} ../../data/github_workflow/Github-Workflow-2.png
Figure 1. This is test to add image with caption. The grammar is
different from the common markdown format.
```

## References


