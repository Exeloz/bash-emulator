function addLineNumber (width, num, line) {
  const numChars = num.toString().length
  const space = ' '.repeat(width - numChars)
  return space + num + '  ' + line
}
module.exports.addLineNumber = addLineNumber

module.exports.addLineNumbers = function (width, lines, offset = 0) {
  return lines.map(function (line, i) {
    const num = i + 1 + offset
    return addLineNumber(width, num, line)
  })
}
