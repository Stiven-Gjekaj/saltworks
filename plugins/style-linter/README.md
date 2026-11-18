<div align="center">
  <a href="../../README.md"><b>Saltworks</b></a>
</div>

# style-linter

Keeps em-dashes and emoji out of the files that Claude writes.

## Install

At the prompt of a Claude Code session in a terminal:

```
/plugin install style-linter --marketplace Stiven-Gjekaj/saltworks
```

Answer `y` to add the marketplace, then pick the user scope.

## What it does

- Refuses a Write or an Edit that adds an em-dash to a file. A file that
  already has one can keep it.
- Refuses a Write or an Edit that adds an emoji.
- In a prose file (`.md`, `.txt`, `.rst` and similar), gives Claude a note when
  the new text may use the passive voice. The note does not block the write.

Data files, such as `.json`, `.svg` and images, are not checked.

## Settings

| Setting | What it does | Default |
| --- | --- | --- |
| `emDash` | Block an added em-dash. | on |
| `emoji` | Block an added emoji. | on |
| `passive` | Note passive voice in prose files. | on |

## Limits

- The passive-voice check is a word pattern, so it can be wrong. That is why it
  gives a note and does not block.
- A file that a shell command writes is not checked.
