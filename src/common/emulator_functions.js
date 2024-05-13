async function run (cmd) {
  logOutput('$ ' + cmd)

  try {
    const result = await document.emulator.run(cmd)
    logOutput(result + '\n')
    keepScrolledDownForInput()
    updateInputPrefix()
  } catch (error) {
    logError('<div class="error">' + error + '</div>')
  }
}

function logError (result) {
  logOutput(result)
}

function logOutput (result) {
  if (result) {
    const output = document.getElementById('output')
    output.innerHTML += result + '\n'
    keepScrolledDownForInput()
  }
}

function keepScrolledDownForInput () {
  const scrollHeight = document.body.scrollHeight
  window.scrollTo(0, scrollHeight)
}

async function updateInputPrefix () {
  const path = await document.emulator.getDir()
  const user = await document.emulator.getUser()
  const inputPrefix = document.getElementById('inputPrefix')
  inputPrefix.innerHTML =
    `<span style="color: lime;">${user}</span>` +
    '<span style="color: white;">:</span>' +
    `<span style="color: DodgerBlue;">${path}</span>` +
    '<span style="color: white;">$</span>'
  const prefixWidth = inputPrefix.offsetWidth
  document.documentElement.style.setProperty(
    '--prefix-width',
    `${prefixWidth}px`
  )
}

module.exports = run
