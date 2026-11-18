import { expect, test } from 'claude-code/testing'

import { agentsLine, countOf, isCollapsedFor, parseSessions, prIcon, stateIcon } from './rows'

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

const RUNNING = '●'
const IDLE = '○'
const MERGED = '✓'

test('rows carry the state and the pull request, and each has an icon', () => {
  const rows = parseSessions(LINKED)

  expect(rows).toEqual([
    { id: 'local_a', title: 'Parser work', isRunning: true },
    { id: 'local_b', title: 'Docs', isRunning: false, pr: 'merged' },
  ])
  expect(stateIcon(rows[0]!)).toEqual({ mark: RUNNING, color: 'success' })
  expect(stateIcon(rows[1]!).mark).toBe(IDLE)
  expect(prIcon(rows[0]!)).toBe(undefined)
  expect(prIcon(rows[1]!)).toEqual({ mark: MERGED, color: 'merged' })
  expect(prIcon({ id: 'x', title: 'x', isRunning: false, pr: 'closed' })?.color).toBe('error')
  expect(parseSessions('not json')).toEqual([])
})

test('no icon is an emoji', () => {
  const states = [true, false].map(isRunning => stateIcon({ id: 'x', title: 'x', isRunning }))
  const prs = (['open', 'draft', 'merged', 'closed'] as const).map(pr => prIcon({ id: 'x', title: 'x', isRunning: false, pr }))
  const marks = [...states, ...prs].map(icon => icon?.mark ?? '')

  expect(marks.every(mark => mark.length === 1 && !/\p{Extended_Pictographic}/u.test(mark))).toBe(true)
})

test('the subagents line names the active ones and counts the rest', () => {
  expect(agentsLine(AGENTS)).toBe('Subagents: Search the docs (running), 1 done')
  expect(agentsLine([AGENTS[1]!])).toBe(undefined)
})

test('the band lists each session on its own row, on every surface', async ($, on) => {
  on('mcp.call', (_, e) => ({ value: { isError: false, content: [{ type: 'text', text: e.args?.linked === true ? LINKED : '[]' }] } }))
  on('agent.list', () => ({ value: AGENTS }))
  on('clock.every', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    const texts = (await ui.findAll({ type: 'Text' })).map(found => found.text)

    expect(texts).toEqual([
      'Sessions (2)',
      ' ',
      `  ${RUNNING} `,
      'Parser work',
      `  ${IDLE} `,
      'Docs',
      ` ${MERGED}`,
      'Subagents: Search the docs (running), 1 done',
    ])
    await ui.unmount()
  }
})

test('a long list starts collapsed, and the person can open and close it', () => {
  expect(isCollapsedFor(null, 3)).toBe(false)
  expect(isCollapsedFor(null, 7)).toBe(true)
  expect(isCollapsedFor(false, 50)).toBe(false)
  expect(isCollapsedFor(true, 1)).toBe(true)
  expect(countOf(parseSessions(LINKED))).toEqual({ running: 1, idle: 1 })
})

test('the band collapses a long list to counts, and the toggle opens it', async ($, on) => {
  const many = JSON.stringify(Array.from({ length: 14 }, (_, i) => ({ sessionId: `local_${i}`, title: `Task ${i}`, isRunning: i < 4 })))
  on('mcp.call', () => ({ value: { isError: false, content: [{ type: 'text', text: many }] } }))
  on('agent.list', () => ({ value: [] }))
  on('clock.every', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const closed = (await ui.findAll({ type: 'Text' })).map(found => found.text)

  expect(closed).toEqual(['Sessions (14)', `  ${RUNNING} 4`, `  ${IDLE} 10`, ' '])

  await ui.press({ key: 'sessions-toggle' })
  const open = (await ui.findAll({ type: 'Text' })).map(found => found.text)

  expect(open).toContain('Task 0')
  expect(open).toContain('Task 9')
  expect(open).not.toContain('Task 10')
  expect(open).toContain('  and 4 more')

  await ui.press({ key: 'sessions-toggle' })
  expect((await ui.findAll({ type: 'Text' })).map(found => found.text)).toEqual(closed)
  await ui.unmount()
})

test('with nothing linked and no active subagent the band leaves the row to the engine', async ($, on) => {
  on('mcp.call', () => {
    throw new Error('no server')
  })
  on('agent.list', () => ({ value: [] }))
  on('clock.every', () => ({ value: undefined }))
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
