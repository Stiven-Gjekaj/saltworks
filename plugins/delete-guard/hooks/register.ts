import type { Register } from 'claude-code'

import { deletedBy, isVague, listedBy, resolve } from './paths'

export const register: Register = on => {
  /** The folders that Claude listed in this session, as full paths. A reload starts the list again. */
  const listed = new Set<string>()
  let home = ''

  on('session.start', async ($, e, next) => {
    home = (await $.env.get('HOME').catch(() => undefined)) ?? ''

    return next(e)
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const cwd = await $.session.cwd()
    const targets = deletedBy(e.command)

    for (const target of targets) {
      if (isVague(target)) {
        return { deny: `delete-guard: "${target}" has a wildcard or a variable. Name each folder, and list it first.` }
      }
      if (!listed.has(resolve(target, cwd, home))) {
        return { deny: `delete-guard: list "${target}" first (for example with ls -la), and look at what it holds. Then delete it.` }
      }
    }
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError !== true) {
      for (const path of listedBy(e.command)) {
        listed.add(resolve(path, cwd, home))
      }
    }

    return ran
  }).catch(($, e, next) => (next.called ? next(e) : { deny: 'delete-guard: its check failed.' }))
}
