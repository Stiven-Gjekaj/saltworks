import { expect, test } from 'claude-code/testing'

import { deletedBy, isVague, listedBy, resolve } from './paths'

test('paths resolve against the working directory and the home folder', () => {
  expect(resolve('build', '/work/app')).toBe('/work/app/build')
  expect(resolve('./build/', '/work/app')).toBe('/work/app/build')
  expect(resolve('../other', '/work/app')).toBe('/work/other')
  expect(resolve('~/tmp', '/work', '/home/ada')).toBe('/home/ada/tmp')
})

test('listers and recursive deletes are found', () => {
  expect(listedBy('ls -la build')).toEqual(['build'])
  expect(listedBy('ls')).toEqual(['.'])
  expect(listedBy('find build -type f | head')).toEqual(['build'])
  expect(listedBy('du -sh build')).toEqual([])
  expect(deletedBy('rm -rf build dist')).toEqual(['build', 'dist'])
  expect(deletedBy('rm -fr build')).toEqual(['build'])
  expect(deletedBy('rm a.txt')).toEqual([])
  expect(deletedBy('cd x && sudo rm -R cache')).toEqual(['cache'])
  expect(isVague('build/*')).toBe(true)
  expect(isVague('$OUT')).toBe(true)
  expect(isVague('build')).toBe(false)
})

test('a folder must be listed before it is deleted', async ($, on) => {
  on('session.cwd', () => ({ value: '/work/app' }))
  on('tool.call', () => ({ result: { stdout: '' } }))

  const early = await $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await $.tool.call({ tool: 'Bash', command: 'ls -la build' })
  const later = await $.tool.call({ tool: 'Bash', command: 'rm -rf ./build/' })

  expect(early.deny).toMatch(/list "build" first/)
  expect(later.deny).toBe(undefined)
})

test('a wildcard delete is denied, a plain file delete runs', async ($, on) => {
  on('session.cwd', () => ({ value: '/work/app' }))
  on('tool.call', () => ({ result: { stdout: '' } }))

  const wild = await $.tool.call({ tool: 'Bash', command: 'rm -rf build/*' })
  const file = await $.tool.call({ tool: 'Bash', command: 'rm notes.txt' })

  expect(wild.deny).toMatch(/wildcard/)
  expect(file.deny).toBe(undefined)
})
