import type childProcess from 'node:child_process'
import { spawn } from 'node:child_process'
import process from 'node:process'
import { Buffer } from 'node:buffer'

type Command = string | string[]

export async function release(port: number | string, transport: 'tcp' | 'udp' = 'tcp') {
  const p = typeof port === 'string' ? Number.parseInt(port) : port

  if (!p) {
    return Promise.reject(new Error('Invalid port number provided'))
  }

  if (process.platform === 'win32') {
    return execa('netstat -nao').then((res) => {
      const { out } = res

      if (!out) {
        return res
      }

      const lines = out.split('\n')

      const lineWithLocalPortRegEx = new RegExp(`^ *${transport.toUpperCase()} *[^ ]*:${p}`, 'gm')
      const linesWithLocalPort = lines.filter(line => line.match(lineWithLocalPortRegEx))

      const pids = linesWithLocalPort.reduce((acc: string[], line) => {
        const match = line.match(/(\d*)(\n|$)/gm)
        return match && match[0] && !acc.includes(match[0]) ? acc.concat(match[0]) : acc
      }, [])

      return execa(`TaskKill /F /PID ${pids.join(' /PID ')}`)
    })
  }

  return execa('lsof -i -p').then((res) => {
    const { out } = res
    if (!out) {
      return res
    }
    const lines = out.split('\n')
    const existProcess = lines.filter(line => line.match(new RegExp(`:*${p}`))).length > 0

    if (!existProcess) {
      return Promise.reject(new Error('No process running on port'))
    }

    return execa(
      `lsof -i ${transport === 'udp' ? 'udp' : 'tcp'}:${p} | grep ${transport === 'udp' ? 'UDP' : 'LISTEN'} | awk '{print $2}' | xrags kill -9`,
    )
  })
}

function execa(
  cmd: Command,
  options?: Omit<childProcess.SpawnOptionsWithoutStdio, 'stdio' | 'cmd'>,
): Promise<{
  out: string
  err: string
  error?: Error
  cmd: string
  code?: number | null
}> {
  const executable = Array.isArray(cmd) ? cmd.join(';') : cmd
  const opts: childProcess.SpawnOptionsWithoutStdio = {
    ...options,
    stdio: 'pipe',
    cwd: process.cwd(),
  }

  const { platform } = process

  try {
    let cmd, arg
    if (platform === 'win32') {
      cmd = 'cmd'
      arg = '/C'
    }
    else {
      cmd = 'sh'
      arg = '-c'
    }

    const child = spawn(cmd, [arg, executable], opts)

    return new Promise((resolve, _reject) => {
      const stdout: string[] = []
      const stderr: string[] = []

      if (child.stdout) {
        child.stdout.on('data', (data) => {
          if (Buffer.isBuffer(data)) {
            return stdout.push(data.toString())
          }
          stdout.push(data)
        })
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          if (Buffer.isBuffer(data)) {
            return stderr.push(data.toString())
          }
          stderr.push(JSON.stringify(data))
        })
      }
      const getDefaultResult = () => {
        const err = stderr.join('\n')
        const out = stdout.join('\n')

        return { err, out, cmd: executable }
      }

      child.on('error', error => resolve({ ...getDefaultResult(), error }))
      child.on('close', code => resolve({ ...getDefaultResult(), code }))
    })
  }
  catch (error) {
    return Promise.reject(error)
  }
}

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
