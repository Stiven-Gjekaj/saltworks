export type Staged = { files: number; added: number; removed: number }

declare module 'claude-code' {
  interface PluginState {
    'commit-size-band': { staged: Shaped<Staged | null> }
  }
}
