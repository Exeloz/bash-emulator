const fs = require('fs')
const test = require('tape')
const nock = require('nock')
const bashEmulator = require('../../src')
const fetchManPage = require('../../src/commands/man_helper')
const FileType = require('../../src/utils/fileTypes')

test('man', async (t) => {
  t.plan(3)

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

  try {
    const lsOutput = await emulator.run('man ls')
    const expectedLsOutput = fs.readFileSync('./src/manuals/ls.txt', 'utf8').trim() + '\n\n'
    t.equal(lsOutput, expectedLsOutput, 'show man page for valid command: ls')

    await emulator.run('man nonexistent')
    t.fail('should throw error for non-existent manual')
  } catch (err) {
    t.equal(err, 'No manual entry for nonexistent', 'throws error for invalid manual')
  }

  try {
    await emulator.run('man')
  } catch (err) {
    const expected =
    'What manual page do you want?' +
    'For example, try \'man man\'.'

    t.equal(err, expected, 'throws error for empty command man')
  }
})

test('fetchManPage - request failed', async (t) => {
  t.plan(2)

  const mockUrl = 'https://raw.githubusercontent.com/Exeloz/bash-emulator/master/src/manuals/nonexistent.txt'
  const env = {
    error: (message) => t.equal(message, 'man : Request failed'),
    exit: () => t.pass('env.exit called')
  }

  nock(mockUrl).get(/\/.*$/).reply(200, (uri, requestBody) => {
    const error = new Error('Network error')
    error.code = 'NETWORK_ERROR'
    return {
      statusCode: 200,
      error
    }
  })

  try {
    await fetchManPage(env, 'nonexistent')
  } catch (err) {
    const expected = 'man : Request failed'

    t.equal(err, expected, 'throws error if error requst failed from fetchManPage')
  }
  nock.cleanAll()
})
