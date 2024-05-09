const UP = 38
const DOWN = 40

function completeCommand (direction, input, emulator) {
  const completeFunctions = {}
  completeFunctions[UP] = emulator.completeUp
  completeFunctions[DOWN] = emulator.completeDown

  const completeFunction = completeFunctions[direction]
  if (!completeFunction) {
    return
  }
  completeFunction('').then(function (completion) {
    if (completion) {
      input.value = completion
      input.setSelectionRange(completion.length, completion.length)
    }
  })
}

module.exports = completeCommand
