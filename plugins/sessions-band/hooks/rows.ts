import type { AgentRow, SessionRow } from '../types'

/** One row of the desktop app's list_sessions answer. Only the fields that the band uses. */
type Listed = { sessionId?: unknown; title?: unknown; isRunning?: unknown; isArchived?: unknown; prState?: unknown }

const MAX_TITLE = 40

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
    const pr = typeof row.prState === 'string' ? `, PR ${row.prState.toLowerCase()}` : ''
    const title = typeof row.title === 'string' ? row.title : '(no title)'

    return [{ id: row.sessionId, title: clip(title), state: (row.isRunning === true ? 'running' : 'idle') + pr }]
  })
}

function clip(text: string): string {
  return text.length > MAX_TITLE ? `${text.slice(0, MAX_TITLE - 3)}...` : text
}

const ACTIVE = new Set(['pending', 'running', 'waiting'])

/** The sessions line, or undefined when there is no linked session. */
export function sessionsLine(rows: readonly SessionRow[]): string | undefined {
  return rows.length === 0 ? undefined : `Sessions: ${rows.map(r => `${r.title} (${r.state})`).join(', ')}`
}

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
