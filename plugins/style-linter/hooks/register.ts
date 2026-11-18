import type { EngineInterface, Register, ToolCallResult } from 'claude-code'

import { addedFaults, addedPassive, checksFrom, isData } from './lint'

async function current($: EngineInterface, path: string): Promise<string> {
  try {
    const text = await $.fs.read(path)

    return typeof text === 'string' ? text : ''
  } catch {
    return ''
  }
}

/** Add a note about passive voice to what the model reads after the result. */
function withNote(ran: ToolCallResult, passive: readonly string[]): ToolCallResult {
  if (passive.length === 0 || ran.deny !== undefined) {
    return ran
  }
  const note = `style-linter: the new text may use the passive voice: ${passive.map(p => `"${p}"`).join(', ')}. Use the active voice where you can.`

  return { ...ran, context: [...(ran.context ?? []), note] }
}

export const register: Register = (on, options) => {
  const checks = checksFrom(options)

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    if (isData(e.file_path)) {
      return next(e)
    }
    const before = await current($, e.file_path)
    const faults = addedFaults(before, e.content, checks)

    if (faults.length > 0) {
      return { deny: `style-linter: this write to ${e.file_path} breaks a style rule: ${faults.join('; ')}.` }
    }

    return withNote(await next(e), addedPassive(e.file_path, before, e.content, checks))
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    if (isData(e.file_path)) {
      return next(e)
    }
    const faults = addedFaults(e.old_string, e.new_string, checks)

    if (faults.length > 0) {
      return { deny: `style-linter: this edit to ${e.file_path} breaks a style rule: ${faults.join('; ')}.` }
    }

    return withNote(await next(e), addedPassive(e.file_path, e.old_string, e.new_string, checks))
  }).catch(($, e, next) => next(e))
}
