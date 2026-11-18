<div align="center">
  <a href="README.md"><img src="assets/logo.svg" alt="Saltworks" height="44"></a>
</div>

# Changelog

Every release is written here, newest first. A version is `MAJOR.MINOR.PATCH`.
Each mod carries the version of the release that last changed it.

## Unreleased

### Added

- `salt-moon`: a dark theme. A dithered salt flat under a crescent moon.
- `salt-moon-dawn`: a light theme. The same salt flat at dawn, under a low sun.
- `commit-guard`: blocks a commit or a pull request text with an attribution
  line, an em-dash, an emoji, a version in the subject, or the wrong git
  identity. Each rule is a setting. Conventional Commits is a setting that is
  off by default.
- `push-guard`: asks before `git push`, a pull request, a release or a new
  repository.
- `readonly-guard`: keeps folders that you name read only.
- `delete-guard`: blocks a recursive delete of a folder that Claude did not
  list first.
- `style-linter`: blocks an em-dash or an emoji that Claude adds to a file, and
  notes passive voice in prose files.
- `commit-size-band`: shows the staged size above the prompt.
- `sessions-band`: shows the linked sessions and the subagents that run.
