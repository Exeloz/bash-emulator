export function addLineNumber (width, num, line) {
  const numChars = num.toString().length
  const space = ' '.repeat(width - numChars)
  return space + num + '  ' + line
}

export function addLineNumbers (width, lines, offset = 0) {
  return lines.map((line, i) => {
    const num = i + 1 + offset
    return addLineNumber(width, num, line)
  })
}
