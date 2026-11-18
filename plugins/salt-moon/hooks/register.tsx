import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { saltScene } from './scene'
import type { Ink } from './scene'

const SCENE_ID = 'salt-moon'

// Indigo night. Grays take the hue of the sky. Roles keep their meaning, tuned cool.
const { theme, problems } = makeColors({
  label: 'Salt Moon',
  only: 'dark',
  roles: { accent: '#7fb0dc', danger: '#dc6a5e', success: '#78b48c', warning: '#d8a54c', pro: '#a98ad8' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#11131d',
        'surface-1': '#161926',
        'surface-2': '#1b1f2f',
        'surface-3': '#202436',
        'text-primary': '#e9e8f2',
        'text-secondary': '#c4c3d6',
        'text-muted': '#a09fb8',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: SCENE_ID, glass: { blur: 16, tint: '#10121c', opacity: 0.42 } },
}

/** The night inks: indigo sky, dark mesas, a pale moon. */
const NIGHT: Ink = {
  paper: '#10121c',
  sky: '#2b3354',
  glow: '#3d4775',
  mesaFar: '#0d0f18',
  mesaLit: '#56609a',
  mesaNear: '#08090f',
  flat: '#151826',
  salt: '#5a6496',
  body: '#dfe2f0',
  bodyShade: '#10121c',
  star: '#c9cde6',
}

/** Build the scene once. The string does not change. */
let scene: string | undefined

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    await $.theme.set(LOOK)

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)
    scene ??= saltScene(NIGHT, { kind: 'moon', x: 260, y: 210, r: 45 }, 90)

    return <Svg source={scene} alt="A dithered salt flat at night, mesas on the horizon, a pale moon" isInteractive />
  })
}
