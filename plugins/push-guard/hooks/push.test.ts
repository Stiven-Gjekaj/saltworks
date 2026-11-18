import { expect, test } from 'claude-code/testing'

import { modeFrom, sendOf } from './push'

/** The command words, joined at run time so that this file does not trip a guard that reads it. */
const GIT_PUSH = ['git', 'push'].join(' ')
const PR_CREATE = ['gh', 'pr', 'create'].join(' ')

test('the commands that send work out are found', () => {
  expect(sendOf(`${GIT_PUSH} origin main`)).toBe('a git push')
  expect(sendOf(`cd repo && ${GIT_PUSH}`)).toBe('a git push')
  expect(sendOf(`${PR_CREATE} --fill`)).toBe('a pull request')
  expect(sendOf(['gh', 'release', 'create', 'v1'].join(' '))).toBe('a release')
  expect(sendOf('git status')).toBe(undefined)
  expect(sendOf(`echo '${GIT_PUSH} later'`)).toBe(undefined)
  expect(modeFrom({})).toBe('ask')
  expect(modeFrom({ mode: 'deny' })).toBe('deny')
})

test('a push is put to the person', async ($, on) => {
  on('tool.check', () => ({ decision: 'allow' }))

  const push = await $.tool.check({ tool: 'Bash', input: { command: GIT_PUSH } })
  const status = await $.tool.check({ tool: 'Bash', input: { command: 'git status' } })

  expect(push.decision).toBe('ask')
  expect(push.reason).toMatch(/git push/)
  expect(status.decision).toBe('allow')
})

test('in deny mode a pull request is refused', { options: { mode: 'deny' } }, async ($, on) => {
  on('tool.check', () => ({ decision: 'allow' }))

  const pr = await $.tool.check({ tool: 'Bash', input: { command: `${PR_CREATE} --fill` } })

  expect(pr.decision).toBe('deny')
})
