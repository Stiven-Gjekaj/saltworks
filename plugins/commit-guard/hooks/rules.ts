// The rules for a commit message and a pull request text. Pure functions, so a test can call them.

/** The rules that are on. A setting of the mod turns each one on or off. */
export type Rules = {
  /** The name that git must write. Empty: no check. */
  gitName: string
  /** The email that git must write. Empty: no check. */
  gitEmail: string
  attribution: boolean
  emDash: boolean
  emoji: boolean
  versionInSubject: boolean
  conventional: boolean
  prText: boolean
}

export const DEFAULT_RULES: Rules = {
  gitName: '',
  gitEmail: '',
  attribution: true,
  emDash: true,
  emoji: true,
  versionInSubject: true,
  conventional: false,
  prText: true,
}

const ATTRIBUTION: readonly RegExp[] = [
  /co-authored-by:/i,
  /generated with \[?claude/i,
  /made with claude/i,
  /claude\.ai\/code/i,
  /noreply@anthropic\.com/i,
]
/** U+2014. The source holds the code point, so the file itself has no em-dash. */
const EM_DASH = new RegExp(String.fromCharCode(0x2014))
const EMOJI = /\p{Extended_Pictographic}/u
const VERSION = /\bv?\d+\.\d+(\.\d+)?\b/
const CONVENTIONAL = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?: \S/
/** The start of a command: the start of the text, or after a separator or an opening bracket. */
const START = String.raw`(?:^|[;&|(]\s*|\n\s*)`
const COMMIT = new RegExp(`${START}git(?:\\s+-C\\s+\\S+)?(?:\\s+-c\\s+\\S+)*\\s+commit\\b`)
const PR_TEXT = new RegExp(`${START}gh\\s+pr\\s+(?:create|edit|comment|review)\\b`)

/** Read the settings of the mod into rules. A value of the wrong type keeps the default. */
export function rulesFrom(options: Readonly<Record<string, unknown>>): Rules {
  const text = (key: 'gitName' | 'gitEmail'): string => {
    const value = options[key]

    return typeof value === 'string' ? value.trim() : DEFAULT_RULES[key]
  }
  const flag = (key: Exclude<keyof Rules, 'gitName' | 'gitEmail'>): boolean => {
    const value = options[key]

    return typeof value === 'boolean' ? value : DEFAULT_RULES[key]
  }

  return {
    gitName: text('gitName'),
    gitEmail: text('gitEmail'),
    attribution: flag('attribution'),
    emDash: flag('emDash'),
    emoji: flag('emoji'),
    versionInSubject: flag('versionInSubject'),
    conventional: flag('conventional'),
    prText: flag('prText'),
  }
}

/** True when a command in the text makes a commit. A mention inside other text does not count. */
export function isCommit(command: string): boolean {
  return COMMIT.test(command)
}

/** True when a command in the text writes the text of a pull request. */
export function isPrText(command: string): boolean {
  return PR_TEXT.test(command)
}

/** The subject line: the first -m value, or the first line of a heredoc. */
export function subjectOf(command: string): string | undefined {
  const quoted = /(?:^|\s)(?:-m|--message)(?:=|\s+)(?:"((?:[^"\\]|\\.)*)"|'([^']*)')/.exec(command)

  if (quoted !== null) {
    return (quoted[1] ?? quoted[2] ?? '').split('\n')[0]?.trim()
  }
  const heredoc = /<<-?\s*'?"?(\w+)'?"?\s*\n([\s\S]*?)\n\s*\1\b/.exec(command)

  if (heredoc !== null) {
    return heredoc[2]?.split('\n').find(line => line.trim() !== '')?.trim()
  }

  return undefined
}

/** The faults in a message text. An empty list means that the text obeys the rules. */
export function textFaults(text: string, rules: Rules): string[] {
  const faults: string[] = []

  if (rules.attribution && ATTRIBUTION.some(rule => rule.test(text))) {
    faults.push('it has an attribution line or a tool footer. A human is the writer')
  }
  if (rules.emDash && EM_DASH.test(text)) {
    faults.push('it has an em-dash. Use a comma, a colon or a new sentence')
  }
  if (rules.emoji && EMOJI.test(text)) {
    faults.push('it has an emoji')
  }

  return faults
}

/** The faults of a commit command. */
export function commitFaults(command: string, rules: Rules): string[] {
  const faults = textFaults(command, rules)
  const subject = subjectOf(command)

  if (subject === undefined) {
    return faults
  }
  if (rules.versionInSubject && VERSION.test(subject)) {
    faults.push(`the subject "${subject}" has a version number. A commit does not change the version`)
  }
  if (rules.conventional && !CONVENTIONAL.test(subject)) {
    faults.push(`the subject "${subject}" is not a Conventional Commit. Start it with a type, such as "feat: " or "fix(parser): "`)
  }

  return faults
}

/** The faults of the identity that git will write. A rule with no value set checks nothing. */
export function identityFaults(name: string, email: string, rules: Rules): string[] {
  const faults: string[] = []

  if (rules.gitEmail !== '' && email !== rules.gitEmail) {
    faults.push(`git user.email is "${email || 'not set'}". Set it with: git config user.email "${rules.gitEmail}"`)
  }
  if (rules.gitName !== '' && name !== rules.gitName) {
    faults.push(`git user.name is "${name || 'not set'}". Set it with: git config user.name "${rules.gitName}"`)
  }

  return faults
}
