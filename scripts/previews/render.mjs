// Render the preview of each theme to assets/screenshots/<theme>.png.
//
// Run from the repository root:
//   node --experimental-strip-types scripts/previews/render.mjs
//
// The script reads the inks, the body in the sky and the colors from each theme's own
// register.tsx, so a preview always shows the theme as it is. It needs Google Chrome.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { saltScene } from '../../plugins/salt-moon/hooks/scene.ts'

const ROOT = new URL('../../', import.meta.url).pathname
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/** The page around each scene. The glass and the text colors come from the theme. */
const THEMES = [
  { id: 'salt-moon', mode: 'dark', glass: 'rgba(16,18,28,0.62)', line: 'rgba(160,159,184,0.18)' },
  { id: 'salt-moon-dawn', mode: 'light', glass: 'rgba(246,241,246,0.66)', line: 'rgba(96,90,112,0.2)' },
]

/** Read a value that a register.tsx writes as an object literal. */
function literal(source, pattern) {
  const match = pattern.exec(source)

  if (match === null) {
    throw new Error(`no match for ${pattern}`)
  }

  return Function(`return (${match[1]})`)()
}

function render(theme, dir) {
  const source = readFileSync(join(ROOT, 'plugins', theme.id, 'hooks', 'register.tsx'), 'utf8')
  const call = /saltScene\((\w+), (\{[^}]+\}), (\d+)\)/.exec(source)

  if (call === null) {
    throw new Error(`${theme.id}: no saltScene call`)
  }
  const ink = literal(source, new RegExp(`const ${call[1]}: Ink = (\\{[\\s\\S]*?\\n\\})`))
  const body = Function(`return (${call[2]})`)()
  const roles = literal(source, /roles: (\{[^}]+\})/)
  const anchors = literal(source, /anchors: (\{[\s\S]*?\})/)
  const svg = join(dir, `${theme.id}.svg`)

  writeFileSync(svg, saltScene(ink, body, Number(call[3])))

  const vars = {
    svg,
    glass: theme.glass,
    line: theme.line,
    s1: anchors['surface-1'],
    s2: anchors['surface-2'],
    s3: anchors['surface-3'] ?? '#ffffff',
    tp: anchors['text-primary'],
    ts: anchors['text-secondary'],
    tm: anchors['text-muted'],
    ...roles,
  }
  const page = readFileSync(join(ROOT, 'scripts', 'previews', 'page.html'), 'utf8').replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key])
  const html = join(dir, `${theme.id}.html`)
  const png = join(ROOT, 'assets', 'screenshots', `${theme.id}.png`)

  writeFileSync(html, page)
  execFileSync(CHROME, ['--headless=new', '--hide-scrollbars', '--window-size=1600,1000', `--screenshot=${png}`, `file://${html}`], { stdio: 'ignore' })
  console.log(`wrote ${png}`)
}

const dir = mkdtempSync(join(tmpdir(), 'saltworks-previews-'))

for (const theme of THEMES) {
  render(theme, dir)
}
