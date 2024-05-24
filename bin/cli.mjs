#!/usr/bin/env node
'use strict'

import { release, parse } from '../dist/index.mjs'

let args = parse(process.argv.slice(2))
const verbose = args.verbose || false
let port = args.port ? args.port.toString().split(',') : args.unknown
const method = args.method || 'tcp'

if (!Array.isArray(port)) {
  port = [port]
}

Promise.all(port.map(current => {
  return release(current, method)
    .then((result) => {
      console.log(`Process on port ${current} killed`)
      verbose && console.log(result)
    })
    .catch((error) => {
      console.log(`Could not release process on port ${port}. ${error.message}.`)
      verbose && console.log(error)
    })
}))
