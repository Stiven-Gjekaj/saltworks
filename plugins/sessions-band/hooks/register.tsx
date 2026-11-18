import { atom, read, update } from 'claude-code'
import type { EngineInterface, McpToolResult, Register } from 'claude-code'

import type { Snapshot } from '../types'
import { agentsLine, parseSessions, sessionsLine } from './rows'

const SERVER = 'ccd_session_mgmt'
/** The id of the side pane that the earlier version of this mod opened. */
const OLD_PANE = 'sessions'
const snapshot = atom({ plugin: 'sessions-band', key: 'snapshot' } as const, null, { shape: 'snapshot-1' })

const PLUGIN = 'sessions-band'

function linesOf(now: Snapshot | null): string[] {
  return now === null ? [] : [sessionsLine(now.sessions), agentsLine(now.agents)].filter(l => l !== undefined)
}

function textOf(result: McpToolResult): string {
  return result.content.flatMap(block => (block.type === 'text' ? [block.text] : [])).join('')
}

async function refresh($: EngineInterface): Promise<void> {
  const [sessions, agents] = await Promise.all([
    // The app's linked sessions. A host without the app's session server, as a terminal, gives none.
    $.mcp
      .call(SERVER, 'list_sessions', { linked: true })
      .then(result => (result.isError ? [] : parseSessions(textOf(result))))
      .catch(() => []),
    $.agent.list().catch(() => []),
  ])
  const next: Snapshot = {
    sessions: sessions.slice(0, 6),
    agents: agents.map(a => ({ id: a.id, description: a.description, type: a.type, status: a.status })),
  }

  await update($, snapshot, () => next)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.ui.close({ id: OLD_PANE }).catch(() => undefined)
    await refresh($).catch(() => undefined)

    try {
      // Read the lists again each 30 seconds. A host without timers keeps the other refreshes only.
      $.clock.every(30_000, () => void refresh($).catch(() => undefined))
    } catch {
      // No timer here.
    }

    return started
  })

  on('agent.spawn', async ($, e, next) => {
    const spawned = await next(e)
    await refresh($).catch(() => undefined)

    return spawned
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    await refresh($).catch(() => undefined)

    return next(e)
  })

  // With nothing to show, take this mod's row out of the band, so an empty band stays hidden.
  on('ui.render', { component: 'AbovePromptList', plugin: '*' }, async ($, e, next) => {
    const lines = linesOf(await read($, snapshot))

    return lines.length > 0 ? next(e) : next({ ...e, props: { ...e.props, rows: e.props.rows.filter(row => row.plugin !== PLUGIN) } })
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const lines = linesOf(await read($, snapshot))

    if (e.props.hasSurvey || lines.length === 0) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {lines.map(line => (
          <Text dimColor>{line}</Text>
        ))}
      </Box>
    )
  })
}
