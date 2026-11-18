import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { saltScene } from './scene'
import type { Ink } from './scene'

const SCENE_ID = 'salt-moon-dawn'

// Lilac dawn on salt. Grays take the hue of the morning sky. Roles keep their meaning, tuned warm.
const { theme, problems } = makeColors({
  label: 'Salt Moon Dawn',
  only: 'light',
  roles: { accent: '#3d6ea8', danger: '#b8433a', success: '#3d7d55', warning: '#9a6a12', pro: '#7250a8' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f1ecf2',
        'surface-1': '#f6f2f7',
        'surface-2': '#fbf9fc',
        'text-primary': '#211d2b',
        'text-secondary': '#4a4458',
        'text-muted': '#605a70',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: SCENE_ID, glass: { blur: 16, tint: '#f6f1f6', opacity: 0.5 } },
}

/** The dawn inks: a lilac sky with a peach glow, dusk-purple mesas, a low sun. */
const DAWN: Ink = {
  paper: '#efe8f0',
  sky: '#dccbdf',
  glow: '#f0b99c',
  mesaFar: '#8d7491',
  mesaLit: '#f3c9a8',
  mesaNear: '#5f4b66',
  flat: '#e6dce6',
  salt: '#c7b2c9',
  body: '#f39a6b',
  bodyShade: '#efe8f0',
  star: '#ffffff',
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
    scene ??= saltScene(DAWN, { kind: 'sun', x: 1370, y: 420, r: 50 }, 0)

    return <Svg source={scene} alt="A dithered salt flat at dawn, mesas on the horizon, a low sun" isInteractive />
  })
}
