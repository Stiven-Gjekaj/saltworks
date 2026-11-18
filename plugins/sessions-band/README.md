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

Up to two rows above the prompt:

```
Sessions: Parser work (running), Docs (idle, PR merged)
Subagents: Search the docs (running), 1 done
```

- **Sessions** are the sessions linked to this one: the one that started it,
  and the ones that it started. Archived sessions are left out.
- **Subagents** are the ones that still run, with a count of those that are
  done.

The band is hidden when it has nothing to show.

## Limits

- The list of sessions comes from the Claude desktop app. In the terminal the
  band shows subagents only.
- The band reads the lists at the start of the session, when a subagent starts,
  at the end of each turn, and every 30 seconds.
