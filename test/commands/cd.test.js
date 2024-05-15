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
      '/home': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/home/test': {
        type: FileType.Dir,
        modified: Date.now()
      }
    }
  })
}

test('cd changes directory to home directory (implicit)', () => {
  const emul = emulator()
  return emul.run('cd')
    .then(() => emul.getDir())
    .then((dir) => {
      expect(dir).toBe('/home/test')
    })
})

test('cd changes directory to specified path', () => {
  const emul = emulator()

  return emul.run('cd /home')
    .then(() => emul.getDir())
    .then((dir) => {
      expect(dir).toBe('/home')
    })
})

test('cd throws error for non-existent directory', () => {
  const emul = emulator()

  return emul.run('cd nonexistent')
    .catch((err) => {
      expect(err).toBe('/nonexistent: No such file or directory')
    })
})
