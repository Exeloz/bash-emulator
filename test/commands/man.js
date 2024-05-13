const fs = require('fs')
const test = require('tape')
const bashEmulator = require('../../src')
const FileType = require('../../src/utils/fileTypes')

test('man', function (t) {
  t.plan(1)

  const emulator = bashEmulator({
    history: [],
    user: 'test',
    workingDirectory: '/',
    fileSystem: {
      '/': {
        type: FileType.Dir,
        modified: Date.now()
      }
    }
  })

  emulator.run('man ls').then(function (output) {
    const expectedOutput = fs.readFileSync('./src/manuals/ls.txt', 'utf8').trim() + '\n\n'
    t.equal(output, expectedOutput, 'show hidden files with la -a')
  })
})
