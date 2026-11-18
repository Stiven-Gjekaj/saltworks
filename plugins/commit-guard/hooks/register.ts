import type { Register } from 'claude-code'

import { commitFaults, identityFaults, isCommit, isPrText, rulesFrom, textFaults } from './rules'

export const register: Register = (on, options) => {
  const rules = rulesFrom(options)
  const isIdentityOn = rules.gitName !== '' || rules.gitEmail !== ''

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const command = e.command

    if (isPrText(command)) {
      const faults = rules.prText ? textFaults(command, rules) : []

      return faults.length === 0 ? next(e) : { deny: `commit-guard: the PR text breaks a rule: ${faults.join('; ')}.` }
    }
    if (!isCommit(command)) {
      return next(e)
    }
    const faults = commitFaults(command, rules)

    if (isIdentityOn) {
      const [name, email] = await Promise.all([
        $.process.run(['git', 'config', 'user.name']),
        $.process.run(['git', 'config', 'user.email']),
      ])
      faults.push(...identityFaults(name.stdout.trim(), email.stdout.trim(), rules))
    }

    return faults.length === 0 ? next(e) : { deny: `commit-guard: the commit breaks a rule: ${faults.join('; ')}.` }
  }).catch(($, e, next) => (next.called ? next(e) : { deny: 'commit-guard: its check failed. Run the commit again.' }))
}
