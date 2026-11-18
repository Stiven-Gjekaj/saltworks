import type { Staged } from '../types'

/** The limits of one commit. A commit past either one is too big for one step. */
export type Limits = { maxFiles: number; maxLines: number }

export const DEFAULT_LIMITS: Limits = { maxFiles: 5, maxLines: 300 }

/** Read the settings of the mod into limits. A value that is not a positive number keeps the default. */
export function limitsFrom(options: Readonly<Record<string, unknown>>): Limits {
  const limit = (key: keyof Limits): number => {
    const value = options[key]

    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_LIMITS[key]
  }

  return { maxFiles: limit('maxFiles'), maxLines: limit('maxLines') }
}

/** Read the output of `git diff --cached --numstat`. A binary file counts as one file with no lines. */
export function parseNumstat(text: string): Staged {
  let files = 0
  let added = 0
  let removed = 0

  for (const line of text.split('\n')) {
    const [a, r] = line.split('\t')

    if (line.trim() === '' || a === undefined || r === undefined) {
      continue
    }
    files += 1
    added += Number.parseInt(a, 10) || 0
    removed += Number.parseInt(r, 10) || 0
  }

  return { files, added, removed }
}

export function isTooBig(staged: Staged, limits: Limits): boolean {
  return staged.files > limits.maxFiles || staged.added + staged.removed > limits.maxLines
}
