function addLineNumber (width, num, line) {
  const numChars = num.toString().length
  const space = ' '.repeat(width - numChars)
  return space + num + '  ' + line
}
module.exports.addLineNumber = addLineNumber

module.exports.addLineNumbers = function (width, lines) {
  return lines.map(function (line, i) {
    const num = i + 1
    return addLineNumber(width, num, line)
  })
}
