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
      env.output(`No manual entry for ${command}`)
    }
  } catch (error) {
    env.output(`Error fetching man page: ${error.message}`)
  }
  env.exit()
}

function man (env, args) {
  const command = args[1]

  fetchManPage(env, command)
}

module.exports = man
