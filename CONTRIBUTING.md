<div align="center">
  <a href="README.md"><b>Saltworks</b></a>
</div>

# Contributing to Saltworks

Thanks for your interest in Saltworks, a set of mods for Claude Code.
Contributions of all kinds are welcome: bug reports, a new mod, a new setting,
documentation fixes, and arguments against a decision that is already made.

A mod is TypeScript, and the gate needs only Claude Code.

    scripts/check.sh

That command validates each mod and runs its tests.
It needs Claude Code 2.1.325 or newer.

## Ways to contribute

- Report a command that a guard blocks and should not, or lets through and
  should not. Copy the exact command into the report.
- Add a setting to a mod, for a rule that a person can disagree with.
- Add a mod. Open an issue first, so that we agree that it is one job.
- Make a theme. A theme needs a scene of its own, not a copy of somebody
  else's art.
- Improve the documentation.

Before you start significant work, open an issue to agree on the approach.
This costs you one message and can save you a rewritten pull request.

## The rule that comes before all the others

**One mod does one job.**

A person installs each mod alone.
A mod that does two jobs makes them take the second job to get the first.
If a change gives a mod a second job, make a new mod.

## How a mod is laid out

    plugins/<mod>/
      .claude-plugin/plugin.json   the name, the description and the settings
      hooks/hooks.json             names the hooks module
      hooks/register.ts            connects the rules to the events
      hooks/<rules>.ts             pure functions: all the decisions
      hooks/<rules>.test.ts        the tests
      README.md                    what the mod does, its settings, its limits

**Put each decision in a pure function.**
A pure function takes text and gives an answer, and a test can call it with no
session.
`register.ts` only connects those functions to the events.

**Each rule that a person can disagree with is a setting.**
Declare it under `userConfig` in `plugin.json`, read it in `register`, and give
it a default that most people want.

## What a test can hold on to

- A test builds the state that it needs inside itself. It does not read a file
  from your machine or a value from your settings.
- A test passes the settings that it needs with `test(name, { options }, body)`.
- Write a character that a rule refuses as a code point, such as
  `String.fromCharCode(0x2014)`. Then the test file itself obeys the rules, and
  a guard that reads the file does not refuse it.
- A test that a guard refuses a call must also show that a correct call runs.
  A guard that refuses everything passes the first test alone.

## What a guard must never do

- Refuse a call with no reason. The reason tells Claude what to do instead.
- Block a call when its own check fails with an error, unless the rule is a
  safety rule. Say which one it is in a comment.
- Read a file or a setting that the person did not give it.
- Send anything over the network.

## Commit messages and pull requests

[`AGENTS.md`](AGENTS.md) is the full set of rules. These four cause the most
rework.

- **One change per commit, and a feature is many commits.** A commit that says
  "add the full mod" is wrong even when the code is right. Split it into the
  steps that a reviewer can read and revert one at a time.
- **Code and its tests go in one commit. Documentation goes in its own.**
- **All text uses Simplified Technical English.** Short sentences, active voice,
  present tense. No em-dashes and no emoji, in source, comments, documentation,
  commit messages, or pull requests.
- **Write the subject in the present tense, with no version number.** A commit
  changes no version.

In the pull request, describe what changed and why, and say how you tested it.
Name the Claude Code version and the surface: the terminal, the desktop app or
the mobile app.

## Reporting security issues

Do not open a public issue for a security problem.
See [SECURITY.md](SECURITY.md) for how to report it privately.

## Code of conduct

By taking part in this project you agree to follow the
[Code of Conduct](CODE_OF_CONDUCT.md).
