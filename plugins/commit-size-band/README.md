<div align="center">
  <a href="../../README.md"><b>Saltworks</b></a>
</div>

# commit-size-band

Shows the size of the next commit above the prompt.

## Install

At the prompt of a Claude Code session in a terminal:

```
/plugin install commit-size-band --marketplace Stiven-Gjekaj/saltworks
```

Answer `y` to add the marketplace, then pick the user scope.

## What it does

A row above the prompt shows the staged files and lines:

```
Staged: 3 files, +42 -7
```

The row turns amber when the staged change has more files or more lines than
the limits, and asks you to split it.
The row is hidden when nothing is staged, or when the folder is not a git
repository.

## Settings

| Setting | What it does | Default |
| --- | --- | --- |
| `maxFiles` | The most files in one commit. | `5` |
| `maxLines` | The most changed lines in one commit. | `300` |

## Limits

- The band reads `git diff --cached` at the start of the session, after a
  shell command that runs `git`, and at the end of each turn. A change that you
  stage in another program shows at the end of the next turn.
