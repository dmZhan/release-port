import process from 'node:process'
import { execa, execaSync } from './execa'

/**
 * kill port
 * @param port port number
 * @param method 'tcp' | 'udp'
 * @returns Promise
 */
export async function release(port: number | string, method: 'tcp' | 'udp' = 'tcp') {
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

      return execa(killPort('win32', getPids(out, method, p)))
    })
  }
  else {
    return execa('lsof -i -p').then((res) => {
      const { out } = res

      if (!out) {
        return res
      }

      if (!isExistProcess(out, p)) {
        return Promise.reject(new Error('No process running on port'))
      }

      return execa(
        killPort(process.platform as Exclude<NodeJS.Platform, 'win32'>, method, p),
      )
    })
  }
}

/**
 * sync kill port
 * @param port port number
 * @param method 'tcp' | 'udp'
 * @returns execResult | Error
 */
export function releaseSync(port: number | string, method: 'tcp' | 'udp' = 'tcp') {
  const p = typeof port === 'string' ? Number.parseInt(port) : port

  if (!p) {
    return new Error('Invalid port number provided')
  }

  if (process.platform === 'win32') {
    const res = execaSync('netstat -nao')

    if (!res.out) {
      return res
    }

    return execaSync(killPort('win32', getPids(res.out, method, p)))
  }
  else {
    const res = execaSync('lsof -i -p')

    if (!res.out) {
      return res
    }

    if (!isExistProcess(res.out, p)) {
      return new Error('No process running on port')
    }

    return execaSync(
      killPort(process.platform as Exclude<NodeJS.Platform, 'win32'>, method, p),
    )
  }
}

function killPort(platform: 'win32', pids: string[]): string
function killPort(platform: Exclude<NodeJS.Platform, 'win32'>, method: 'udp' | 'tcp', port: number): string
function killPort(platform: NodeJS.Platform, ops?: any, port?: number): string {
  if (platform === 'win32') {
    return `TaskKill /F /PID ${ops?.join(' /PID ')}`
  }
  else {
    return `lsof -i ${ops === 'udp' ? 'udp' : 'tcp'}:${port} | grep ${ops === 'udp' ? 'UDP' : 'LISTEN'} | awk '{print $2}' | xrags kill -9`
  }
}

/**
 * get pids in windows
 * @param str pids output string
 * @param method 'udp' | 'tcp'
 * @param port port number
 * @returns string[]
 */
function getPids(str: string, method: 'udp' | 'tcp', port: number) {
  const lines = str.split('\n')
  const lineWithLocalPortRegEx = new RegExp(`^ *${method.toUpperCase()} *[^ ]*:${port}`, 'gm')
  const linesWithLocalPort = lines.filter(line => line.match(lineWithLocalPortRegEx))

  const pids = linesWithLocalPort.reduce((acc: string[], line) => {
    const match = line.match(/(\d*)(\n|$)/gm)
    return match && match[0] && !acc.includes(match[0]) ? acc.concat(match[0]) : acc
  }, [])

  return pids
}

/**
 * process whether exist
 * @param str pids output string
 * @param port port number
 * @returns boolean
 */
function isExistProcess(str: string, port: number) {
  const lines = str.split('\n')
  return lines.filter(line => line.match(new RegExp(`:*${port}`))).length > 0
}
