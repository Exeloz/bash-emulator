import { expect, test, fail } from '@jest/globals'
import bashEmulator from '../src/index.js'
import FileType from '../src/utils/fileTypes.js'

test('initialise', function () {
  expect.assertions(1)

  const emulator = bashEmulator()

  expect(typeof emulator).toBe('object')
})

test('initialise with state', function () {
  expect.assertions(1)

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

  expect(emulator.state).toEqual(testState)
})

test('run missing command', function () {
  expect.assertions(1)

  bashEmulator().run('nonexistent').catch(function (err) {
    expect(err.message).toBe('nonexistent: command not found')
  })
})

test('run empty', function () {
  expect.assertions(1)

  bashEmulator().run('').then(function (output) {
    expect(output).toBe('\n')
  })
})

test('ignore whitespace', function () {
  expect.assertions(3)

  bashEmulator().run(' pwd ').then(function (output) {
    expect(output).toBe('/home/user')
  })

  bashEmulator().run('    pwd').then(function (output) {
    expect(output).toBe('/home/user')
  })

  bashEmulator({
    fileSystem: {
      '/home': {
        type: FileType.Dir,
        modified: Date.now()
      }
    }
  }).run('ls   /home ').then(function (output) {
    expect(output).toBe('')
  })
})

test('change working directory', async () => {
  expect.assertions(5)

  const emulator = bashEmulator()

  const initialDir = await emulator.getDir()
  expect(initialDir).toBe('/home/user')

  await emulator.changeDir('..')
  const parentDir = await emulator.getDir()
  expect(parentDir).toBe('/home')

  await emulator.changeDir('./user')
  const userDir = await emulator.getDir()
  expect(userDir).toBe('/home/user')

  await emulator.changeDir('/')
  const rootDir = await emulator.getDir()
  expect(rootDir).toBe('/')

  try {
    await emulator.changeDir('nonexistent')
    fail('Expected error for non-existent directory')
  } catch (err) {
    expect(err.message).toBe('/nonexistent: No such file or directory')
  }
})

test('update history', async () => {
  expect.assertions(2)

  const emulator = bashEmulator()

  let history = await emulator.getHistory()
  expect(history).toEqual([])

  await emulator.run('ls /')
  history = await emulator.getHistory()
  expect(history).toEqual(['ls /'])
})

test('reading files', async () => {
  expect.assertions(4)

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
    expect(err.message).toBe('nonexistent: No such file or directory')
  })

  emulator.read('/').catch(function (err) {
    expect(err.message).toBe('/: Is a directory')
  })

  emulator.read('/log.txt').then(function (content) {
    expect(content).toBe('some log')
  })

  emulator.read('log.txt').then(function (content) {
    expect(content).toBe('some log')
  })
})

test('reading a directory\'s content', function () {
  expect.assertions(4)

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
    expect(listing).toEqual([])
  })

  emulator.readDir('..').then(function (listing) {
    expect(listing).toEqual(['user'])
  })

  emulator.readDir('/').then(function (listing) {
    expect(listing).toEqual(['etc', 'home', 'tmp.log'])
  })

  emulator.readDir('nonexistent').catch(function (err) {
    expect(err.message).toBe('cannot access ‘nonexistent’: No such file or directory')
  })
})

test('stat', function () {
  expect.assertions(7)

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
    expect(stats.name).toBe('')
    expect(stats.type).toBe(FileType.Dir)
    expect(stats.modified).toBe(now)
  })

  emulator.stat('/nope').catch(function (err) {
    expect(err.message).toBe('/nope: No such file or directory')
  })

  emulator.stat('text.md').then(function (stats) {
    expect(stats.name).toBe('text.md')
    expect(stats.type).toBe(FileType.File)
    expect(stats.modified).toBe(now)
  })
})

test('createDir', function () {
  expect.assertions(3)

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
      expect(stat.name).toBe('mydir')
      expect(stat.type).toBe(FileType.Dir)
    })

  emulator.createDir('/existing')
    .catch(function (err) {
      expect(err.message).toBe('cannot create directory \'/existing\': File exists')
    })
})

test('write', function () {
  expect.assertions(8)

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
    expect(true).toBeTruthy()
  })

  emulator.write('touched', { by: 'an angel' }).then(function () {
    expect(true).toBeTruthy()
  })

  emulator.write('touched', {
    toJSON: function () { throw Error('Nein') }
  }).catch(function () {
    expect(true).toBeTruthy()
  })

  emulator.write('nonexistent/touched', 'by an angel').catch(function (err) {
    expect(err.message).toBe('/nonexistent: No such file or directory')
  })

  emulator.write('home/touched', 'by an angel').catch(function (err) {
    expect(err.message).toBe('/home: Is not a directory')
  })

  emulator.write('/exists', '456')
    .then(function () {
      return emulator.read('/exists')
    })
    .then(function (content) {
      expect(content).toBe('123456')
    })

  emulator.write('/folderExists', '456').catch(function (err) {
    expect(err.message).toBe('/folderExists: Is a folder')
  })

  emulator.write('/new', '123')
    .then(function () {
      return emulator.read('/new')
    })
    .then(function (content) {
      expect(content).toBe('123')
    })
})

test('removing', function () {
  expect.assertions(4)

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
    expect(err.message).toBe('cannot remove ‘/nonexistent’: No such file or directory')
  })

  emulator.remove('log.txt').then(function () {
    return emulator.remove('/log.txt').catch(function () {
      expect(true).toBeTruthy()
    })
  })

  emulator.remove('/home').then(function () {
    emulator.remove('home').catch(function () {
      expect(true).toBeTruthy()
    })
    emulator.remove('home/test').catch(function () {
      expect(true).toBeTruthy()
    })
  })
})

test('copy', function () {
  expect.assertions(4)

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
      expect(true).toBeTruthy()
    })
    emulator.stat('log-archive.txt').then(function () {
      expect(true).toBeTruthy()
    })
  })

  emulator.copy('nonexistent', 'log-archive.txt').catch(function (output) {
    expect(output.message).toBe('nonexistent: No such file or directory')
  })

  emulator.copy('file.txt', 'some/path').catch(function (output) {
    expect(output.message).toBe('/some: No such file or directory')
  })
})

test('completion', async () => {
  expect.assertions(9)

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

  const lsCompletionDown = await emulator.completeDown('ls')
  expect(lsCompletionDown).toBe(undefined)

  const lsCompletionUp1 = await emulator.completeUp('ls')
  expect(lsCompletionUp1).toBe('ls ..')

  const lsCompletionUp2 = await emulator.completeUp('ls')
  expect(lsCompletionUp2).toBe('ls test')

  const lsCompletionUp3 = await emulator.completeUp('ls')
  expect(lsCompletionUp3).toBe('ls')

  const lsCompletionUp4 = await emulator.completeUp('ls')
  expect(lsCompletionUp4).toBe('ls ..')

  const lsCompletionUp5 = await emulator.completeUp('ls')
  expect(lsCompletionUp5).toBe(undefined)

  const lsCompletionDown3 = await emulator.completeDown('ls')
  expect(lsCompletionDown3).toBe('ls')

  const partialCommandCompletion = await emulator.completeUp('cd /hom')
  expect(partialCommandCompletion).toBe('cd /home/user')

  const lsCompletionUpFinal = await emulator.completeUp('ls')
  expect(lsCompletionUpFinal).toBe('ls ..')
})

test('run with pipes', async () => {
  expect.assertions(6)

  const emulator = bashEmulator()

  try {
    const output1 = await emulator.run('pwd | cat | cat')
    expect(output1).toBe('/home/user\n')
  } catch (err) {
    fail('Unexpected error:', err)
  }

  try {
    const output2 = await emulator.run('ls | pwd')
    expect(output2).toBe('/home/user')
  } catch (err) {
    fail('Unexpected error:', err)
  }

  try {
    await emulator.run('| cat')
    fail('Expected error for single pipe')
  } catch (err) {
    expect(err.message).toBe("syntax error near unexpected token `|'")
  }

  try {
    await emulator.run('cat | | cat')
    fail('Expected error for double pipe')
  } catch (err) {
    expect(err.message).toBe("syntax error near unexpected token `|'")
  }

  try {
    await emulator.run('cat |')
    fail('Expected error for pipe at the end')
  } catch (err) {
    expect(err.message).toBe('syntax error: unexpected end of file')
  }

  try {
    const output3 = await emulator.run('pwd    | cat  |     cat')
    expect(output3).toBe('/home/user\n')
  } catch (err) {
    fail('Unexpected error:', err)
  }
})

test('User related', function () {
  expect.assertions(1)

  const emulator = bashEmulator({
    user: 'test'
  })

  emulator.getUser()
    .then(function (user) {
      expect(user).toBe('test')
    })
})
