import { expect, test, fail } from '@jest/globals'
import bashEmulator from '../../src'
import FileType from '../../src/utils/fileTypes.js'

function emulator () {
  return bashEmulator({
    workingDirectory: '/',
    fileSystem: {
      '/': {
        type: 'dir',
        modified: Date.now()
      },
      '/file.txt': {
        type: FileType.File,
        modified: Date.now(),
        content: 'first'
      },
      '/file2.txt': {
        type: FileType.File,
        modified: Date.now(),
        content: 'first'
      }
    }
  })
}

test('touch throws error for missing operand', async () => {
  const emul = emulator()

  try {
    await emul.run('touch')
    fail('touch: expected to throw error for missing operand')
  } catch (error) {
    expect(error).toBe('touch: missing file operand')
  }
})

test('touch creates new files', async () => {
  const emul = emulator()

  await emul.run('touch 1.txt 2.txt')
  const stat1 = await emul.stat('1.txt')
  const stat2 = await emul.stat('2.txt')

  expect(stat1.name).toBe('1.txt')
  expect(stat2.name).toBe('2.txt')
})

test('touch updates modification time for existing files', async () => {
  const emul = emulator()
  const initialTime = emul.state.fileSystem['/file.txt'].modified

  await new Promise((resolve) => setTimeout(resolve, 50))

  await emul.run('touch file.txt')
  const stat = await emul.stat('file.txt')

  expect(stat.modified).not.toBe(initialTime)
})

test('touch throws error for non-existent directory in path', async () => {
  const emul = emulator()

  try {
    await emul.run('touch non/existent/filepath')
    fail('Expected touch to throw for non-existent directory in path')
  } catch (error) {
    expect(error).toBe('/non/existent: No such file or directory')
  }
})

test('touch updates existing file and ignores non-existent directory in path', async () => {
  const emul = emulator()
  const initialTime = emul.state.fileSystem['/file2.txt'].modified

  await new Promise((resolve) => setTimeout(resolve, 50))

  try {
    await emul.run('touch file2.txt non/existent/filepath')
    fail('Expected touch to throw for non-existent filepath')
  } catch (error) {
    expect(error).toBe('/non/existent: No such file or directory')
  }
  const stat = await emul.stat('file2.txt')

  expect(stat.modified).not.toBe(initialTime)
})
