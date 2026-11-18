import { expect, test } from 'claude-code/testing'

import { agentsLine, parseSessions, sessionsLine } from './rows'

const BAND = {
  plugin: 'sessions-band',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 10, bodyColumns: 80, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

const LINKED = JSON.stringify([
  { sessionId: 'local_a', title: 'Parser work', isRunning: true, isArchived: false },
  { sessionId: 'local_b', title: 'Docs', isRunning: false, isArchived: false, prState: 'MERGED' },
  { sessionId: 'local_c', title: 'Old', isRunning: false, isArchived: true },
])

const AGENTS = [
  { id: 'a1', description: 'Search the docs', type: 'Explore', status: 'running' as const },
  { id: 'a2', description: 'Read the tests', type: 'Explore', status: 'completed' as const },
]

test('the lines name linked sessions and active subagents', () => {
  const rows = parseSessions(LINKED)

  expect(sessionsLine(rows)).toBe('Sessions: Parser work (running), Docs (idle, PR merged)')
  expect(sessionsLine([])).toBe(undefined)
  expect(agentsLine(AGENTS)).toBe('Subagents: Search the docs (running), 1 done')
  expect(agentsLine([AGENTS[1]!])).toBe(undefined)
  expect(parseSessions('not json')).toEqual([])
})

test('the band shows both lines, on every surface', async ($, on) => {
  on('mcp.call', (_, e) => ({ value: { isError: false, content: [{ type: 'text', text: e.args?.linked === true ? LINKED : '[]' }] } }))
  on('agent.list', () => ({ value: AGENTS }))
  on('clock.every', () => ({ value: undefined }))
  on('ui.close', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: /^Sessions/ }))?.text).toMatch(/Parser work \(running\)/)
    expect((await ui.find({ type: 'Text', text: /^Subagents/ }))?.text).toMatch(/Search the docs/)
    await ui.unmount()
  }
})

test('with nothing linked and no active subagent the band leaves the row to the engine', async ($, on) => {
  on('mcp.call', () => {
    throw new Error('no server')
  })
  on('agent.list', () => ({ value: [] }))
  on('clock.every', () => ({ value: undefined }))
  on('ui.close', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()
})

test('with nothing to show the band list drops this row and keeps the others', async ($, on) => {
  on('mcp.call', () => ({ value: { isError: false, content: [{ type: 'text', text: 'No other sessions found.' }] } }))
  on('agent.list', () => ({ value: [] }))
  on('clock.every', () => ({ value: undefined }))
  on('ui.close', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  // Two plain row trees: this mod's and one of another plugin.
  const mine = h('Text', null, 'mine') as never
  const other = h('Text', null, 'other') as never
  const ui = await $.ui.mount({
    plugin: 'sessions-band',
    component: 'AbovePromptList',
    surface: 'desktop',
    props: { ...BAND.props, rows: [{ plugin: 'sessions-band', tree: mine }, { plugin: 'other', tree: other }] },
  })

  const drawn = (await ui.findAll({ type: 'Text' })).map(found => found.text)

  expect(drawn).toEqual(['other'])
  await ui.unmount()
})
