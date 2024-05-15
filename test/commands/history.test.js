import { expect, test } from '@jest/globals'
import bashEmulator from '../../src'

test('history: Captures command history', async () => {
  expect.assertions(1)
  const emulator = bashEmulator()

  await emulator.run('pwd')
  try {
    await emulator.run('nonexistent cmd')
  } catch { }

  const history = await emulator.run('history')
  expect(history).toBe('    1  pwd\n    2  nonexistent cmd\n    3  history')
})

test('history: Displays all commands (default)', async () => {
  expect.assertions(1)
  const emulatorLong = bashEmulator({
    history: Array(10).fill('ls')
  })

  const longHistory = await emulatorLong.run('history')
  const expectedLongHistory = '    1  ls\n' +
                              '    2  ls\n' +
                              '    3  ls\n' +
                              '    4  ls\n' +
                              '    5  ls\n' +
                              '    6  ls\n' +
                              '    7  ls\n' +
                              '    8  ls\n' +
                              '    9  ls\n' +
                              '   10  ls\n' +
                              '   11  history'
  expect(longHistory).toBe(expectedLongHistory)
})

test('history: Limits output with history n', async () => {
  expect.assertions(1)
  const emulatorLongHistory = bashEmulator({
    history: Array(10).fill('ls')
  })

  const limitedHistory = await emulatorLongHistory.run('history 5')
  const expectedLimitedHistory = '    7  ls\n' +
                                '    8  ls\n' +
                                '    9  ls\n' +
                                '   10  ls\n' +
                                '   11  history 5'
  expect(limitedHistory).toBe(expectedLimitedHistory)
})

test('history: Handles invalid numeric argument', async () => {
  expect.assertions(1)
  const emulatorLong = bashEmulator()

  try {
    await emulatorLong.run('history test')
  } catch (err) {
    expect(err).toBe('history: test numeric argument required')
  }
})
