import { expect, test } from 'claude-code/testing'

import { addedFaults, addedPassive, checksFrom, DEFAULT_CHECKS } from './lint'

/** The characters under test, made from code points so that this file holds none of them. */
const DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
const CHECK = String.fromCodePoint(0x2705)

test('only faults that the new text adds count', () => {
  expect(addedFaults('', `A rule ${DASH} then more.`, DEFAULT_CHECKS).length).toBe(1)
  expect(addedFaults(`Old ${DASH} text.`, `Old ${DASH} text, changed.`, DEFAULT_CHECKS).length).toBe(0)
  expect(addedFaults('', `Done ${CHECK}`, DEFAULT_CHECKS).length).toBe(1)
  expect(addedFaults('', `Plain text, with a hyphen - and an en dash ${EN_DASH}.`, DEFAULT_CHECKS).length).toBe(0)
})

test('each check turns off with its setting', () => {
  const off = checksFrom({ emDash: false, emoji: false, passive: false })

  expect(addedFaults('', `a ${DASH} b ${CHECK}`, off)).toEqual([])
  expect(addedPassive('a.md', '', 'It was made.', off)).toEqual([])
})

test('passive voice is checked in prose files only', () => {
  expect(addedPassive('README.md', '', 'The file is written by the tool.', DEFAULT_CHECKS)).toEqual(['is written'])
  expect(addedPassive('main.ts', '', 'The file is written by the tool.', DEFAULT_CHECKS)).toEqual([])
  expect(addedPassive('a.md', 'It was made.', 'It was made. The tool writes it.', DEFAULT_CHECKS)).toEqual([])
})

test('an edit that adds an em-dash is denied', async ($, on) => {
  on('tool.call', () => ({ result: {} }))

  const ran = await $.tool.call({ tool: 'Edit', file_path: '/x/a.ts', old_string: 'a', new_string: `a ${DASH} b` })

  expect(ran.deny).toMatch(/em-dash/)
})

test('an edit that adds an em-dash runs when the check is off', { options: { emDash: false } }, async ($, on) => {
  on('tool.call', () => ({ result: {} }))

  const ran = await $.tool.call({ tool: 'Edit', file_path: '/x/a.ts', old_string: 'a', new_string: `a ${DASH} b` })

  expect(ran.deny).toBe(undefined)
})

test('a write of prose in the passive voice runs with a note', async ($, on) => {
  on('fs.read', () => {
    throw new Error('no file')
  })
  on('tool.call', () => ({ result: { type: 'create' } }))

  const ran = await $.tool.call({ tool: 'Write', file_path: '/x/NOTES.md', content: 'The cache is cleared on start.' })

  expect(ran.deny).toBe(undefined)
  expect(ran.context?.[0]).toMatch(/is cleared/)
})

test('a data file is not checked', async ($, on) => {
  on('tool.call', () => ({ result: {} }))

  const ran = await $.tool.call({ tool: 'Write', file_path: '/x/data.json', content: `{"a":"x ${DASH} y"}` })

  expect(ran.deny).toBe(undefined)
})
