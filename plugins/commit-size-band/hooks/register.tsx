import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Staged } from '../types'
import { isTooBig, limitsFrom, parseNumstat } from './size'

const staged = atom({ plugin: 'commit-size-band', key: 'staged' } as const, null, { shape: 'staged-1' })

/** Read the staged changes again. Outside a git repository the band shows nothing. */
async function refresh($: EngineInterface): Promise<void> {
  const ran = await $.process.run(['git', 'diff', '--cached', '--numstat'])
  const next: Staged | null = ran.exitCode === 0 ? parseNumstat(ran.stdout) : null

  await update($, staged, () => next)
}

export const register: Register = (on, options) => {
  const limits = limitsFrom(options)

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await refresh($).catch(() => undefined)

    return started
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)

    if (/\bgit\b/.test(e.command)) {
      await refresh($).catch(() => undefined)
    }

    return ran
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    await refresh($).catch(() => undefined)

    return next(e)
  })

  // With nothing staged, take this mod's row out of the band, so an empty band stays hidden.
  on('ui.render', { component: 'AbovePromptList', plugin: '*' }, async ($, e, next) => {
    const now = await read($, staged)
    const isEmpty = now === null || now.files === 0

    return isEmpty ? next({ ...e, props: { ...e.props, rows: e.props.rows.filter(row => row.plugin !== 'commit-size-band') } }) : next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const now = await read($, staged)

    if (e.props.hasSurvey || now === null || now.files === 0) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const isBig = isTooBig(now, limits)

    return (
      <Box>
        <Text color={isBig ? 'warning' : undefined} dimColor={!isBig}>
          Staged: {now.files} {now.files === 1 ? 'file' : 'files'}, +{now.added} -{now.removed}
          {isBig ? `. Too big for one commit (max ${limits.maxFiles} files or ${limits.maxLines} lines). Split it.` : ''}
        </Text>
      </Box>
    )
  })
}
