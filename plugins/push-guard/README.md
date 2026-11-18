<div align="center">
  <a href="../../README.md"><b>Saltworks</b></a>
</div>

# push-guard

Asks you before Claude sends work to a remote.

## Install

At the prompt of a Claude Code session in a terminal:

```
/plugin install push-guard --marketplace Stiven-Gjekaj/saltworks
```

Answer `y` to add the marketplace, then pick the user scope.

## What it does

Before Claude runs one of these commands, the guard puts it to you:

- `git push`,
- `gh pr create` and `gh pr merge`,
- `gh release create`,
- `gh repo create`.

The guard asks also in a mode that allows all other commands. Where nobody can
answer, as in a run with no person, the command is refused.

## Settings

| Setting | What it does | Default |
| --- | --- | --- |
| `mode` | `ask` puts each command to you. `deny` refuses it, so that only you can run it. | `ask` |

## Limits

- The guard reads the command as text. It finds a command where a command
  starts, also after `&&` or `;`. A push inside a script that Claude runs is
  not found.
