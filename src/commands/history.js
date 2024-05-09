const lineNumbers = require('../utils/lineNumber')

// Default width for number column
const numColumnWidth = 5

function history (env, args) {
  const splicedHistoryLength = args.length === 1 ? null : args[1]

  env.system.getHistory().then(function (history) {
    const splicedHistory = history.filter(function (element, index) {
      if (!splicedHistoryLength || index >= history.length - splicedHistoryLength) {
        return true
      }
      return false
    })
    env.output(lineNumbers.addLineNumbers(numColumnWidth, splicedHistory).join('\n'))
    env.exit()
  })
}

module.exports = history
