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
      }
    }
  })
}

test('mkdir: creates a directory', async () => {
  expect.assertions(1)

  const emul = emulator()

  await emul.run('mkdir dirname')
  const dirnameStat = await emul.stat('dirname')
  expect(dirnameStat.name).toBe('dirname')
})

test('mkdir: creates multiple directories', async () => {
  expect.assertions(2)

  const emul = emulator()

  await emul.run('mkdir dir1 dir2')
  const dir1Stat = await emul.stat('dir1')
  expect(dir1Stat.name).toBe('dir1')
  const dir2Stat = await emul.stat('dir2')
  expect(dir2Stat.name).toBe('dir2')
})

test('mkdir: throws error for missing operand', async () => {
  expect.assertions(1)

  try {
    await emulator().run('mkdir')
    fail('Expected mkdir to throw for missing operand')
  } catch (err) {
    expect(err).toEqual('mkdir: missing operand')
  }
})

test('mkdir: throws error for non-existent parent directory', async () => {
  expect.assertions(1)

  try {
    await emulator().run('mkdir non/existent/path')
    fail('Expected mkdir to throw for non-existent parent')
  } catch (err) {
    expect(err).toBe('/non/existent: No such file or directory')
  }
})

test('mkdir: creates somedir even with failing path in same command', async () => {
  expect.assertions(2)

  const emul = emulator()
  try {
    await emul.run('mkdir somedir non/existent/path')
  } catch (err) {
    expect(err).toBe('/non/existent: No such file or directory')
  }
  const somedirStat = await emul.stat('somedir')
  expect(somedirStat.type).toBe(FileType.Dir)
})
