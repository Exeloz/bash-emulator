import { expect, test } from '@jest/globals'
import bashEmulator from '../../src'
import FileType from '../../src/utils/fileTypes.js'

function emulator () {
  return bashEmulator({
    workingDirectory: '/',
    fileSystem: {
      '/1.txt': {
        type: FileType.File,
        modified: Date.now(),
        content: 'first'
      },
      '/2.txt': {
        type: FileType.File,
        modified: Date.now(),
        content: 'second'
      },
      '/3.txt': {
        type: FileType.File,
        modified: Date.now(),
        content: 'third'
      }
    }
  })
}

test('cat concatenates content of multiple files', () => {
  return emulator().run('cat 1.txt /3.txt /2.txt')
    .then((output) => {
      const expectedOutput = 'first\nthird\nsecond\n'
      expect(output).toBe(expectedOutput)
    })
})

test('cat throws error for non-existent file', () => {
  return emulator().run('cat nonexistent /1.txt')
    .catch((err) => {
      const expectedError =
        'cat: nonexistent: No such file or directory\nfirst\n'
      expect(err).toBe(expectedError)
    })
})

test('cat -n displays content with line numbers for multiple files', () => {
  return emulator().run('cat -n 1.txt /3.txt /2.txt')
    .then((output) => {
      const expectedOutput =
      '     1  first\n' +
      '     2  third\n' +
      '     3  second\n'

      expect(output).toBe(expectedOutput)
    })
})

test('cat with -n flag can be positioned differently', () => {
  const emul = emulator()
  return emul.run('cat 1.txt -n /3.txt /2.txt')
    .then((output) => {
      const expectedOutput =
            '     1  first\n' +
            '     2  third\n' +
            '     3  second\n'
      expect(output).toBe(expectedOutput)
    })
    .then(() => {
      return emul.run('cat 1.txt /3.txt /2.txt -n')
    })
    .then((output) => {
      const expectedOutput =
      '     1  first\n' +
      '     2  third\n' +
      '     3  second\n'
      expect(output).toBe(expectedOutput)
    })
})

test('cat pipes output to another cat', () => {
  return emulator().run('cat 1.txt | cat')
    .then((output) => {
      const expectedOutput = 'first\n'
      expect(output).toBe(expectedOutput)
    })
})

test('cat pipes multiple files to cat with line numbers', () => {
  return emulator().run('cat 1.txt 2.txt | cat -n')
    .then((output) => {
      const expectedOutput =
      '     1  first\n' +
      '     2  second\n'

      expect(output).toBe(expectedOutput)
    })
})
