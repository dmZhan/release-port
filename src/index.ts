import childProcess, { spawn } from 'node:child_process'
type Command = string | string[]

export default function(port: number | string, transport: 'tcp' | 'udp' = 'tcp' ) {
  const p  = typeof port === 'string' ? Number.parseInt(port) : port

  if(!port) {
    return Promise.reject(new Error('Invalid port number provided'))
  }

  if(process.platform === 'win32') {
    return execa('netstat -nao').then(res => {
      // const { out } = res
      
      // if(!out) return res

      // const lines = out.split('\n')

      // const lineWithLocalPortRegEx = new RegExp(`^ *${transport.toUpperCase()} *[^ ]*:${port}`, 'gm')
      //   const linesWithLocalPort = lines.filter(line => line.match(lineWithLocalPortRegEx))

      //   const pids = linesWithLocalPort.reduce((acc, line) => {
      //     const match = line.match(/(\d*)\w*(\n|$)/gm)
      //     return match && match[0] && !acc.includes(match[0]) ? acc.concat(match[0]) : acc
      //   }, [])

      //   return execa(`TaskKill /F /PID ${pids.join(' /PID ')}`)
    })
  } else {

  }
}


function execa(
  cmd: Command,
  options?: Omit<childProcess.SpawnOptionsWithoutStdio, 'stdio' | 'cmd'>
): Promise<{
  out: string;
  err: string;
  error?: Error;
  cmd: string;
  code?: number | null
}> {
  const executable = Array.isArray(cmd) ? cmd.join(';') : cmd
  const opts: childProcess.SpawnOptionsWithoutStdio = {
    ...options,
    stdio: 'pipe',
    cwd: process.cwd()
  }

  const { platform } = process

  try {
    let cmd, arg
    if(platform === 'win32') {
      cmd = 'cmd'
      arg = '/C'
    }else {
      cmd = 'sh'
      arg = '-c'
    }

    const child = spawn(cmd, [arg, executable], opts)

    return new Promise((resolve, reject) => {
      const stdout: string[] = []
      const stderr: string[] = []

      if(child.stdout) {
        child.stdout.on('data', (data) => {
          if(Buffer.isBuffer(data)) return stdout.push(data.toString())
          stdout.push(data)
        })
      }

      if(child.stderr) {
        child.stderr.on('data', (data) => {
          if(Buffer.isBuffer(data)) return stderr.push(data.toString())
          stderr.push(JSON.stringify(data))
        })
      }
      const getDefaultResult = () => {
        const err = stderr.join('\n')
        const out = stdout.join('\n')

        return { err, out, cmd: executable }
      }

      child.on('error', (error) => resolve({...getDefaultResult(), error }))
      child.on('close', (code) => resolve({...getDefaultResult(), code }))
    })
  } catch (error) {
     return Promise.reject(error)
  }
}
