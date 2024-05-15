import { expect, test, jest } from '@jest/globals'
import bashEmulator from '../../src'
import FileType from '../../src/utils/fileTypes.js'

function emulator () {
  return bashEmulator({
    history: [],
    user: 'test',
    workingDirectory: '/',
    fileSystem: {
      '/': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/etc': {
        type: FileType.Dir,
        modified: new Date('Jun 27 2016 17:30').getTime()
      },
      '/home': {
        type: FileType.Dir,
        modified: new Date('Jul 23 2016 13:47').getTime()
      },
      '/home/test': {
        type: FileType.Dir,
        modified: Date.now()
      },
      '/home/test/README': {
        type: FileType.File,
        modified: new Date('Jan 01 2016 03:35').getTime(),
        content: 'read this first'
      },
      '/home/test/.secret': {
        type: FileType.File,
        modified: new Date('May 14 2016 07:10').getTime(),
        content: 'this file is hidden'
      }
    }
  }
  )
}

test('ls: Basic listing in the working directory', async () => {
  expect.assertions(1)

  const basicOutput = await emulator().run('ls')
  expect(basicOutput).toBe('etc home')
})

test('ls: Listing a specific directory', async () => {
  expect.assertions(1)

  const homeOutput = await emulator().run('ls home')
  expect(homeOutput).toBe('test')
})

test('ls: Listing multiple directories', async () => {
  expect.assertions(1)

  const multiDirOutput = await emulator().run('ls home /')
  const expectedMultiDirOutput = `/:
etc home

home:
test`
  expect(multiDirOutput).toBe(expectedMultiDirOutput)
})

test('ls: Non-existent file or directory (error handling)', async () => {
  expect.assertions(1)

  try {
    await emulator().run('ls nonexistent')
  } catch (err) {
    expect(err).toBe('ls: cannot access ‘nonexistent’: No such file or directory')
  }
})

test('ls: Listing contents of a directory', async () => {
  expect.assertions(1)

  const testDirOutput = await emulator().run('ls /home/test')
  expect(testDirOutput).toBe('README')
})

test('ls: Listing with all files (including hidden)', async () => {
  expect.assertions(1)

  const allFilesOutput = await emulator().run('ls -a /home/test')
  expect(allFilesOutput).toBe('.secret README')
})

test('ls: Listing with long format (limited output)', async () => {
  expect.assertions(1)

  const longFormatOutput = await emulator().run('ls -l /')
  const expectedLongFormatOutput = `total 2
dir   Jun 27 17:30  etc
dir   Jul 23 13:47  home
The output here is limited.
On a real system you would also see file permissions, user, group, block size and more.`
  expect(longFormatOutput).toBe(expectedLongFormatOutput)
})

test('ls: Long format with all files (limited output)', async () => {
  expect.assertions(1)

  const longFormatAllFilesOutput = await emulator().run('ls -l -a /home/test')
  const expectedLongFormatOutput = `total 2
file  May 14 07:10  .secret
file  Jan 01 03:35  README
The output here is limited.
On a real system you would also see file permissions, user, group, block size and more.`
  expect(longFormatAllFilesOutput).toBe(expectedLongFormatOutput)
})

test('ls: invalid flag fails', async () => {
  expect.assertions(1)

  return emulator().run('ls -P').catch((error) => {
    expect(error).toBe('ls: invalid option -- \'-P\'')
  })
})
