import { expect, test } from '@jest/globals'
import bashEmulator from '../../src'
import FileType from '../../src/utils/fileTypes.js'

function emulator () {
  return bashEmulator({
    history: [],
    user: 'test',
    workingDirectory: '/',
    fileSystem: {
      '/': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/a': {
        type: FileType.File,
        modified: Date.now(),
        content: 'aaa'
      },
      '/b': {
        type: FileType.File,
        modified: Date.now(),
        content: 'bbb'
      },
      '/c': {
        type: FileType.File,
        modified: Date.now(),
        content: 'ccc'
      },
      '/d': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/e': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/e/a': {
        type: FileType.File,
        modified: Date.now(),
        content: 'ea'
      },
      '/e/b': {
        type: FileType.File,
        modified: Date.now(),
        content: 'eb'
      },
      '/e/subdir': {
        type: FileType.Dir,
        modified: Date.now()
      }
    }
  })
}

test('cp: Missing file operand', () => {
  expect.assertions(1)
  return emulator().run('cp').catch((error) => {
    expect(error).toBe('cp: missing file operand')
  })
})

test('cp: Missing destination operand', () => {
  expect.assertions(1)
  return emulator().run('cp somefile').catch((error) => {
    expect(error).toBe('cp: missing destination file operand after ‘somefile’')
  })
})

test('cp: Non-existent source file', () => {
  expect.assertions(1)
  return emulator().run('cp nofile testdir').catch((error) => {
    expect(error).toBe('nofile: No such file or directory')
  })
})

test('cp: Copying directory as a file', () => {
  expect.assertions(1)
  return emulator().run('cp d testdir').catch((error) => {
    expect(error).toBe('cp: omitting directory ‘d’')
  })
})

test('cp: Copy a file to existing file (overwrite)', () => {
  expect.assertions(2)
  const emul = emulator()
  return emul.run('cp a aa')
    .then(() => emul.read('a'))
    .then((content) => expect(content).toBe('aaa'))
    .then(() => emul.read('aa'))
    .then((content) => expect(content).toBe('aaa'))
})

test('cp: Copy a file to new file', () => {
  expect.assertions(2)
  const emul = emulator()
  return emul.run('cp a b')
    .then(() => emul.read('a'))
    .then((content) => expect(content).toBe('aaa'))
    .then(() => emul.read('b'))
    .then((content) => expect(content).toBe('aaa'))
})

test('cp: Copy a file to directory', () => {
  expect.assertions(2)
  const emul = emulator()

  return emul.run('cp a d')
    .then(() => emul.read('a'))
    .then((content) => expect(content).toBe('aaa'))
    .then(() => emul.read('d/a'))
    .then((content) => expect(content).toBe('aaa'))
})

test('cp: Multiple destinations (not a directory)', () => {
  expect.assertions(1)
  return emulator().run('cp a b c').catch((error) => {
    expect(error).toBe('cp: target ‘c’ is not a directory')
  })
})

test('cp: Multiple destinations (non-existent directory)', () => {
  expect.assertions(1)
  return emulator().run('cp a b /non/existent').catch((error) => {
    expect(error).toBe('cp: target ‘/non/existent’ is not a directory')
  })
})

test('cp: Copy multiple files into a file fails', () => {
  expect.assertions(1)
  const emul = emulator()

  return emul.run('cp a b c')
    .catch((error) => expect(error).toBe('cp: target ‘c’ is not a directory'))
})

test('cp: Copy multiple files works', () => {
  expect.assertions(4)
  const emul = emulator()

  return emul.run('cp a b d')
    .then(() => emul.read('/a'))
    .then((content) => expect(content).toBe('aaa'))
    .then(() => emul.read('/b'))
    .then((content) => expect(content).toBe('bbb'))
    .then(() => emul.read('/d/a'))
    .then((content) => expect(content).toBe('aaa'))
    .then(() => emul.read('/d/b'))
    .then((content) => expect(content).toBe('bbb'))
})

test('cp: Copy multiple files to existing files (overwrite)', () => {
  expect.assertions(4)
  const emul = emulator()

  return emul.run('cp a b e')
    .then(() => emul.read('/a'))
    .then((content) => expect(content).toBe('aaa'))
    .then(() => emul.read('/b'))
    .then((content) => expect(content).toBe('bbb'))
    .then(() => emul.read('/e/a'))
    .then((content) => expect(content).toBe('aaa'))
    .then(() => emul.read('/e/b'))
    .then((content) => expect(content).toBe('bbb'))
})

test('cp -r: Copy directory recursively', () => {
  expect.assertions(1)
  const emul = emulator()

  return emul.run('cp -r e new-location')
    .then(() => emul.stat('e'))
    .then(() => emul.stat('e/subdir'))
    .then(() => emul.stat('new-location'))
    .then(() => emul.stat('new-location/subdir'))
    .then(() => expect(true).toBeTruthy())
})
