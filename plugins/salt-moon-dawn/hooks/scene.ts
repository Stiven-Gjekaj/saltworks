// A dithered salt flat. Mesas stand on the horizon, one body (a moon or a sun) hangs in the sky,
// and the flat shows a thin reflection of it. The two Saltworks themes share this file and give it
// their own inks. Pure string building. The output is the same on each build.

const WIDTH = 1600
const HEIGHT = 1000
/** One dither pixel is 5 units wide. */
const CELL = 5
/** The threshold matrix is 4x4, so a tile is 20 units and has 16 tones. */
const TILE = CELL * 4
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

/** The inks of one scene. */
export type Ink = {
  /** The sky at the top. */
  paper: string
  /** Sparse sky dots and cloud. */
  sky: string
  /** Dense dots near the horizon, and the halo. */
  glow: string
  mesaFar: string
  /** The lit rim on top of the far mesas. */
  mesaLit: string
  mesaNear: string
  /** The salt flat. */
  flat: string
  /** Salt dots and the reflection. */
  salt: string
  /** The moon or the sun. */
  body: string
  /** The shadow ink on the body: the night sky for a crescent moon, the paper for the bands of a sun. */
  bodyShade: string
  star: string
}

/** The body in the sky, its centre and radius. */
export type Body = { kind: 'moon' | 'sun'; x: number; y: number; r: number }

/** The inks of the scene that is being built. saltScene sets them before it draws. */
let INK: Ink
let BODY: Body
let STARS = 0

/** A seeded random source, so the stars stay in the same place. */
function seeded(seed: number): () => number {
  let s = seed >>> 0

  return () => {
    s = (s * 1664525 + 1013904223) >>> 0

    return s / 4294967296
  }
}

/** A dither pattern with `level` of 16 cells filled with `ink`. */
function pattern(id: string, level: number, ink: string): string {
  let cells = ''

  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      if ((BAYER4[y]?.[x] ?? 16) < level) {
        cells += `<rect x="${x * CELL}" y="${y * CELL}" width="${CELL}" height="${CELL}"/>`
      }
    }
  }

  return `<pattern id="${id}" width="${TILE}" height="${TILE}" patternUnits="userSpaceOnUse"><g fill="${ink}">${cells}</g></pattern>`
}

/** Snap a value to the dither grid. */
function snap(v: number): number {
  return Math.round(v / CELL) * CELL
}

/** A closed path from points, snapped to the grid in steps, so edges look like pixels. */
function steppedPath(points: readonly (readonly [number, number])[], bottom: number): string {
  let d = `M0 ${bottom}`
  let lastY = snap(points[0]?.[1] ?? bottom)

  d += ` L0 ${lastY}`

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]
    const b = points[i + 1]

    if (a === undefined || b === undefined) {
      continue
    }

    for (let x = snap(a[0]); x < snap(b[0]); x += CELL * 2) {
      const t = (x - a[0]) / (b[0] - a[0])
      const y = snap(a[1] + (b[1] - a[1]) * t)

      if (y !== lastY) {
        d += ` L${x} ${lastY} L${x} ${y}`
        lastY = y
      }
    }
  }

  d += ` L${WIDTH} ${lastY} L${WIDTH} ${bottom} Z`

  return d
}

const HORIZON = 720

/** Far mesas: flat tops and steep sides, on both edges of the window, low in the middle. */
const FAR: readonly (readonly [number, number])[] = [
  [0, 560], [150, 560], [175, 610], [290, 615], [320, 670], [520, 690], [700, 700],
  [900, 700], [1040, 688], [1080, 620], [1110, 560], [1330, 560], [1360, 610],
  [1450, 615], [1480, 650], [1600, 650],
]

/** Near buttes: dark shapes at the two lower corners only. */
const NEAR: readonly (readonly [number, number])[] = [
  [0, 700], [60, 700], [90, 760], [170, 790], [200, 1010], [1380, 1010],
  [1400, 770], [1480, 740], [1510, 690], [1600, 690],
]

function stars(): string {
  const random = seeded(7)
  let out = ''

  for (let i = 0; i < STARS; i += 1) {
    const x = snap(random() * WIDTH)
    const y = snap(random() * (HORIZON - 160))
    // Keep the middle column calm, where the words are.
    const isMiddle = x > 460 && x < 1140 && random() < 0.7

    if (isMiddle) {
      continue
    }
    const size = random() < 0.12 ? CELL * 2 : CELL
    const delay = (random() * 9).toFixed(1)
    const period = (5 + random() * 7).toFixed(1)
    const cls = random() < 0.5 ? 'tw' : 'tw2'

    out += `<rect class="${cls}" x="${x}" y="${y}" width="${size}" height="${size}" style="animation-delay:-${delay}s;animation-duration:${period}s"/>`
  }

  return `<g fill="${INK.star}">${out}</g>`
}

/** Sky bands: the glow gets denser toward the horizon. */
function skyBands(): string {
  const bands: string[] = []
  const levels = [1, 2, 3, 4, 5, 6]
  const top = HORIZON - 260
  const step = 260 / levels.length

  levels.forEach((level, i) => {
    bands.push(`<rect x="0" y="${snap(top + i * step)}" width="${WIDTH}" height="${snap(step) + CELL}" fill="url(#g${level})"/>`)
  })

  return bands.join('')
}

/** The body: a dithered halo, then a crescent shadow for a moon or dithered bands for a sun. */
function body(): string {
  const { x, y, r } = BODY
  const halo = [
    `<circle cx="${x}" cy="${y}" r="${r + 70}" fill="url(#h1)"/>`,
    `<circle cx="${x}" cy="${y}" r="${r + 35}" fill="url(#h2)"/>`,
  ].join('')
  const disc = `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK.body}"/>`

  if (BODY.kind === 'moon') {
    const shade = `<circle cx="${x + 22}" cy="${y - 6}" r="${r - 4}" fill="url(#m8)" clip-path="url(#bodyClip)"/>`
    const deep = `<circle cx="${x + 34}" cy="${y - 8}" r="${r - 10}" fill="url(#m12)" clip-path="url(#bodyClip)"/>`

    return `<g class="halo">${halo}</g>${disc}${shade}${deep}`
  }
  // A sun: the lower half has bands of paper that get denser toward the bottom.
  let bands = ''
  const levels = [4, 8, 12]

  levels.forEach((level, i) => {
    const top = snap(y + (i * r) / levels.length)
    bands += `<rect x="${x - r}" y="${top}" width="${r * 2}" height="${snap(r / levels.length)}" fill="url(#m${level})" clip-path="url(#bodyClip)"/>`
  })

  return `<g class="halo">${halo}</g>${disc}${bands}`
}

/** A thin column of salt glints under the body. It shimmers slowly. */
function reflection(): string {
  const random = seeded(11)
  let out = ''

  for (let y = HORIZON + 60; y < HEIGHT; y += CELL * 2) {
    const spread = 6 + (y - HORIZON) * 0.12
    const count = 2 + Math.floor(random() * 3)

    for (let i = 0; i < count; i += 1) {
      const x = snap(BODY.x + (random() - 0.5) * spread * 2)
      out += `<rect x="${x}" y="${y}" width="${CELL * (1 + Math.floor(random() * 3))}" height="${CELL}"/>`
    }
  }

  return `<g class="glint" fill="${INK.salt}">${out}</g>`
}

/** A low band of dither cloud that drifts across in whole tiles, so the dots stay on the grid. */
function cloud(): string {
  // Pieces of cloud: [x, y, tiles long]. Each piece has a dense core row and a sparse edge row.
  const pieces: readonly (readonly [number, number, number])[] = [
    [-400, 330, 18], [120, 350, 9], [700, 310, 14], [1240, 340, 11], [1700, 320, 16], [2150, 345, 8],
  ]
  let out = ''

  for (const [x, y, long] of pieces) {
    out += `<rect x="${x + TILE}" y="${y - TILE}" width="${(long - 2) * TILE}" height="${TILE}" fill="url(#c1)"/>`
    out += `<rect x="${x}" y="${y}" width="${long * TILE}" height="${TILE}" fill="url(#c2)"/>`
    out += `<rect x="${x + TILE * 2}" y="${y + TILE}" width="${(long - 3) * TILE}" height="${TILE}" fill="url(#c1)"/>`
  }

  return `<g class="drift">${out}</g>`
}

const STYLE = `
.tw{animation:tw 8s steps(2,end) infinite}
.tw2{animation:tw2 8s steps(3,end) infinite}
@keyframes tw{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes tw2{0%,100%{opacity:.45}40%{opacity:1}70%{opacity:.2}}
.glint{animation:glint 6s steps(3,end) infinite}
@keyframes glint{0%,100%{opacity:.85}50%{opacity:.4}}
.halo{animation:halo 14s ease-in-out infinite}
@keyframes halo{0%,100%{opacity:.9}50%{opacity:.6}}
.drift{animation:drift 360s steps(60,end) infinite}
@keyframes drift{from{transform:translateX(0)}to{transform:translateX(-${TILE * 60}px)}}
@media (prefers-reduced-motion:reduce){.tw,.tw2,.glint,.halo,.drift{animation:none}}
@media (max-aspect-ratio:3/4){.halo,.drift{opacity:.6}}
`

/** Build the scene with these inks, this body and this number of stars. */
export function saltScene(ink: Ink, sky: Body, starCount: number): string {
  INK = ink
  BODY = sky
  STARS = starCount
  const defs = [
    ...[1, 2, 3, 4, 5, 6].map(l => pattern(`g${l}`, l, l > 3 ? INK.glow : INK.sky)),
    pattern('h1', 1, INK.glow),
    pattern('h2', 3, INK.glow),
    pattern('m4', 4, INK.bodyShade),
    pattern('m8', 8, INK.bodyShade),
    pattern('m12', 13, INK.bodyShade),
    pattern('c1', 1, INK.sky),
    pattern('c2', 3, INK.sky),
    pattern('lit', 6, INK.mesaLit),
    pattern('salt', 1, INK.salt),
    `<clipPath id="bodyClip"><circle cx="${sky.x}" cy="${sky.y}" r="${sky.r}"/></clipPath>`,
    `<clipPath id="farClip"><path d="${steppedPath(FAR, HORIZON)}"/></clipPath>`,
  ].join('')
  const far = steppedPath(FAR, HORIZON)
  // The lit rim of the far mesas: the top tile of the shape keeps the lit dither ink.
  const inner = steppedPath(FAR.map(([x, y]) => [x, y + TILE] as const), HORIZON)
  const mesas = `<path d="${far}" fill="${INK.mesaFar}"/><path d="${far}" fill="url(#lit)"/><path d="${inner}" fill="${INK.mesaFar}" clip-path="url(#farClip)"/>`

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges">`,
    `<style>${STYLE}</style><defs>${defs}</defs>`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${INK.paper}"/>`,
    skyBands(),
    STARS > 0 ? stars() : '',
    cloud(),
    body(),
    mesas,
    `<rect x="0" y="${HORIZON}" width="${WIDTH}" height="${HEIGHT - HORIZON}" fill="${INK.flat}"/>`,
    `<rect x="0" y="${HORIZON}" width="${WIDTH}" height="${TILE * 2}" fill="url(#salt)"/>`,
    reflection(),
    `<path d="${steppedPath(NEAR, HEIGHT)}" fill="${INK.mesaNear}"/>`,
    `</svg>`,
  ].join('')
}
