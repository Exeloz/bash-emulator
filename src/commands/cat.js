const lineNumber = require('../utils/lineNumber')

const numColumnWidth = 6
const numberFlag = '-n'

function cat (env, args) {
  // Ignore command name
  args.shift()

  let exitCode = 0
  const numberFlagIndex = args.findIndex(function (arg) {
    return arg === numberFlag
  })
  const showNumbers = numberFlagIndex !== -1
  if (showNumbers) {
    args.splice(numberFlagIndex, 1)
  }

  if (!args.length) {
    let num = 1
    return {
      input: function (str) {
        str.split('\n').forEach(function (l) {
          if (!l) {
            return
          }
          const line = showNumbers ? lineNumber.addLineNumber(numColumnWidth, num, l) : l
          num++
          env.output(line + '\n')
        })
      },
      close: function () {
        env.exit(exitCode)
      }
    }
  }

  Promise
    .all(args.map(function (path) {
      return env.system.read(path).catch(function (err) {
        exitCode = 1
        return 'cat: ' + err.message
      })
    }))
    .then(function (contents) {
      const lines = showNumbers ? lineNumber.addLineNumbers(numColumnWidth, contents) : contents
      lines.forEach(function (line) {
        env.output(line + '\n')
      })
      env.exit(exitCode)
    })
}

module.exports = cat
