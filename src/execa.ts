import { spawn, spawnSync } from 'node:child_process'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import type { execResult } from './types'

export function execa(otherArgs: string): Promise<execResult> {
  try {
    if (otherArgs === '') {
      return Promise.resolve({
        out: 'Execa nothing',
        err: '',
      })
    }

    const { cmd, arg } = getCommandByPlatform()

    const child = spawn(cmd, [arg, otherArgs], { stdio: 'pipe', cwd: process.cwd() })

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

        return { err, out }
      }

      child.on('error', error => resolve({ ...getDefaultResult(), error }))
      child.on('close', _code => resolve({ ...getDefaultResult(), error: undefined }))
    })
  }
  catch (error) {
    return Promise.reject(error)
  }
}

export function execaSync(otherArgs: string): execResult {
  const { cmd, arg } = getCommandByPlatform()

  if (otherArgs === '') {
    return {
      out: 'Execasync nothing',
      err: '',
    }
  }

  const result = spawnSync(cmd, [arg, otherArgs], { cwd: process.cwd(), encoding: 'utf-8' })

  return {
    out: Buffer.isBuffer(result.stdout) ? result.stdout.toString() : result.stdout,
    err: Buffer.isBuffer(result.stderr) ? result.stderr.toString() : result.stderr,
    error: result.error,
  }
}

function getCommandByPlatform(): { cmd: 'cmd', arg: '/C' } | { cmd: 'sh', arg: '-c' } {
  const { platform } = process

  if (platform === 'win32') {
    return { cmd: 'cmd', arg: '/C' }
  }
  else {
    return { cmd: 'sh', arg: '-c' }
  }
}
