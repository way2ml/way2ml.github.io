---
title: How to use tmux to smooth my workflow
date: 2025-11-10
author: Jie Huang
---

# Tmux is your friend

## What is tmux?
Tmux is a terminal multiplexer. It allows you to create several pseudo-terminals from a single terminal. It is useful for running multiple programs with a single connection, such as when you are connecting to a machine using SSH.

## Main concepts
Tmux has three levels: sessions, windows, and panes. 
A tmux session is a persistent terminal environment that can contain multiple windows and panes, allowing you to run and manage several processes in a single terminal window. Tmux sessions can help you to manage multiple projects, eg, different sessions can be created for different projects.
An example using common session commands is as follows.

```bash
tmux new -s afm # create a new session named 'afm'
tmux new -s paper_writing # create another session for writing paper.
tmux switch -t paper_writing # switch to the session 'paper_writing'.
tmux switch -t afm # switch to the session 'afm'.
```
Even you turn off the terminal, you only use 
```bash
tmux attach -t afm
```
or 
```bash
tmux attach -t 0
```
Then, all windows, comands, and processes will restore the state you are last time. Note: 0, is the the index of the session you want to reattach.


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

## Useful commands

```bash
prefix + %: Split the window vertically
prefix + ": Split the window horizontally
prefix + z: Maximize the current pane
```

## References


