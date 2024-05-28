import { describe, expect, it } from 'vitest'
import { parse } from '../src/parseArgs'

describe('parseArgs', () => {
  it('parse', () => {
    expect(parse()).toMatchInlineSnapshot(`
      {
        "unknown": [],
      }
    `)

    expect(parse([
      '--no-key',
      '--port=3000',
      '3000',
    ])).toMatchInlineSnapshot(`
      {
        "key": false,
        "port": 3000,
        "unknown": 3000,
      }
    `)

    expect(parse([
      '--key',
      '-port=3000',
      '3000',
    ])).toMatchInlineSnapshot(`
      {
        "key": true,
        "port": 3000,
        "unknown": 3000,
      }
    `)

    expect(parse([
      '--port',
      '8080,5000,3000',
    ])).toMatchInlineSnapshot(`
      {
        "port": "8080,5000,3000",
        "unknown": [],
      }
    `)

    expect(parse([
      '9000',
      '3000',
      '5000',
    ])).toMatchInlineSnapshot(`
      {
        "unknown": [
          "9000",
          "3000",
          "5000",
        ],
      }
    `)
  })
})
