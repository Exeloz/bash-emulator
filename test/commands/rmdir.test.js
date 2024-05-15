import { expect, test, fail } from '@jest/globals'
import bashEmulator from '../../src'
import FileType from '../../src/utils/fileTypes.js'

function emulator () {
  return bashEmulator({
    workingDirectory: '/',
    fileSystem: {
      '/': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/dir1': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/dir2': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/dir3': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/dir4': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/nonemptydir': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/nonemptydir/file': {
        type: FileType.File,
        modified: Date.now(),
        content: ''
      },
      '/somefile': {
        type: FileType.File,
        modified: Date.now(),
        content: ''
      }
    }
  })
}

test('rmdir removes a single directory', async () => {
  const emul = emulator()

  await emul.run('rmdir dir1')
  await expect(emul.stat('dir1')).rejects.toThrow()
})

test('rmdir removes multiple directories', async () => {
  const emul = emulator()

  await emul.run('rmdir dir2 dir3')
  await expect(emul.stat('dir2')).rejects.toThrow()
  await expect(emul.stat('dir3')).rejects.toThrow()
})

test('rmdir throws error for missing operand', async () => {
  try {
    await emulator().run('rmdir')
    fail('Expected rmdir to throw for missing operand')
  } catch (err) {
    expect(err).toBe('rmdir: missing operand')
  }
})

test('rmdir throws error for non-existent directory', async () => {
  try {
    await emulator().run('rmdir non/existent/path')
    fail('Expected rmdir to throw for non-existent directory')
  } catch (err) {
    expect(err).toBe('cannot access ‘non/existent/path’: No such file or directory')
  }
})

test('rmdir removes directory among other arguments', async () => {
  const emul = emulator()

  try {
    await emul.run('rmdir dir4 non/existent/path')
    fail('Expected rmdir to throw for non-existent directory')
  } catch (err) {
    expect(err).toBe('cannot access ‘non/existent/path’: No such file or directory')
  }

  await expect(emul.stat('dir4')).rejects.toThrow()
})

test('rmdir throws error for trying to remove a file', async () => {
  try {
    await emulator().run('rmdir somefile')
    fail('Expected rmdir to throw for files')
  } catch (err) {
    expect(err).toBe('rmdir: cannot remove ‘somefile’: Not a directory')
  }
})

test('rmdir throws error for trying to remove non-empty directory', async () => {
  try {
    await emulator().run('rmdir nonemptydir')
    fail('Expected rmdir to throw for non-empty directory')
  } catch (err) {
    expect(err).toBe('rmdir: failed to remove ‘nonemptydir’: Directory not empty')
  }
})
