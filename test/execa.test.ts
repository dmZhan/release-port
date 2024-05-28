import { describe, expect, it } from 'vitest'
import { execa, execaSync } from '../src/execa'

describe('execa', () => {
  it('execaSync', () => {
    expect(execaSync('echo 123')).toMatchInlineSnapshot(`
      {
        "err": "",
        "error": undefined,
        "out": "123
      ",
      }
    `)

    expect(execaSync('echoa 123')).toMatchInlineSnapshot(`
      {
        "err": "'echoa' is not recognized as an internal or external command,
      operable program or batch file.
      ",
        "error": undefined,
        "out": "",
      }
    `)

    expect(execaSync('echo 123')).toEqual({
      out: expect.anything(),
      err: expect.anything(),
      error: undefined,
    })
  })

  it('execa', async () => {
    expect(await execa('echo 123')).toMatchInlineSnapshot(`
      {
        "err": "",
        "error": undefined,
        "out": "123
      ",
      }
    `)

    expect(await execa('echoa 123')).toMatchInlineSnapshot(`
      {
        "err": "'echoa' is not recognized as an internal or external command,
      operable program or batch file.
      ",
        "error": undefined,
        "out": "",
      }
    `)

    expect(await execa('echo 123')).toEqual({
      out: expect.anything(),
      err: expect.anything(),
      error: undefined,
    })
  })

  it('same command\'s output should equal', async () => {
    expect(await execa('echo 123')).toEqual(execaSync('echo 123'))

    expect(execaSync('echoa 123')).toEqual(await execa('echoa 123'))
  })

  it.skip('test ommand netstat -nao', () => {
    expect(execaSync('netstat -nao')).toMatchSnapshot()
  })
})
