const test = require('tape')
const bashEmulator = require('../../src')

test('pwd', function (t) {
  t.plan(1)

  const emulator = bashEmulator({
    workingDirectory: '/'
  })

  emulator.run('pwd').then(function (dir) {
    t.equal(dir, '/', 'returns working directory')
  })
})
