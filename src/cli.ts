import process from 'node:process'
import { release } from './releasePort'
import { parse } from './parseArgs'

/* eslint-disable no-console */
function cli() {
  const args = parse(process.argv.slice(2))
  const verbose = args.verbose || false

  let port = args.port ? args.port.toString().split(',') : args.unknown
  const method = args.method || 'tcp'

  if (!Array.isArray(port)) {
    port = [port]
  }

  Promise.all(port.map(async (current: string | number) => {
    return await release(current, method)
      .then((result) => {
        console.log(`Process on port ${current} killed`)
        verbose && console.log(result)
      })
      .catch((error) => {
        console.log(`Could not release process on port ${port}. ${error.message}.`)
        verbose && console.log(error)
      })
  }))
}

cli()
