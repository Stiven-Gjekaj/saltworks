import type { ThemeKey } from 'claude-code'

import type { AgentRow, PrState, SessionRow } from '../types'

/** One row of the desktop app's list_sessions answer. Only the fields that the band uses. */
type Listed = { sessionId?: unknown; title?: unknown; isRunning?: unknown; isArchived?: unknown; prState?: unknown }

const MAX_TITLE = 40
const PR_STATES: readonly PrState[] = ['open', 'draft', 'merged', 'closed']

/** Read the JSON text of list_sessions into rows. Text of another shape gives no rows. Archived sessions are left out. */
export function parseSessions(text: string): SessionRow[] {
  let data: unknown

  try {
    data = JSON.parse(text)
  } catch {
    return []
  }
  if (!Array.isArray(data)) {
    return []
  }

  return (data as Listed[]).flatMap(row => {
    if (typeof row.sessionId !== 'string' || row.isArchived === true) {
      return []
    }
    const state = typeof row.prState === 'string' ? row.prState.toLowerCase() : ''
    const pr = PR_STATES.find(known => known === state)
    const title = typeof row.title === 'string' ? row.title : '(no title)'
    const out: SessionRow = { id: row.sessionId, title: clip(title), isRunning: row.isRunning === true }

    return [pr === undefined ? out : { ...out, pr }]
  })
}

function clip(text: string): string {
  return text.length > MAX_TITLE ? `${text.slice(0, MAX_TITLE - 3)}...` : text
}

/** A mark and its color. The marks are plain symbols, not emoji, and each one has the same width. */
export type Icon = { mark: string; color: ThemeKey }

/** The mark of a session that runs, or of one that waits. */
export function stateIcon(row: SessionRow): Icon {
  return row.isRunning ? { mark: '●', color: 'success' } : { mark: '○', color: 'inactive' }
}

/** The mark of the pull request of a session, or undefined when it has none. */
export function prIcon(row: SessionRow): Icon | undefined {
  switch (row.pr) {
    case 'open':
      return { mark: '↑', color: 'suggestion' }
    case 'draft':
      return { mark: '◌', color: 'inactive' }
    case 'merged':
      return { mark: '✓', color: 'merged' }
    case 'closed':
      return { mark: '✗', color: 'error' }
    default:
      return undefined
  }
}

/** A list longer than this starts collapsed, until the person opens it. */
export const AUTO_COLLAPSE = 6
/** An open list shows this many sessions, then a count of the rest. */
export const MAX_SHOWN = 10

/** The person's choice wins. With no choice, a long list starts collapsed. */
export function isCollapsedFor(choice: boolean | null, count: number): boolean {
  return choice ?? count > AUTO_COLLAPSE
}

/** How many sessions run and how many wait. */
export function countOf(rows: readonly SessionRow[]): { running: number; idle: number } {
  const running = rows.filter(row => row.isRunning).length

  return { running, idle: rows.length - running }
}

const ACTIVE = new Set(['pending', 'running', 'waiting'])

/** The subagents line: the active ones by name, the finished ones as a count. Undefined when none is active. */
export function agentsLine(rows: readonly AgentRow[]): string | undefined {
  const active = rows.filter(r => ACTIVE.has(r.status))

  if (active.length === 0) {
    return undefined
  }
  const done = rows.length - active.length
  const names = active.map(r => `${clip(r.description || r.type)} (${r.status})`).join(', ')

  return `Subagents: ${names}${done > 0 ? `, ${done} done` : ''}`
}
