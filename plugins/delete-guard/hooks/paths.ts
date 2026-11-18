// Find the folders that a shell command lists, and the folders that it deletes. Pure functions, so a test can call them.

/** Join a path to the working directory, and remove "." and ".." segments. */
export function resolve(path: string, cwd: string, home = ''): string {
  const expanded = home !== '' && (path === '~' || path.startsWith('~/')) ? `${home}${path.slice(1)}` : path
  const full = expanded.startsWith('/') ? expanded : `${cwd}/${expanded}`
  const out: string[] = []

  for (const segment of full.split('/')) {
    if (segment === '' || segment === '.') {
      continue
    }
    if (segment === '..') {
      out.pop()
    } else {
      out.push(segment)
    }
  }

  return `/${out.join('/')}`
}

/** Split a shell command into simple commands, and each into words. Quotes are kept out of the words. */
function commandsOf(command: string): string[][] {
  return command
    .split(/&&|\|\||[;|\n]/)
    .map(part => (part.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map(word => word.replace(/^["']|["']$/g, '')))
    .filter(words => words.length > 0)
}

/** Commands that show what a folder holds. A size, as from du, does not show that, so du is not here. */
const LISTERS = new Set(['ls', 'find', 'tree', 'eza', 'exa', 'fd'])

/** The folders that a command lists. A lister with no path lists the working directory. */
export function listedBy(command: string): string[] {
  return commandsOf(command).flatMap(words => {
    if (!LISTERS.has(words[0] ?? '')) {
      return []
    }
    // find takes its folders first, then its tests. The other listers take only folders.
    const args = words.slice(1)
    const firstTest = args.findIndex(a => a.startsWith('-'))
    const findPaths = firstTest === -1 ? args : args.slice(0, firstTest)
    const paths = words[0] === 'find' ? findPaths : args.filter(a => !a.startsWith('-'))

    return paths.length === 0 ? ['.'] : paths
  })
}

/** The targets of each recursive rm in the command. */
export function deletedBy(command: string): string[] {
  return commandsOf(command).flatMap(words => {
    const at = words[0] === 'sudo' ? 1 : 0

    if (words[at] !== 'rm') {
      return []
    }
    const args = words.slice(at + 1)
    const isRecursive = args.some(a => /^-[a-zA-Z]*[rR]/.test(a) || a === '--recursive')

    return isRecursive ? args.filter(a => !a.startsWith('-')) : []
  })
}

/** True when a path has a wildcard or a variable, so the folder that it names is not known. */
export function isVague(path: string): boolean {
  return /[*?[\]$`{}]/.test(path)
}
