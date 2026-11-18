<div align="center">
  <a href="README.md"><b>Saltworks</b></a>
</div>

# Security Policy

## Supported versions

Fixes go to the latest version on the default branch.
Older versions are not maintained.

## Reporting a vulnerability

Report security problems privately, and not through a public issue.

- Preferred: open a private security advisory with the "Report a vulnerability"
  button on the Security tab of this repository.
- Alternative: email the maintainer at stivenagostingjekaj@gmail.com.

Include the steps to reproduce, the affected commit, and the impact as you
understand it.
You can expect a first answer within a few days.
Your report gets an acknowledgement when the fix ships, unless you prefer to
stay anonymous.

## The threat model

**A mod runs inside Claude Code, with the rights of the person who runs it.**
A guard reads each command and each file path before Claude uses it.
A band runs `git` in the working directory.

**A guard is a second check, not the only one.**
A guard reads a shell command as text, and a shell command can hide what it
does. A guard catches the common form of a mistake. It does not stop a person
or a model that tries to get past it.

**These are in scope:**

- A mod that sends data over the network.
- A mod that reads or writes a file that its job does not need.
- A mod that runs a command other than the ones that its README names.
- A guard that lets a call through when its setting says to refuse it, for a
  plain form of the command that its README says it catches.
- A theme scene that loads anything from outside the mod.

**These are out of scope:**

- A guard that a command written to hide its intent gets past. A guard reads
  text, and a README names its limits.
- A report that a mod can see the commands that Claude runs. That is how a
  guard works.
- Findings from an automated scanner with no working demonstration.
