function logOutput (result) {
  if (result) {
    output.innerHTML += result + '\n'
    keepScrolledDownForInput()
  }
}

function logError (result) {
  logOutput('<div class="error">' + result + '</div>')
}

function run (cmd) {
  logOutput('$ ' + cmd)
  return emulator.run(cmd).then(logOutput, logError)
}

function keepScrolledDownForInput () {
  const scrollHeight = document.body.scrollHeight
  window.scrollTo(0, scrollHeight)
}

module.exports = run
