// Style rules for the text that Claude writes to a file. Pure functions, so a test can call them.

/** The checks that are on. A setting of the mod turns each one on or off. */
export type Checks = { emDash: boolean; emoji: boolean; passive: boolean }

export const DEFAULT_CHECKS: Checks = { emDash: true, emoji: true, passive: true }

/** U+2014. The source holds the code point, so the file itself has no em-dash. */
const EM_DASH = new RegExp(String.fromCharCode(0x2014), 'g')
const EMOJI = /\p{Extended_Pictographic}/gu
/** Files that are data, not text that a person reads. The linter does not look at them. */
const DATA = /\.(json|lock|svg|png|jpe?g|gif|webp|ico|pdf|csv|tsv|min\.js|map)$/i
/** Files that are prose. The passive-voice check looks only at these. */
const PROSE = /\.(md|mdx|markdown|txt|rst|adoc)$/i
/** A form of "be" and a past participle. This is a heuristic, so it gives a note, not a block. */
const PASSIVE = /\b(?:is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?(?:\w+ed|built|done|made|written|given|taken|shown|known|seen|found|sent|run|set|kept|held|read|put|left|told|brought|bought|thrown|chosen|driven|drawn|broken)\b/gi

/** Read the settings of the mod into checks. A value that is not a boolean keeps the default. */
export function checksFrom(options: Readonly<Record<string, unknown>>): Checks {
  const flag = (key: keyof Checks): boolean => {
    const value = options[key]

    return typeof value === 'boolean' ? value : DEFAULT_CHECKS[key]
  }

  return { emDash: flag('emDash'), emoji: flag('emoji'), passive: flag('passive') }
}

function count(text: string, rule: RegExp): number {
  return text.match(rule)?.length ?? 0
}

export function isData(path: string): boolean {
  return DATA.test(path)
}

/** The faults that the new text adds over the old text. */
export function addedFaults(before: string, after: string, checks: Checks): string[] {
  const faults: string[] = []
  const dashes = checks.emDash ? count(after, EM_DASH) - count(before, EM_DASH) : 0
  const emoji = checks.emoji ? count(after, EMOJI) - count(before, EMOJI) : 0

  if (dashes > 0) {
    faults.push(`it adds ${dashes} em-dash${dashes === 1 ? '' : 'es'}. Use a comma, a colon, parentheses or a new sentence`)
  }
  if (emoji > 0) {
    faults.push(`it adds ${emoji} emoji. Remove ${emoji === 1 ? 'it' : 'them'}`)
  }

  return faults
}

/** The passive phrases in the new text that the old text did not have. */
export function addedPassive(path: string, before: string, after: string, checks: Checks): string[] {
  if (!checks.passive || !PROSE.test(path)) {
    return []
  }
  const old = new Set((before.match(PASSIVE) ?? []).map(p => p.toLowerCase()))

  return [...new Set((after.match(PASSIVE) ?? []).filter(p => !old.has(p.toLowerCase())))].slice(0, 5)
}
