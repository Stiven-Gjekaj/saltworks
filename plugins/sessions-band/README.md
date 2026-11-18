<div align="center">
  <a href="../../README.md"><b>Saltworks</b></a>
</div>

# sessions-band

Shows the work in progress above the prompt.

## Install

At the prompt of a Claude Code session in a terminal:

```
/plugin install sessions-band --marketplace Stiven-Gjekaj/saltworks
```

Answer `y` to add the marketplace, then pick the user scope.

## What it does

A list above the prompt, with one row for each session:

```
Sessions (3)  Hide
  ● Parser work
  ○ Docs ✓
  ○ Release notes ↑
Subagents: Search the docs (running), 1 done
```

- **Sessions** are the sessions linked to this one: the one that started it,
  and the ones that it started. Archived sessions are left out.
- **Subagents** are the ones that still run, with a count of those that are
  done.

The band is hidden when it has nothing to show.

### The icons

| Icon | Meaning |
| --- | --- |
| ● | The session runs. |
| ○ | The session waits. |
| ↑ | Its pull request is open. |
| ◌ | Its pull request is a draft. |
| ✓ | Its pull request is merged. |
| ✗ | Its pull request is closed. |

The icons are plain symbols, not emoji.

### A long list

**Hide** collapses the list to one row of counts, and **Show** opens it again:

```
Sessions (14)  ● 4  ○ 10  Show
```

A list of more than 6 sessions starts collapsed. After you press the button,
the band keeps your choice for the rest of the session.
An open list shows 10 sessions, then a count of the rest.
When the band has focus (ctrl+x tab), the key `s` presses the button.

## Limits

- The list of sessions comes from the Claude desktop app. In the terminal the
  band shows subagents only.
- The band reads the lists at the start of the session, when a subagent starts,
  at the end of each turn, and every 30 seconds.
