<div align="center">
  <a href="../../README.md"><b>Saltworks</b></a>
</div>

# readonly-guard

Keeps folders that you name read only.

## Install

At the prompt of a Claude Code session in a terminal:

```
/plugin install readonly-guard --marketplace Stiven-Gjekaj/saltworks
```

Answer `y` to add the marketplace, then pick the user scope.

## What it does

The guard refuses an Edit, a Write or a notebook edit of a file in a read-only
folder. It also refuses the common shell commands that change such a file:
`rm`, `mv`, `touch`, `mkdir`, `chmod`, `sed -i`, `tee`, a `>` redirect, and a
`cp` or `rsync` that writes into the folder.

A copy out of the folder works. The reason tells Claude to copy the file out
first and change the copy.

## Settings

| Setting | What it does | Default |
| --- | --- | --- |
| `folders` | A comma-separated list. A plain name, such as `Materials`, matches that folder at any depth. A path, such as `~/vault`, matches that folder and all below it. | `Materials` |

## Limits

- The guard reads a shell command as text. A script, a program, or a command
  that builds a path from a variable can still change the folder.
