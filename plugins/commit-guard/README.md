<div align="center">
  <a href="../../README.md"><b>Saltworks</b></a>
</div>

# commit-guard

Blocks a git commit or a pull request text that breaks a rule that you turn on.

## Install

At the prompt of a Claude Code session in a terminal:

```
/plugin install commit-guard --marketplace Stiven-Gjekaj/saltworks
```

Answer `y` to add the marketplace, then pick the user scope.

## What it does

Before Claude runs `git commit`, the guard reads the command. It refuses the
commit when the message has:

- a `Co-Authored-By` line, or a footer that says a tool made the text,
- an em-dash,
- an emoji,
- a version number in the subject, such as `v1.2.0`,
- a subject that is not a Conventional Commit, when you turn that rule on.

When you set a git name or a git email, the guard also refuses a commit that
git would write with another identity. The reason tells Claude the
`git config` command that fixes it.

The text rules also apply to `gh pr create`, `edit`, `comment` and `review`.

## Settings

| Setting | What it does | Default |
| --- | --- | --- |
| `gitName` | The name that each commit must carry. Empty skips the check. | empty |
| `gitEmail` | The email that each commit must carry. Empty skips the check. | empty |
| `attribution` | Block attribution lines and tool footers. | on |
| `emDash` | Block an em-dash. | on |
| `emoji` | Block an emoji. | on |
| `versionInSubject` | Block a version number in the subject. | on |
| `conventional` | Require a Conventional Commit subject. | off |
| `prText` | Apply the text rules to pull request text. | on |

Set them in `/config`, or under
`pluginConfigs["commit-guard@saltworks"].options` in `~/.claude/settings.json`.

## Limits

- The guard reads the command as text. It finds `git commit` and `gh pr` where a
  command starts, also after `&&` or `;`.
- It does not read a message file that `git commit -F <file>` names.
- It checks the identity in the working directory of the session. A commit in
  another folder, with `cd` or `git -C`, is checked against this folder.
