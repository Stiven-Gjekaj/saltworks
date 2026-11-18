export type PrState = 'open' | 'draft' | 'merged' | 'closed'
export type SessionRow = { id: string; title: string; isRunning: boolean; pr?: PrState }
export type AgentRow = { id: string; description: string; type: string; status: string }
export type Snapshot = { sessions: SessionRow[]; agents: AgentRow[] }

declare module 'claude-code' {
  interface PluginState {
    'sessions-band': { snapshot: Shaped<Snapshot | null>; isCollapsed: boolean | null }
  }
}
