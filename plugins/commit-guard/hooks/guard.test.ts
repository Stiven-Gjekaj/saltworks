import { expect, test } from 'claude-code/testing'

import { commitFaults, DEFAULT_RULES, identityFaults, isCommit, isPrText, rulesFrom, subjectOf, textFaults } from './rules'

const NAME = 'Ada Lovelace'
const EMAIL = 'ada@example.com'
const IDENTITY = { gitName: NAME, gitEmail: EMAIL }
/** The characters under test, made from code points so that this file holds none of them. */
const DASH = String.fromCharCode(0x2014)
const CAT = String.fromCodePoint(0x1f431)
const ROCKET = String.fromCodePoint(0x1f680)

/** A process.run answer that gives the git config identity. */
function identity(name: string, email: string) {
  return (_: unknown, e: { argv: readonly string[] }) => ({
    value: { exitCode: 0, stdout: e.argv.includes('user.email') ? `${email}\n` : `${name}\n`, stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
  })
}

test('the rules find each fault in a message', () => {
  const rules = DEFAULT_RULES

  expect(isCommit('git commit -m "feat: add x"')).toBe(true)
  expect(isCommit('git -C repo commit -m "x"')).toBe(true)
  expect(isCommit('cd repo && git commit -m "x"')).toBe(true)
  expect(isCommit('git log --grep commit')).toBe(false)
  expect(subjectOf('git commit -m "feat: add x" -m "body"')).toBe('feat: add x')
  expect(subjectOf("git commit -F - <<'EOF'\nfix: stop the loop\n\nBody.\nEOF")).toBe('fix: stop the loop')
  expect(textFaults(`fix: a ${DASH} b`, rules).length).toBe(1)
  expect(textFaults(`fix: add the cat ${CAT}`, rules).length).toBe(1)
  expect(textFaults('fix: x\n\nCo-Authored-By: Someone <a@b.c>', rules).length).toBe(1)
  expect(commitFaults('git commit -m "feat: release v1.2.0"', rules).length).toBe(1)
  expect(commitFaults('git commit -m "feat: add the token reader"', rules).length).toBe(0)
})

test('a command name inside other text is not a command', () => {
  const pr = ['gh', 'pr', 'create'].join(' ')

  expect(isPrText(`cat > a.ts <<'EOF'\nconst c = '${pr} --body x'\nEOF`)).toBe(false)
  expect(isCommit("echo 'run git commit later'")).toBe(false)
  expect(isPrText(`${pr} --title "Add x"`)).toBe(true)
})

test('each rule turns off with its setting', () => {
  const off = rulesFrom({ attribution: false, emDash: false, emoji: false, versionInSubject: false })

  expect(textFaults(`a ${DASH} b ${CAT}\nCo-Authored-By: X <x@y.z>`, off)).toEqual([])
  expect(commitFaults('git commit -m "release v1.2.0"', off)).toEqual([])
})

test('the identity check runs only for the values that are set', () => {
  expect(identityFaults('anybody', 'any@example.com', DEFAULT_RULES)).toEqual([])
  expect(identityFaults(NAME, EMAIL, rulesFrom(IDENTITY))).toEqual([])
  expect(identityFaults(NAME, 'other@example.com', rulesFrom(IDENTITY)).length).toBe(1)
  expect(identityFaults('Other', EMAIL, rulesFrom({ gitEmail: EMAIL }))).toEqual([])
})

test('the Conventional Commit rule is off until it is set', () => {
  expect(commitFaults('git commit -m "Add the reader"', DEFAULT_RULES)).toEqual([])
  expect(commitFaults('git commit -m "Add the reader"', rulesFrom({ conventional: true })).length).toBe(1)
  expect(commitFaults('git commit -m "feat(parser): add the reader"', rulesFrom({ conventional: true }))).toEqual([])
})

test('a commit with an attribution line is denied', async ($, on) => {
  on('tool.call', () => ({ result: {} }))

  const ran = await $.tool.call({ tool: 'Bash', command: 'git commit -m "feat: x" -m "Co-Authored-By: Bot <b@x.y>"' })

  expect(ran.deny).toMatch(/attribution/)
})

test('a commit with the wrong email is denied', { options: IDENTITY }, async ($, on) => {
  on('process.run', identity(NAME, 'other@example.com'))
  on('tool.call', () => ({ result: {} }))

  const ran = await $.tool.call({ tool: 'Bash', command: 'git commit -m "feat: add the reader"' })

  expect(ran.deny).toMatch(/user\.email/)
})

test('a clean commit with the right identity runs', { options: IDENTITY }, async ($, on) => {
  on('process.run', identity(NAME, EMAIL))
  on('tool.call', () => ({ result: { stdout: 'ok' } }))

  const ran = await $.tool.call({ tool: 'Bash', command: 'git commit -m "feat: add the reader"' })

  expect(ran.deny).toBe(undefined)
})

test('a PR body with an emoji is denied, other commands run', async ($, on) => {
  on('tool.call', () => ({ result: {} }))

  const pr = await $.tool.call({ tool: 'Bash', command: `${['gh', 'pr', 'create'].join(' ')} --title "Add x" --body "Done ${ROCKET}"` })
  const ls = await $.tool.call({ tool: 'Bash', command: 'ls' })

  expect(pr.deny).toMatch(/emoji/)
  expect(ls.deny).toBe(undefined)
})
