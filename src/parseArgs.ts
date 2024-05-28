import process from 'node:process'

function splitArgObjects(args: string[]) {
  const newArgs = []
  let index = 0

  while (index < args.length) {
    const arg = args[index]

    if (arg.includes('{')) {
      const temp = []

      while (!args[index].includes('}')) {
        temp.push(args[index])
        index++
      }
      temp.push(args[index])

      newArgs.push(temp.join(' ').replace(/([\w-]+):\s*([\w-]*)/g, '"$1": "$2"'))
    }
    else {
      newArgs.push(arg)
    }

    index++
  }

  return newArgs
}

export function parse(args: string[] = []) {
  if (!args.length) {
    args = process.argv.slice(2)
  }

  if (args[0] && args[0].match(/node$/)) {
    args = args.slice(2)
  }

  const newArgs = splitArgObjects(args)
  function parseArgs(args: string[], obj: { unknown: string[], [k: string]: any }) {
    // Check if end reached
    if (!args.length) {
      return obj
    }

    const arg = args[0]

    // if statement match conditions:
    // 1. --key=value || -key=value
    // 2. --no-key
    // 3. --key value|nothing
    // else add to unknown arr
    if (/^-.+=/.test(arg)) {
      const match = arg.match(/^(--|-)([^=]+)=([\s\S]*)$/) as string[]
      // Set key(match[2]) = value(match[3])
      obj[match[2]] = match[3]
    }
    else if (/^--no-.+/.test(arg)) {
      // Set key = true
      obj[arg.match(/^--no-(.+)/)![1]] = false
    }
    else if (/^-.+/.test(arg)) {
      const key = arg.match(/^(--|-)(.+)/)![2]
      const next = args[1]

      // If next value exist and not prefixed with - or --
      if (next && !/^-{1,2}/.test(next)) {
        obj[key] = next
        return parseArgs(args.slice(2), obj)
      }
      else {
        obj[key] = true
      }
    }
    else {
      obj.unknown.push(arg)
    }

    return parseArgs(args.slice(1), obj)
  }

  const parseResult = parseArgs(newArgs, { unknown: [] })

  // Covert to proper type
  for (const prop in parseResult) {
    try {
      parseResult[prop] = JSON.parse(parseResult[prop])
    }
    catch (e) {
      continue
    }
  }

  return parseResult
}
