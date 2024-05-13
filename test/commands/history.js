const test = require('tape')
const bashEmulator = require('../../src')

test('history', function (t) {
  t.plan(2)

  const emulator = bashEmulator()

  emulator.run('pwd')
    .then(function () {
      return emulator.run('nonexistent cmd')
    })
    .catch(function () {
      return emulator.run('history')
    })
    .then(function (history) {
      t.equal(history, '    1  pwd\n    2  nonexistent cmd\n    3  history', 'appends to history')
    })

  const emulatorLong = bashEmulator({
    history: ['ls', 'ls', 'ls', 'ls', 'ls', 'ls', 'ls', 'ls', 'ls', 'ls']
  })

  emulatorLong.run('history').then(function (history) {
    const res =
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
    t.equal(history, res, 'formats history')
  })
})
