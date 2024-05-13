const test = require('tape')
const bashEmulator = require('../src')
const FileType = require('../src/utils/fileTypes')

test('initialise', function (t) {
  t.plan(1)

  const emulator = bashEmulator()

  t.equal(typeof emulator, 'object', 'emulator is an object')
})

test('initialise with state', function (t) {
  t.plan(1)

  const testState = {
    history: ['ls'],
    user: 'test',
    workingDirectory: '/home/test',
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
  }
  const emulator = bashEmulator(testState)

  t.deepEqual(emulator.state, testState, 'emulator uses initial state')
})

test('run missing command', function (t) {
  t.plan(1)

  bashEmulator().run('nonexistent').catch(function (err) {
    t.equals(err.message, 'nonexistent: command not found', 'error when running missing comand')
  })
})

test('run empty', function (t) {
  t.plan(1)

  bashEmulator().run('').then(function (output) {
    t.equals(output, '\n', 'newline when running empty')
  })
})

test('ignore whitespace', function (t) {
  t.plan(3)

  bashEmulator().run(' pwd ').then(function (output) {
    t.equals(output, '/home/user', 'runs with leading space')
  })

  bashEmulator().run('    pwd').then(function (output) {
    t.equals(output, '/home/user', 'runs with multiple spaces')
  })

  bashEmulator({
    fileSystem: {
      '/home': {
        type: FileType.Dir,
        modified: Date.now()
      }
    }
  }).run('ls   /home ').then(function (output) {
    t.equals(output, '', 'ignores spaces between args')
  })
})

test('change working directory', function (t) {
  t.plan(6)

  const emulator = bashEmulator()

  emulator.getDir()
    .then(function (dir) {
      t.equal(dir, '/home/user', 'initial WD matches')
    })
    .then(function () {
      return emulator.changeDir('..')
    })
    .then(function () {
      return emulator.getDir()
    })
    .then(function (dir) {
      t.equal(dir, '/home', 'changes dir with ..')
    })
    .then(function () {
      return emulator.changeDir('./user')
    })
    .then(function () {
      return emulator.getDir()
    })
    .then(function (dir) {
      t.equal(dir, '/home/user', 'changes dir with relative path')
    })
    .then(function () {
      return emulator.changeDir('/')
    })
    .then(function () {
      return emulator.getDir()
    })
    .then(function (dir) {
      t.equal(dir, '/', 'changes dir with absolute path')
    })
    .then(function () {
      return emulator.changeDir('home/user')
    })
    .then(function () {
      return emulator.getDir()
    })
    .then(function (dir) {
      t.equal(dir, '/home/user', 'changes dir with chained path')
    })
    .then(function () {
      return emulator.changeDir('nonexistent')
    })
    .catch(function (err) {
      t.equal(err.message, '/home/user/nonexistent: No such file or directory', 'cannot change to non-existent dir')
    })
})

test('update history', function (t) {
  t.plan(2)

  const emulator = bashEmulator()

  emulator.getHistory()
    .then(function (history) {
      t.deepEqual(history, [], 'history is empty')
    })
    .then(function () {
      return emulator.run('ls /')
    })
    .then(function () {
      return emulator.getHistory()
    })
    .then(function (history) {
      t.deepEqual(history, ['ls /'], 'command get appended to history')
    })
})

test('reading files', function (t) {
  t.plan(4)

  const emulator = bashEmulator({
    history: [],
    workingDirectory: '/',
    fileSystem: {
      '/': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/log.txt': {
        type: FileType.File,
        modified: Date.now(),
        content: 'some log'
      }
    }
  })

  emulator.read('nonexistent').catch(function (err) {
    t.equal(err.message, 'nonexistent: No such file or directory', 'cannot read missing file')
  })

  emulator.read('/').catch(function (err) {
    t.equal(err.message, '/: Is a directory', 'cannot read content of directory')
  })

  emulator.read('/log.txt').then(function (content) {
    t.equal(content, 'some log', 'read content of a file')
  })

  emulator.read('log.txt').then(function (content) {
    t.equal(content, 'some log', 'with relative path')
  })
})

test('reading a directory\'s content', function (t) {
  t.plan(4)

  const emulator = bashEmulator({
    fileSystem: {
      '/': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/home': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/home/user': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/etc': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/tmp.log': {
        type: FileType.File,
        modified: Date.now(),
        content: 'log'
      }
    }
  })

  emulator.readDir('/home/user').then(function (listing) {
    t.deepEqual(listing, [], 'lists empty')
  })

  emulator.readDir('..').then(function (listing) {
    t.deepEqual(listing, ['user'], 'lists folder')
  })

  emulator.readDir('/').then(function (listing) {
    t.deepEqual(listing, ['etc', 'home', 'tmp.log'], 'lists in order')
  })

  emulator.readDir('nonexistent').catch(function (err) {
    t.equal(err.message, 'cannot access ‘nonexistent’: No such file or directory', 'error for missing file')
  })
})

test('stat', function (t) {
  t.plan(7)

  const now = Date.now()
  const emulator = bashEmulator({
    workingDirectory: '/',
    fileSystem: {
      '/': {
        type: FileType.Dir,
        modified: now
      },
      '/text.md': {
        type: FileType.File,
        modified: now,
        content: 'Hey!'
      }
    }
  })

  emulator.stat('/').then(function (stats) {
    t.equal(stats.name, '', 'returns name')
    t.equal(stats.type, FileType.Dir, 'returns type')
    t.equal(stats.modified, now, 'returns modified time')
  })

  emulator.stat('/nope').catch(function (err) {
    t.equal(err.message, '/nope: No such file or directory', 'returns error for nonexistent')
  })

  emulator.stat('text.md').then(function (stats) {
    t.equal(stats.name, 'text.md', 'return filename')
    t.equal(stats.type, FileType.File, 'returns filetype')
    t.equal(stats.modified, now, 'return modified time')
  })
})

test('createDir', function (t) {
  t.plan(3)

  const emulator = bashEmulator({
    workingDirectory: '/',
    fileSystem: {
      '/': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/existing': {
        type: FileType.Dir,
        modified: Date.now()
      }
    }
  })

  emulator.createDir('mydir')
    .then(function () {
      return emulator.stat('/mydir')
    })
    .then(function (stat) {
      t.equal(stat.name, 'mydir', 'created directory with right name')
      t.equal(stat.type, FileType.Dir, 'is a directory')
    })

  emulator.createDir('/existing')
    .catch(function (err) {
      t.equal(err.message, 'cannot create directory \'/existing\': File exists', 'cannot overwrite existing file')
    })
})

test('write', function (t) {
  t.plan(8)

  const emulator = bashEmulator({
    workingDirectory: '/',
    fileSystem: {
      '/': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/home': {
        type: FileType.File,
        modified: Date.now()
      },
      '/exists': {
        type: FileType.File,
        modified: Date.now(),
        content: '123'
      },
      '/folderExists': {
        type: 'folder',
        modified: Date.now()
      }
    }
  })

  emulator.write('touched', 'by an angel').then(function () {
    t.ok(true, 'content can be string')
  })

  emulator.write('touched', { by: 'an angel' }).then(function () {
    t.ok(true, 'content can be stringifyable')
  })

  emulator.write('touched', {
    toJSON: function () { throw Error('Nein') }
  }).catch(function () {
    t.ok(true, 'content can not be unstringifyable')
  })

  emulator.write('nonexistent/touched', 'by an angel').catch(function (err) {
    t.equal(err.message, '/nonexistent: No such file or directory', 'error if parent folder doesnt exist')
  })

  emulator.write('home/touched', 'by an angel').catch(function (err) {
    t.equal(err.message, '/home: Is not a directory', 'error if parent folder isnt a directory')
  })

  emulator.write('/exists', '456')
    .then(function () {
      return emulator.read('/exists')
    })
    .then(function (content) {
      t.equals(content, '123456', 'appends content to existent file')
    })

  emulator.write('/folderExists', '456').catch(function (err) {
    t.equals(err.message, '/folderExists: Is a folder', 'error if target file is a folder')
  })

  emulator.write('/new', '123')
    .then(function () {
      return emulator.read('/new')
    })
    .then(function (content) {
      t.equals(content, '123', 'writes new file if file doesnt exist')
    })
})

test('removing', function (t) {
  t.plan(4)

  const emulator = bashEmulator({
    history: [],
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
      },
      '/log.txt': {
        type: FileType.File,
        modified: Date.now(),
        content: 'some log'
      }
    }
  })

  emulator.remove('/nonexistent').catch(function (err) {
    t.equal(err.message, 'cannot remove ‘/nonexistent’: No such file or directory', 'cannot remove non-existent file')
  })

  emulator.remove('log.txt').then(function () {
    return emulator.remove('/log.txt').catch(function () {
      t.ok(true, 'file is deleted')
    })
  })

  emulator.remove('/home').then(function () {
    emulator.remove('home').catch(function () {
      t.ok(true, 'directory is deleted')
    })
    emulator.remove('home/test').catch(function () {
      t.ok(true, 'sub-directory is deleted')
    })
  })
})

test('copy', function (t) {
  t.plan(4)

  const emulator = bashEmulator({
    history: [],
    workingDirectory: '/',
    fileSystem: {
      '/': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/file.txt': {
        type: FileType.File,
        modified: Date.now(),
        content: ''
      },
      '/log.txt': {
        type: FileType.File,
        modified: Date.now(),
        content: 'some log'
      }
    }
  })

  emulator.copy('log.txt', 'log-archive.txt').then(function () {
    emulator.stat('log.txt').then(function () {
      t.ok(true, 'old file is there')
    })
    emulator.stat('log-archive.txt').then(function () {
      t.ok(true, 'new file is created')
    })
  })

  emulator.copy('nonexistent', 'log-archive.txt').catch(function (output) {
    t.equal(output.message, 'nonexistent: No such file or directory', 'fails if source does not exist')
  })

  emulator.copy('file.txt', 'some/path').catch(function (output) {
    t.equal(output.message, '/some: No such file or directory', 'fails if destination is not in a directory')
  })
})

test('completion', function (t) {
  t.plan(10)

  const emulator = bashEmulator({
    history: [
      'cd /home/user',
      'ls ..',
      'pwd',
      'ls',
      'ls test',
      'ls ..'
    ]
  })

  emulator.completeDown('ls')
    .then(function (completion) {
      t.equal(completion, undefined, 'cannot go down')
      return emulator.completeUp('ls')
    })
    .then(function (completion) {
      t.equal(completion, 'ls ..', 'goes up')
      return emulator.completeUp('ls')
    })
    .then(function (completion) {
      t.equal(completion, 'ls test', 'goes up twice')
      return emulator.completeUp('ls')
    })
    .then(function (completion) {
      t.equal(completion, 'ls', 'includes base command too')
      return emulator.completeUp('ls')
    })
    .then(function (completion) {
      t.equal(completion, 'ls ..', 'commands can occur multiple times')
      return emulator.completeUp('ls')
    })
    .then(function (completion) {
      t.equal(completion, undefined, 'completion can be exhausted')
      return emulator.completeUp('ls')
    })
    .then(function (completion) {
      t.equal(completion, undefined, 'completion index stops with exhaustion')
      return emulator.completeDown('ls')
    })
    .then(function (completion) {
      t.equal(completion, 'ls', 'can go down again')
      return emulator.completeUp('cd /hom')
    })
    .then(function (completion) {
      t.equal(completion, 'cd /home/user', 'complete other command')
      return emulator.completeUp('ls')
    })
    .then(function (completion) {
      t.equal(completion, 'ls ..', 'completion is reset after command change')
    })
})

test('run with pipes', function (t) {
  t.plan(7)
  const emulator = bashEmulator()

  emulator.run('pwd | cat | cat').then(function (output) {
    t.equal(output, '/home/user\n', 'pipes work as expected')
  })

  emulator.run('ls | pwd').then(function (output) {
    t.equal(output, '/home/user', 'pipe output is ignored if next has no stdin')
  })

  emulator.run('| cat').catch(function (err) {
    t.equal(err.message, "syntax error near unexpected token `|'", 'pipe requires input')
  })

  emulator.run('cat | | cat').catch(function (err) {
    t.equal(err.message, "syntax error near unexpected token `|'", 'all pipes require input')
  })

  emulator.run('cat |').catch(function (err) {
    t.equal(err.message, 'syntax error: unexpected end of file', 'pipe requires output')
  })

  emulator.run('pwd|cat|cat').then(function (output) {
    t.equal(output, '/home/user\n', 'pipes work without whitespace')
  })

  emulator.run('pwd    | cat  |     cat').then(function (output) {
    t.equal(output, '/home/user\n', 'pipes ignore whitespace')
  })
})
