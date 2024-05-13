const test = require('tape')
const bashEmulator = require('../../src')
const FileType = require('../../src/utils/fileTypes')

test('cd', function (t) {
  t.plan(3)

  const emulator = bashEmulator({
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

  emulator.run('cd')
    .then(function () {
      return emulator.getDir()
    })
    .then(function (dir) {
      t.equal(dir, '/home/test', 'go to users\'s home')
    })
    .then(function () {
      return emulator.run('cd /home')
    })
    .then(function () {
      return emulator.getDir()
    })
    .then(function (dir) {
      t.equal(dir, '/home', 'absolute path')
    })
    .then(function () {
      return emulator.run('cd nonexistent')
    })
    .catch(function (err) {
      t.equal(err, '/home/nonexistent: No such file or directory', 'error message')
    })
})
