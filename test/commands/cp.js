const test = require('tape')
const bashEmulator = require('../../src')
const FileType = require('../../src/utils/fileTypes')

test('cp', function (t) {
  t.plan(25)

  const emulator = bashEmulator({
    history: [],
    user: 'test',
    workingDirectory: '/',
    fileSystem: {
      '/': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/a': {
        type: FileType.File,
        modified: Date.now(),
        content: 'aaa'
      },
      '/b': {
        type: FileType.File,
        modified: Date.now(),
        content: 'bbb'
      },
      '/c': {
        type: FileType.File,
        modified: Date.now(),
        content: 'ccc'
      },
      '/d': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/e': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/e/subdir': {
        type: FileType.Dir,
        modified: Date.now()
      }
    }
  })

  emulator.run('cp').catch(function (output) {
    t.equal(output, 'cp: missing file operand', 'fail without args')
  })

  emulator.run('cp somefile').catch(function (output) {
    t.equal(output, 'cp: missing destination file operand after ‘somefile’', 'fail without destination')
  })

  emulator.run('cp nofile testdir').catch(function (output) {
    t.equal(output, 'nofile: No such file or directory', 'fail if file non-existent')
  })

  emulator.run('cp d testdir').catch(function (output) {
    t.equal(output, 'cp: omitting directory ‘d’', 'fail copying a directory')
  })

  emulator.run('cp a aa')
    .then(function (output) {
      t.equal(output, '', 'no output on success')
      return emulator.read('a')
    })
    .then(function (output) {
      t.equal(output, 'aaa', 'old file exists')
      return emulator.read('aa')
    })
    .then(function (output) {
      t.equal(output, 'aaa', 'copy to new file')
    })

  emulator.run('cp a b')
    .then(function (output) {
      t.equal(output, '', 'no output on success')
      return emulator.read('a')
    })
    .then(function (output) {
      t.equal(output, 'aaa', 'old file exists')
      return emulator.read('b')
    })
    .then(function (output) {
      t.equal(output, 'aaa', 'overwrite file')
    })

  emulator.run('cp a d')
    .then(function (output) {
      t.equal(output, '', 'no output on success')
      return emulator.read('a')
    })
    .then(function (output) {
      t.equal(output, 'aaa', 'old file exists')
      return emulator.read('d/a')
    })
    .then(function (output) {
      t.equal(output, 'aaa', 'copy to directory')
    })

  emulator.run('cp a b c').catch(function (output) {
    t.equal(output, 'cp: target ‘c’ is not a directory', 'fail if copying multiple files to file')
  })

  emulator.run('cp a b /non/existent').catch(function (output) {
    t.equal(output, 'cp: target ‘/non/existent’ is not a directory', 'fail if copying multiple files to missing directory')
  })

  emulator.run('cp a c d')
    .then(function (output) {
      t.equal(output, '', 'copy multiple files to directory')
      return emulator.read('a')
    })
    .then(function (output) {
      t.equal(output, 'aaa', 'old a exists')
      return emulator.read('c')
    })
    .then(function (output) {
      t.equal(output, 'ccc', 'old c exists')
      return emulator.read('d/a')
    })
    .then(function (output) {
      t.equal(output, 'aaa', 'new a exists')
      return emulator.read('d/c')
    })
    .then(function (output) {
      t.equal(output, 'ccc', 'new c exists')
    })

  emulator.run('cp -r e new-location')
    .then(function (output) {
      t.equal(output, '', 'copy directory')
      return emulator.stat('e')
    })
    .then(function () {
      t.ok(true, 'old directory is still there')
      return emulator.stat('e/subdir')
    })
    .then(function () {
      t.ok(true, 'old sub-directory is still there')
      return emulator.stat('new-location')
    })
    .then(function () {
      t.ok(true, 'create new directory')
      return emulator.stat('new-location/subdir')
    })
    .then(function () {
      t.ok(true, 'create new sub-directory')
    })
})
