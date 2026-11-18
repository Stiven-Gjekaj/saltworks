import { expect, test } from 'claude-code/testing'

import { DEFAULT_LIMITS, isTooBig, limitsFrom, parseNumstat } from './size'

const BAND = {
  plugin: 'commit-size-band',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 10, bodyColumns: 80, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

function numstat(stdout: string, exitCode = 0) {
  return () => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
}

test('numstat text gives the file and line counts', () => {
  const s = parseNumstat('3\t1\ta.ts\n-\t-\tlogo.png\n10\t0\tb.ts\n')

  expect(s).toEqual({ files: 3, added: 13, removed: 1 })
  expect(isTooBig(s, DEFAULT_LIMITS)).toBe(false)
  expect(isTooBig({ files: 6, added: 1, removed: 0 }, DEFAULT_LIMITS)).toBe(true)
  expect(isTooBig({ files: 1, added: 250, removed: 60 }, DEFAULT_LIMITS)).toBe(true)
  expect(isTooBig({ files: 6, added: 1, removed: 0 }, limitsFrom({ maxFiles: 10 }))).toBe(false)
  expect(limitsFrom({ maxFiles: -1, maxLines: 'x' })).toEqual(DEFAULT_LIMITS)
})

test('the band shows a small commit dim and a big one with a warning', async ($, on) => {
  let out = '1\t1\ta.ts\n'
  on('process.run', () => numstat(out)())
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: /Staged/ }))?.text).toBe('Staged: 1 file, +1 -1')
    await ui.unmount()
  }

  out = Array.from({ length: 7 }, (_, i) => `1\t0\tf${i}.ts`).join('\n')
  await $.tool.call({ tool: 'Bash', command: 'git add .' })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /Staged/ }))?.text).toMatch(/Staged: 7 files.*Split it\./)
  await ui.unmount()
})

test('outside a git repository the band shows nothing of its own', async ($, on) => {
  on('process.run', numstat('', 128))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })

  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()
})

test('with nothing staged the band list drops this row and keeps the others', async ($, on) => {
  on('process.run', numstat(''))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  // Two plain row trees: this mod's and one of another plugin.
  const mine = h('Text', null, 'mine') as never
  const other = h('Text', null, 'other') as never
  const ui = await $.ui.mount({
    plugin: 'commit-size-band',
    component: 'AbovePromptList',
    surface: 'desktop',
    props: { ...BAND.props, rows: [{ plugin: 'commit-size-band', tree: mine }, { plugin: 'other', tree: other }] },
  })

  expect((await ui.findAll({ type: 'Text' })).map(found => found.text)).toEqual(['other'])
  await ui.unmount()
})
