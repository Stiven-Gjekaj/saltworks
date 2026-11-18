// Decide whether a path or a shell command changes a read-only folder. Pure functions, so a test can call them.

/**
 * The read-only folders, from the setting: a comma-separated list.
 * A plain name ("Materials") matches a folder of that name at any depth.
 * A name with a slash ("/Users/me/archive", "~/vault") matches that path and all below it.
 */
export function foldersFrom(options: Readonly<Record<string, unknown>>): string[] {
  const value = typeof options.folders === 'string' ? options.folders : 'Materials'

  return value
    .split(',')
    .map(part => part.trim().replace(/\/+$/, ''))
    .filter(part => part !== '')
}

/** The read-only folder that holds the path, or undefined when none does. */
export function folderOf(path: string, folders: readonly string[], home = ''): string | undefined {
  const clean = path.replace(/^["']|["']$/g, '')
  const full = home !== '' && clean.startsWith('~/') ? `${home}${clean.slice(1)}` : clean
  const segments = full.split('/')

  return folders.find(folder => {
    if (!folder.includes('/')) {
      // A folder by name. A path whose last segment is the name is the folder itself.
      return segments.includes(folder)
    }
    const root = home !== '' && folder.startsWith('~/') ? `${home}${folder.slice(1)}` : folder

    return full === root || full.startsWith(`${root}/`)
  })
}

/** Commands that change each path they name. */
const CHANGES_ALL = new Set(['rm', 'rmdir', 'mv', 'touch', 'mkdir', 'truncate', 'chmod', 'chown', 'ln', 'unlink', 'shred'])
/** Commands that change only the last path they name. A copy out of the folder is allowed. */
const CHANGES_LAST = new Set(['cp', 'rsync', 'install'])

/** Split a shell command into simple commands, and each into words. Quotes are kept out of the words. */
function commandsOf(command: string): string[][] {
  return command
    .split(/&&|\|\||[;|\n]/)
    .map(part => (part.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map(word => word.replace(/^["']|["']$/g, '')))
    .filter(words => words.length > 0)
}

/** The read-only folder that a shell command changes, or undefined. This is a heuristic for the common commands. */
export function bashTarget(command: string, folders: readonly string[], home = ''): string | undefined {
  // A redirect writes its target.
  for (const match of command.matchAll(/>>?\s*("[^"]*"|'[^']*'|[^\s;&|]+)/g)) {
    const hit = folderOf(match[1] ?? '', folders, home)

    if (hit !== undefined) {
      return hit
    }
  }
  for (const words of commandsOf(command)) {
    const name = words[0] ?? ''
    const isInPlaceEdit = (name === 'sed' || name === 'perl') && words.some(word => /^-\w*i/.test(word))
    const paths = words.slice(1).filter(word => !word.startsWith('-'))
    const changed = CHANGES_ALL.has(name) || isInPlaceEdit || name === 'tee' ? paths : CHANGES_LAST.has(name) ? paths.slice(-1) : []
    const hit = changed.map(path => folderOf(path, folders, home)).find(found => found !== undefined)

    if (hit !== undefined) {
      return hit
    }
  }

  return undefined
}
