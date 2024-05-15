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
      '/file1': {
        type: FileType.File,
        modified: Date.now(),
        content: ''
      },
      '/file2': {
        type: FileType.File,
        modified: Date.now(),
        content: ''
      },
      '/file3': {
        type: FileType.File,
        modified: Date.now(),
        content: ''
      },
      '/somedir': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/somedir/file1': {
        type: FileType.File,
        modified: Date.now(),
        content: ''
      }
    }
  })
}

test('rm removes a single file', async () => {
  expect.assertions(1)

  const emul = emulator()

  await emul.run('rm file1')
  await expect(emul.stat('file1')).rejects.toThrow()
})

test('rm removes multiple files', async () => {
  expect.assertions(2)

  const emul = emulator()

  await emul.run('rm file2 file3')
  await expect(emul.stat('file2')).rejects.toThrow()
  await expect(emul.stat('file3')).rejects.toThrow()
})

test('rm missing operand', async () => {
  expect.assertions(1)

  try {
    await emulator().run('rm')
    fail('Expected rm to throw an error')
  } catch (error) {
    expect(error).toBe('rm: missing operand')
  }
})

test('rm fails to remove directory', async () => {
  expect.assertions(1)

  try {
    await emulator().run('rm somedir')
  } catch (error) {
    expect(error).toBe('rm: cannot remove ‘somedir’: Is a directory')
  }
})

test('rm throws error for non-existent file', async () => {
  expect.assertions(1)

  try {
    await emulator().run('rm non/existent/path')
  } catch (error) {
    expect(error).toBe('cannot remove ‘non/existent/path’: No such file or directory')
  }
})

test('rm -r removes directory recursively', async () => {
  expect.assertions(3)

  const emul = emulator()

  await emul.run('rm -r /')
  await expect(emul.stat('/otherdir/sub')).rejects.toThrow()
  await expect(emul.stat('/otherdir')).rejects.toThrow()
  await expect(emul.stat('/')).rejects.toThrow()
})

test('rm respects working directory', async () => {
  expect.assertions(2)

  const emul = emulator()

  await emul.run('cd somedir')
  await emul.run('rm file1')
  await expect(emul.stat('/somedir/file1')).rejects.toThrow('/somedir/file1: No such file or directory')

  await emul.run('cd /')
  const rootFileStat = await emul.stat('/file1')
  expect(rootFileStat.type).toBe(FileType.File)
})
