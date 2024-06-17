import { describe, expect, it } from 'vitest'
import { release, releaseSync } from '../src'

describe('releasePort', () => {
  it('releaseSync', () => {
    expect(releaseSync(1234)).toMatchInlineSnapshot(`
      {
        "err": "",
        "out": "Execasync nothing",
      }
    `)
  })

  it('release', async () => {
    expect(await release(1234)).toMatchInlineSnapshot(`
      {
        "err": "",
        "out": "Execa nothing",
      }
    `)
  })
})
