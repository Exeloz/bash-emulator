import { addLineNumbers } from '../utils/lineNumber.js'

// Default width for number column
const numColumnWidth = 5

function isInteger (str) {
  const parsedInt = parseInt(str, 10)
  return !isNaN(parsedInt) && parsedInt.toString() === str
}

function history (env, args) {
  const splicedHistoryLength = args.length === 1 ? null : args[1]

  if (!(isInteger(splicedHistoryLength) || args.length === 1)) {
    env.error(`history: ${splicedHistoryLength} numeric argument required`)
    env.exit(1)
    return
  }

  env.system.getHistory().then(function (history) {
    const splicedHistory = history.filter(function (element, index) {
      if (!splicedHistoryLength || index >= history.length - splicedHistoryLength) {
        return true
      }
      return false
    })
    const offset = history.length - splicedHistory.length
    env.output(addLineNumbers(numColumnWidth, splicedHistory, offset).join('\n'))
    env.exit()
  })
}

export default history
