import type { Register } from 'claude-code'

import { modeFrom, sendOf } from './push'

export const register: Register = (on, options) => {
  const mode = modeFrom(options)

  // A tool.check hook decides about the call before it runs. Its "ask" goes to the person,
  // also in a mode that allows all other calls.
  on('tool.check', { tool: 'Bash' }, async ($, e, next) => {
    const input = e.input as { command?: unknown }
    const send = typeof input.command === 'string' ? sendOf(input.command) : undefined

    if (send === undefined) {
      return next(e)
    }
    if (mode === 'deny') {
      return { decision: 'deny', reason: `push-guard: ${send} needs the person. Ask them to run it.` }
    }

    return { decision: 'ask', reason: `push-guard: this command makes ${send}. Allow it?` }
  }).catch(($, e, next) => (next.called ? next(e) : { decision: 'ask', reason: 'push-guard: its check failed, so it asks.' }))
}
