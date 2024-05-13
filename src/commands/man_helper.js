const fetch = require('node-fetch')

async function fetchManPage (env, command) {
  const url = `https://raw.githubusercontent.com/Exeloz/bash-emulator/master/src/manuals/${command}.txt`
  try {
    const response = await fetch(url)
    if (response.ok) {
      const manPageText = await response.text()
      const lines = manPageText.split('\n')

      lines.forEach(line => env.output(line + '\n'))
    } else {
      env.error(`No manual entry for ${command}`)
      env.exit(1)
    }
  } catch (error) {
    env.error('man : Request failed')
    env.exit(1)
  }
  env.exit()
}

module.exports = fetchManPage
