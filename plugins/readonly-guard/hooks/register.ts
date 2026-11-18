import type { Register } from 'claude-code'

import { bashTarget, folderOf, foldersFrom } from './paths'

function refusal(folder: string): { deny: string } {
  return { deny: `readonly-guard: "${folder}" is read only. Copy the file out of it first, then change the copy.` }
}

export const register: Register = (on, options) => {
  const folders = foldersFrom(options)
  let home = ''

  on('session.start', async ($, e, next) => {
    home = (await $.env.get('HOME').catch(() => undefined)) ?? ''

    return next(e)
  })

  on('tool.call', { tool: ['Edit', 'Write'] }, ($, e, next) => {
    const folder = folderOf(e.file_path, folders, home)

    return folder === undefined ? next(e) : refusal(folder)
  }).catch(($, e, next) => (next.called ? next(e) : { deny: 'readonly-guard: its check failed.' }))

  on('tool.call', { tool: 'NotebookEdit' }, ($, e, next) => {
    const folder = folderOf(e.notebook_path, folders, home)

    return folder === undefined ? next(e) : refusal(folder)
  }).catch(($, e, next) => (next.called ? next(e) : { deny: 'readonly-guard: its check failed.' }))

  on('tool.call', { tool: 'Bash' }, ($, e, next) => {
    const folder = bashTarget(e.command, folders, home)

    return folder === undefined ? next(e) : refusal(folder)
  }).catch(($, e, next) => (next.called ? next(e) : { deny: 'readonly-guard: its check failed.' }))
}
