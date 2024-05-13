const test = require('tape')
const bashEmulator = require('../../src')

test('history', async (t) => {
  t.plan(4)

  const emulator = bashEmulator()

  await emulator.run('pwd')
  try {
    await emulator.run('nonexistent cmd')
  } catch (err) {
  }

  const history = await emulator.run('history')
  t.equal(history, '    1  pwd\n    2  nonexistent cmd\n    3  history', 'appends to history')

  const emulatorLong = bashEmulator({
    history: ['ls', 'ls', 'ls', 'ls', 'ls', 'ls', 'ls', 'ls', 'ls', 'ls']
  })

  const longHistory = await emulatorLong.run('history')
  const expectedLongHistory =
  '    1  ls\n' +
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
  t.equal(longHistory, expectedLongHistory, 'formats history')

  const emulatorLongHistory = bashEmulator({
    history: ['ls', 'ls', 'ls', 'ls', 'ls', 'ls', 'ls', 'ls', 'ls', 'ls']
  })

  const limitedHistory = await emulatorLongHistory.run('history 5')
  const expectedLimitedHistory =
  '    7  ls\n' +
  '    8  ls\n' +
  '    9  ls\n' +
  '   10  ls\n' +
  '   11  history'

  t.equal(limitedHistory, expectedLimitedHistory, 'formats history specified length')

  try {
    await emulatorLong.run('history test')
  } catch (err) {
    t.equal(err, 'history: test numeric argument required', 'fail if not numeric argument')
  }
})
