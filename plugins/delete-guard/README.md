<div align="center">
  <a href="../../README.md"><b>Saltworks</b></a>
</div>

# delete-guard

Makes Claude look in a folder before it deletes the folder.

## Install

At the prompt of a Claude Code session in a terminal:

```
/plugin install delete-guard --marketplace Stiven-Gjekaj/saltworks
```

Answer `y` to add the marketplace, then pick the user scope.

## What it does

The guard refuses `rm -r` (and `-rf`, `-R`, `--recursive`) on a folder until
Claude lists that folder in the session with `ls`, `find`, `tree`, `eza` or
`fd`. A size, as from `du`, does not count: a size does not show what a folder
holds.

It also refuses a recursive delete of a path with a wildcard or a variable,
because the folder that the path names is not known.

A delete of a plain file runs.

## Limits

- The guard reads the command as text, and resolves a path against the working
  directory of the session. A `cd` earlier in the same command is not followed.
- The list of folders starts again when the mod reloads.
- `find -delete`, `git clean` and a script that deletes are not checked.
