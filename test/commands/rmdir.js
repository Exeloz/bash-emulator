const test = require('tape')
const bashEmulator = require('../../src')
const FileType = require('../../src/utils/fileTypes')

test('rmdir', function (t) {
  t.plan(9)

  const emulator = bashEmulator({
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

  emulator.run('rmdir dir1')
    .then(function () {
      return emulator.stat('dir1')
    })
    .catch(function () {
      t.ok(true, 'remove directory')
    })

  emulator.run('rmdir dir2 dir3')
    .then(function () {
      return emulator.stat('dir2')
    })
    .catch(function () {
      t.ok(true, 'remove first directory')
    })
    .then(function () {
      return emulator.stat('dir3')
    })
    .catch(function () {
      t.ok(true, 'remove second directory')
    })

  emulator.run('rmdir').catch(function (output) {
    t.equal(output, 'rmdir: missing operand', 'fail without argument')
  })

  emulator.run('rmdir non/existent/path').catch(function (err) {
    t.equal(err, 'cannot access ‘non/existent/path’: No such file or directory', 'fail with non-existent location')
  })

  emulator.run('rmdir dir4 non/existent/path somefile')
    .catch(function (err) {
      t.equal(err, 'cannot access ‘non/existent/path’: No such file or directory', 'fail with non-existent location')
    })
    .then(function () {
      return emulator.stat('dir4')
    })
    .catch(function () {
      t.ok(true, 'remove first directory')
    })

  emulator.run('rmdir somefile').catch(function (err) {
    t.equal(err, 'rmdir: cannot remove ‘somefile’: Not a directory', 'Fail when trying to remove a file')
  })

  emulator.run('rmdir nonemptydir').catch(function (err) {
    t.equal(err, 'rmdir: failed to remove ‘nonemptydir’: Directory not empty', 'fail when trying to remove a non-empty directory')
  })
})
