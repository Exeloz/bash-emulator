const test = require('tape')
const bashEmulator = require('../../src')

test('rm', function (t) {
  t.plan(9)

  const emulator = bashEmulator({
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
      '/file4': {
        type: FileType.File,
        modified: Date.now(),
        content: ''
      },
      '/somedir': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/otherdir': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/otherdir/sub': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/moredir': {
        type: FileType.Dir,
        modified: Date.now()
      }
    }
  })

  emulator.run('rm file1')
    .then(function () {
      return emulator.stat('file1')
    })
    .then(null, function () {
      t.ok(true, 'remove file')
    })

  emulator.run('rm file2 file3')
    .then(function () {
      return emulator.stat('file2')
    })
    .then(null, function () {
      t.ok(true, 'remove first file')
    })
    .then(function () {
      return emulator.stat('file3')
    })
    .then(null, function () {
      t.ok(true, 'remove second file')
    })

  emulator.run('rm').then(null, function (output) {
    t.equal(output, 'rm: missing operand', 'fail without argument')
  })

  emulator.run('rm somedir').then(null, function (err) {
    t.equal(err, 'rm: cannot remove ‘somedir’: Is a directory', 'fail removing directory')
  })

  emulator.run('rm non/existent/path').then(null, function (err) {
    t.equal(err, 'cannot remove ‘non/existent/path’: No such file or directory', 'fail with non-existent location')
  })

  emulator.run('rm -r /otherdir')
    .then(function () {
      return emulator.stat('/otherdir/sub')
    })
    .then(null, function () {
      t.ok(true, 'remove sub-directory')
    })
    .then(function () {
      return emulator.stat('/otherdir')
    })
    .then(null, function () {
      t.ok(true, 'remove parent directory')
    })

  emulator.run('rm -R /moredir')
    .then(function () {
      return emulator.stat('/moredir')
    })
    .then(null, function () {
      t.ok(true, 'remove directory with -R')
    })
})
