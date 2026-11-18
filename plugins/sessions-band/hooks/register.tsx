import { atom, read, update } from 'claude-code'
import type { EngineInterface, McpToolResult, Register } from 'claude-code'

import type { Snapshot } from '../types'
import { agentsLine, countOf, isCollapsedFor, MAX_SHOWN, parseSessions, prIcon, stateIcon } from './rows'

const PLUGIN = 'sessions-band'
const SERVER = 'ccd_session_mgmt'
// The tag changes when the shape of a row changes, so that a value from an earlier version is declined.
const snapshot = atom({ plugin: 'sessions-band', key: 'snapshot' } as const, null, { shape: 'snapshot-2' })
/** The person's choice to collapse or open the list. Null: no choice yet, so the length decides. */
const collapsed = atom({ plugin: 'sessions-band', key: 'isCollapsed' } as const, null)

/** True when the band has something to show. */
function hasContent(now: Snapshot | null): now is Snapshot {
  return now !== null && (now.sessions.length > 0 || agentsLine(now.agents) !== undefined)
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
    sessions,
    agents: agents.map(a => ({ id: a.id, description: a.description, type: a.type, status: a.status })),
  }

  await update($, snapshot, () => next)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
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
    const isEmpty = !hasContent(await read($, snapshot))

    return isEmpty ? next({ ...e, props: { ...e.props, rows: e.props.rows.filter(row => row.plugin !== PLUGIN) } }) : next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const now = await read($, snapshot)

    if (e.props.hasSurvey || !hasContent(now)) {
      return next(e)
    }

    const { Box, Text, Button } = $.ui.resolve(e)
    const agents = agentsLine(now.agents)
    const isCollapsed = isCollapsedFor(await read($, collapsed), now.sessions.length)
    const count = countOf(now.sessions)
    const shown = now.sessions.slice(0, MAX_SHOWN)
    const hidden = now.sessions.length - shown.length
    const toggle = (
      <Button
        key="sessions-toggle"
        label={isCollapsed ? 'Show' : 'Hide'}
        hotkey="s"
        plain
        dimColor
        onPress={() => update($, collapsed, () => !isCollapsed)}
      />
    )

    return (
      <Box flexDirection="column">
        {now.sessions.length > 0 && (
          <Box flexDirection="row">
            <Text dimColor>{`Sessions (${now.sessions.length})`}</Text>
            {isCollapsed && <Text color="success">{`  \u25cf ${count.running}`}</Text>}
            {isCollapsed && <Text color="inactive">{`  \u25cb ${count.idle}`}</Text>}
            <Text> </Text>
            {toggle}
          </Box>
        )}
        {!isCollapsed &&
          shown.map(row => {
            const state = stateIcon(row)
            const pr = prIcon(row)

            return (
              <Box flexDirection="row">
                <Text color={state.color}>{`  ${state.mark} `}</Text>
                <Text>{row.title}</Text>
                {pr !== undefined && <Text color={pr.color}>{` ${pr.mark}`}</Text>}
              </Box>
            )
          })}
        {!isCollapsed && hidden > 0 && <Text dimColor>{`  and ${hidden} more`}</Text>}
        {agents !== undefined && <Text dimColor>{agents}</Text>}
      </Box>
    )
  })
}
