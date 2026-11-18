import { expect, test } from 'claude-code/testing'

import { bashTarget, folderOf, foldersFrom } from './paths'

const FOLDERS = ['Materials', '~/vault']
const HOME = '/home/ada'

test('a folder by name matches at any depth, a folder by path matches below it', () => {
  expect(folderOf('/work/project/Materials/spec.pdf', FOLDERS, HOME)).toBe('Materials')
  expect(folderOf('Materials/notes.md', FOLDERS, HOME)).toBe('Materials')
  expect(folderOf('/work/MaterialsOld/a.md', FOLDERS, HOME)).toBe(undefined)
  expect(folderOf('/home/ada/vault/key.txt', FOLDERS, HOME)).toBe('~/vault')
  expect(folderOf('~/vault/key.txt', FOLDERS, HOME)).toBe('~/vault')
  expect(folderOf('/home/ada/vaults/a', FOLDERS, HOME)).toBe(undefined)
})

test('the setting is a comma-separated list, with Materials as the default', () => {
  expect(foldersFrom({})).toEqual(['Materials'])
  expect(foldersFrom({ folders: ' Materials, ~/vault/ ,' })).toEqual(['Materials', '~/vault'])
})

test('a shell command that changes the folder is found, a copy out of it is not', () => {
  expect(bashTarget('rm Materials/a.md', FOLDERS)).toBe('Materials')
  expect(bashTarget('echo x > Materials/a.md', FOLDERS)).toBe('Materials')
  expect(bashTarget("sed -i '' 's/a/b/' Materials/a.md", FOLDERS)).toBe('Materials')
  expect(bashTarget('cp Materials/a.md work/a.md', FOLDERS)).toBe(undefined)
  expect(bashTarget('cp work/a.md Materials/a.md', FOLDERS)).toBe('Materials')
  expect(bashTarget('cat Materials/a.md | grep x', FOLDERS)).toBe(undefined)
  expect(bashTarget('ls Materials && mv Materials/a b', FOLDERS)).toBe('Materials')
})

test('an edit in the folder is denied, an edit outside runs', async ($, on) => {
  on('tool.call', () => ({ result: {} }))

  const inside = await $.tool.call({ tool: 'Edit', file_path: '/work/Materials/a.md', old_string: 'a', new_string: 'b' })
  const outside = await $.tool.call({ tool: 'Edit', file_path: '/work/notes/a.md', old_string: 'a', new_string: 'b' })

  expect(inside.deny).toMatch(/read only/)
  expect(outside.deny).toBe(undefined)
})

test('a folder from the setting is guarded', { options: { folders: 'archive' } }, async ($, on) => {
  on('tool.call', () => ({ result: {} }))

  const ran = await $.tool.call({ tool: 'Bash', command: 'rm -r archive/old' })
  const materials = await $.tool.call({ tool: 'Bash', command: 'rm Materials/a.md' })

  expect(ran.deny).toMatch(/archive/)
  expect(materials.deny).toBe(undefined)
})
