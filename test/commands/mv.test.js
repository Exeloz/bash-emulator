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
      '/etc': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/README': {
        type: FileType.File,
        modified: Date.now(),
        content: 'read this first'
      },
      '/err.log': {
        type: FileType.File,
        modified: Date.now(),
        content: 'some err'
      },
      '/somedir': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/somedir/subdir': {
        type: FileType.Dir,
        modified: Date.now()
      }
    }
  })
}

test('mv: missing file operand', () => {
  expect.assertions(1)
  emulator().run('mv').catch((output) => {
    expect(output).toBe('mv: missing file operand')
  })
})

test('mv: missing destination file operand', () => {
  expect.assertions(1)
  emulator().run('mv somefile').catch((output) => {
    expect(output).toBe('mv: missing destination file operand after ‘somefile’')
  })
})

test('mv: nofile No such file or directory', () => {
  expect.assertions(1)
  emulator().run('mv nofile testdir').catch((output) => {
    expect(output).toBe('nofile: No such file or directory')
  })
})

test('mv: Move README to DONTREADME', () => {
  expect.assertions(2)
  const emul = emulator()

  return emul.run('mv README DONTREADME')
    .then(() => {
      return emul.read('DONTREADME')
    })
    .then((content) => expect(content).toBe('read this first'))
    .then(() => expect(emul.read('README')).rejects.toThrow('README: No such file or directory'))
    .catch((error) => {
      console.error('Unexpected error:', error)
      expect(true).toBeFalsy()
    })
})

test('mv: Move README to a directory (etc) removes the file', () => {
  expect.assertions(2)
  const emul = emulator()

  return emul.run('mv README etc')
    .then(() => emul.read('etc/README'))
    .then((content) => expect(content).toBe('read this first'))
    .then(() => expect(emul.read('README')).rejects.toThrow('README: No such file or directory'))
    .catch((error) => {
      console.error('Unexpected error:', error)
      expect(true).toBeFalsy()
    })
})

test('mv: Move README to another file (err.log) removes the file', () => {
  expect.assertions(2)
  const emul = emulator()

  return emul.run('mv README err.log')
    .then(() => emul.read('err.log'))
    .then((content) => expect(content).toBe('read this first'))
    .then(() => expect(emul.read('README')).rejects.toThrow('README: No such file or directory'))
    .catch((error) => {
      console.error('Unexpected error:', error)
      expect(true).toBeFalsy()
    })
})

test('mv: target is not a directory (README)', () => {
  expect.assertions(1)
  emulator().run('mv README err.log README').catch((output) => {
    expect(output).toBe('mv: target ‘README’ is not a directory')
  })
})

test('mv: target is not a directory (/non/existent)', () => {
  expect.assertions(1)
  emulator().run('mv README err.log /non/existent').catch((output) => {
    expect(output).toBe('mv: target ‘/non/existent’ is not a directory')
  })
})

test('mv: Move README to a directory (etc) with existing content', () => {
  expect.assertions(2)
  const emul = emulator()

  return emul.run('mv README etc')
    .then(() => emul.read('etc/README'))
    .then((content) => expect(content).toBe('read this first'))
    .then(() => expect(emul.read('README')).rejects.toThrow('README: No such file or directory'))
    .catch((error) => {
      console.error('Unexpected error:', error)
      expect(true).toBeFalsy()
    })
})

test('mv: Move non-existent file with existing destination', () => {
  expect.assertions(3)
  const emul = emulator()

  return emul.run('mv README non-existent /etc')
    .catch((error) => {
      expect(error).toBe('non-existent: No such file or directory')
    })
    .then(() => expect(emul.read('README')).rejects.toThrow('README: No such file or directory'))
    .then(() => emul.read('etc/README'))
    .then((output) => expect(output).toBe('read this first'))
})

test('mv: Move with -n flag with overwrite intent', () => {
  expect.assertions(2)
  const emul = emulator()

  return emul.run('mv -n README err.log')
    .then(() => {
      return emul.read('README')
    })
    .then((content) => expect(content).toBe('read this first'))
    .then(() => emul.read('err.log'))
    .then((content) => expect(content).toBe('some err'))
})

test('mv: Move with -n flag without overwrite intent', () => {
  expect.assertions(2)
  const emul = emulator()

  return emul.run('mv -n README new-location')
    .then((output) => {
      expect(output).toBe('')
    })
    .then(() => emul.read('new-location'))
    .then((output) => {
      expect(output).toBe('read this first')
    })
    .catch((error) => {
      console.error('Unexpected error:', error)
    })
})

test('mv: Move directory (somedir)', () => {
  expect.assertions(4)
  const emul = emulator()
  return emul.run('mv somedir othername')
    .then(() => emul.stat('somedir').catch(() => expect(true).toBeTruthy()))
    .then(() => emul.stat('somedir/subdir').catch(() => expect(true).toBeTruthy()))
    .then(() => emul.stat('othername').then(() => expect(true).toBeTruthy()))
    .then(() => emul.stat('othername/subdir').then(() => expect(true).toBeTruthy()))
    .catch((error) => console.log(error))
})
