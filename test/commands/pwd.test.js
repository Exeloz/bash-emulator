import { expect, test } from '@jest/globals'
import bashEmulator from '../../src'

test('pwd', function () {
  expect.assertions(1)

  const emulator = bashEmulator({
    workingDirectory: '/'
  })

  emulator.run('pwd').then(function (dir) {
    expect(dir).toBe('/')
  })
})
