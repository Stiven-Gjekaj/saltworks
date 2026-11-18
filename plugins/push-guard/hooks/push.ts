// Find the commands that send work to a remote. Pure functions, so a test can call them.

/** The start of a command: the start of the text, or after a separator or an opening bracket. */
const START = String.raw`(?:^|[;&|(]\s*|\n\s*)`

/** Each kind of command that sends work out, and the words that name it to the user. */
const SENDS: readonly (readonly [RegExp, string])[] = [
  [new RegExp(`${START}git(?:\\s+-C\\s+\\S+)?(?:\\s+-c\\s+\\S+)*\\s+push\\b`), 'a git push'],
  [new RegExp(`${START}gh\\s+pr\\s+(?:create|merge)\\b`), 'a pull request'],
  [new RegExp(`${START}gh\\s+release\\s+create\\b`), 'a release'],
  [new RegExp(`${START}gh\\s+repo\\s+create\\b`), 'a new repository'],
]

/** What the command sends out, or undefined when it sends nothing. */
export function sendOf(command: string): string | undefined {
  return SENDS.find(([rule]) => rule.test(command))?.[1]
}

export type Mode = 'ask' | 'deny'

/** Read the mode setting. A value that is not one of the two keeps "ask". */
export function modeFrom(options: Readonly<Record<string, unknown>>): Mode {
  return options.mode === 'deny' ? 'deny' : 'ask'
}
