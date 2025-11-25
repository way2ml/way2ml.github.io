---
title: How to use tmux to smooth my workflow
date: 2025-11-10
author: Jie Huang, Gang Huang
---

# Tmux is your friend
![](https://raw.githubusercontent.com/HuangJiaLian/DataBase0/master/uploads/screenshot_20251124_184829.png)

## What is tmux?
Tmux is a terminal multiplexer. It allows you to create several pseudo-terminals from a single terminal. It is useful for running multiple programs with a single connection, such as when you are connecting to a machine using SSH.

## Main concepts
Tmux has three levels: sessions, windows, and panes. 
A tmux session is a persistent terminal environment that can contain multiple windows and panes, allowing you to run and manage several processes in a single terminal window. Tmux sessions can help you to manage multiple projects, eg, different sessions can be created for different projects.

Common session commands are as follows.

```bash
tmux new -s afm # create a new session named 'afm'
tmux new -s paper_writing # create another session for writing a paper.
tmux switch -t paper_writing # switch to the session 'paper_writing'.
tmux switch -t afm # switch to the session 'afm'.
```
Even you turn off the terminal, you only use 
```bash
tmux attach -t afm # reattach the session 'afm'
```
or 
```bash
tmux attach -t 0
```
Then, all windows, comands, and processes will restore the state where you were at last time. Note: Here，0, is the index of the session you want to reattach.

Some other useful session commands are:
```bash
tmux ls # list the sessions
tmux kill-session -t mysession # kill the session named 'mysession'
tmux rename-session -t old new # Rename the old session to a new session name.
```

## How to save and restore sessions? 

1) First, install TPM, Tmux Plugin Manager.
Requirements: tmux version 1.9 (or higher), git, bash.
```bash
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```
2) Put this at the bottom of `~/.tmux.conf`:
```bash
# List of plugins
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-sensible'

# Other examples:
# set -g @plugin 'github_username/plugin_name'
# set -g @plugin 'github_username/plugin_name#branch'
# set -g @plugin 'git@github.com:user/plugin'
# set -g @plugin 'git@bitbucket.com:user/plugin'

# Initialize TMUX plugin manager (keep this line at the very bottom of tmux.conf)
run '~/.tmux/plugins/tpm/tpm'
```
3) Reload TMUX environment so TPM is sourced:
```bash
# type this in terminal if tmux is already running
tmux source ~/.tmux.conf
```
TPM is installed.
Then, hit prefix + I to fetch the plugin and source it. We should now be able to use the plugin.

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

## How to copy a piece of text in a tmux pane?
```bash
Shift (Option in Mac) + (selection text)  # Select and Copy
Command + V  # Paste 
```

## References


