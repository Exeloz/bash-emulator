import 'array.prototype.findIndex'
import 'string.prototype.startsWith'
import 'string.prototype.includes'
import 'string.prototype.repeat'

import commands from './commands/index.js'
import FileType from './utils/fileTypes.js'
import BashError from './utils/errors.js'

function bashEmulator (initialState) {
  const state = createState(initialState)
  const completion = {}

  function getPath (path) {
    const homePath = '/home/' + state.user
    return joinPaths(state.workingDirectory, path.replace('~', homePath))
  }

  function parentExists (path) {
    const parentPath = getPath(path).split('/').slice(0, -1).join('/')

    return emulator.stat(parentPath).then(function (stats) {
      if (stats.type === FileType.Dir) {
        return Promise.resolve()
      }

      return Promise.reject(new BashError(parentPath + ': Is not a directory'))
    })
  }

  const emulator = {
    commands,

    state,

    run: function (input) {
      state.history.push(input)

      const argsList = input.split('|').map(function (pipe) {
        const args = pipe.trim().split(' ').filter(function (s) {
          return s
        })
        return args
      })

      if (argsList.length === 1 && !argsList[0].length) {
        return Promise.resolve('\n')
      }

      if (!argsList[argsList.length - 1][0]) {
        return Promise.reject(new BashError('syntax error: unexpected end of file'))
      }

      if (argsList.find(function (a) { return !a.length })) {
        return Promise.reject(new BashError("syntax error near unexpected token `|'"))
      }

      const nonExistent = argsList.filter(function (args) {
        const cmd = args[0]
        return !commands[cmd]
      })
      if (nonExistent.length) {
        return Promise.reject(new BashError(nonExistent.map(function (args) {
          return args[0] + ': command not found'
        }).join('\n')))
      }

      let result = ''

      return new Promise(function (resolve, reject) {
        const pipes = argsList.map(function (args, idx) {
          const isLast = idx === argsList.length - 1
          return commands[args[0]]({
            output: function (str) {
              if (isLast) {
                result += str
                return
              }
              const nextInput = pipes[idx + 1] && pipes[idx + 1].input
              if (nextInput) {
                nextInput(str)
              }
            },
            // NOTE: For now we just redirect stderr to stdout
            error: function (str) {
              result += str
            },
            // NOTE: For now we don't use specific error codes
            exit: function (code) {
              if (isLast) {
                if (code) {
                  reject(result)
                } else {
                  resolve(result)
                }
                return
              }
              const nextClose = pipes[idx + 1] && pipes[idx + 1].close
              if (nextClose) {
                nextClose()
              }
            },
            system: emulator
          }, args)
        })
      })
    },

    getDir: function () {
      return Promise.resolve(state.workingDirectory)
    },

    changeDir: function (target) {
      const normalizedPath = getPath(target)
      if (!state.fileSystem[normalizedPath]) {
        return Promise.reject(new BashError(normalizedPath + ': No such file or directory'))
      }
      state.workingDirectory = normalizedPath
      return Promise.resolve()
    },

    read: function (arg) {
      const filePath = getPath(arg)
      if (!state.fileSystem[filePath]) {
        return Promise.reject(new BashError(arg + ': No such file or directory'))
      }
      if (state.fileSystem[filePath].type !== FileType.File) {
        return Promise.reject(new BashError(arg + ': Is a directory'))
      }
      return Promise.resolve(state.fileSystem[filePath].content)
    },

    readDir: function (path) {
      const dir = getPath(path)
      if (!state.fileSystem[dir]) {
        return Promise.reject(new BashError('cannot access ‘' + path + '’: No such file or directory'))
      }
      const listing = Object.keys(state.fileSystem)
        .filter(function (path) {
          return path.startsWith(dir) && path !== dir
        })
        .map(function (path) {
          return path.substr(dir === '/' ? dir.length : dir.length + 1)
        })
        .filter(function (path) {
          return !path.includes('/')
        })
        .sort()
      return Promise.resolve(listing)
    },

    stat: function (path) {
      const filePath = getPath(path)
      if (!state.fileSystem[filePath]) {
        return Promise.reject(new BashError(path + ': No such file or directory'))
      }

      const pathParts = filePath.split('/')
      return Promise.resolve({
        modified: state.fileSystem[filePath].modified,
        type: state.fileSystem[filePath].type,
        name: pathParts[pathParts.length - 1]
      })
    },

    createDir: function (path) {
      return emulator.stat(path)
        .then(function () {
          return Promise.reject(new BashError('cannot create directory \'' + path + '\': File exists'))
        }, function () {
          return parentExists(path)
        })
        .then(function () {
          const dirPath = getPath(path)
          state.fileSystem[dirPath] = {
            type: FileType.Dir,
            modified: Date.now()
          }
        })
    },

    write: function (path, content) {
      if (typeof content !== 'string') {
        try {
          content = JSON.stringify(content)
        } catch (e) {
          return Promise.reject(new BashError(e))
        }
      }

      return parentExists(path).then(function () {
        const filePath = getPath(path)
        return emulator.stat(path).then(function (stats) {
          if (stats.type !== FileType.File) {
            return Promise.reject(new BashError(filePath + ': Is a folder'))
          }
          const oldContent = state.fileSystem[filePath].content
          state.fileSystem[filePath].content = oldContent + content
          state.fileSystem[filePath].modified = Date.now()
        }, function () {
          // file doesnt exist: write
          state.fileSystem[filePath] = {
            type: FileType.File,
            modified: Date.now(),
            content
          }
        })
      })
    },

    remove: function (path) {
      const filePath = getPath(path)
      if (!state.fileSystem[filePath]) {
        return Promise.reject(new BashError('cannot remove ‘' + path + '’: No such file or directory'))
      }
      Object.keys(state.fileSystem).forEach(function (key) {
        if (key.startsWith(filePath)) {
          delete state.fileSystem[key]
        }
      })
      return Promise.resolve()
    },

    copy: function (source, destination) {
      const sourcePath = getPath(source)
      const destinationPath = getPath(destination)
      if (!state.fileSystem[sourcePath]) {
        return Promise.reject(new BashError(source + ': No such file or directory'))
      }
      function renameAllSub (key) {
        if (key.startsWith(sourcePath)) {
          const destKey = key.replace(sourcePath, destinationPath)
          state.fileSystem[destKey] = state.fileSystem[key]
        }
      }
      return parentExists(destinationPath).then(function () {
        Object.keys(state.fileSystem).forEach(renameAllSub)
      })
    },

    getUser: function () {
      return Promise.resolve(state.user)
    },

    getHistory: function () {
      return Promise.resolve(state.history)
    },

    completeUp: function (input) {
      const historyChanged = completion.historySize !== state.history.length
      const inputChanged = input !== completion.input
      if (inputChanged || historyChanged) {
        // reset completion
        completion.input = input
        completion.index = 0
        completion.historySize = state.history.length
        completion.list = state.history.filter(function (item) {
          return item.startsWith(input)
        }).reverse()
      } else if (completion.index < completion.list.length - 1) {
        completion.index++
      } else {
        return Promise.resolve(undefined)
      }
      return Promise.resolve(completion.list[completion.index])
    },

    completeDown: function (input) {
      if (input !== completion.input || completion.index < 0) {
        return Promise.resolve(undefined)
      }
      completion.index--
      return Promise.resolve(completion.list[completion.index])
    }
  }

  return emulator
}

function createState (initialState) {
  const state = defaultState()
  if (!initialState) {
    return state
  }
  Object.keys(state).forEach(function (key) {
    if (initialState[key]) {
      state[key] = initialState[key]
    }
  })
  return state
}

function defaultState () {
  return {
    history: [],
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
      }
    },
    user: 'user',
    workingDirectory: '/home/user'
  }
}

function joinPaths (a, b) {
  if (!b) {
    return a
  }
  const path = (b.charAt(0) === '/' ? '' : a + '/') + b
  const parts = path.split('/').filter(function noEmpty (p) {
    return !!p
  })
  // Thanks to nodejs' path.join algorithm
  let up = 0
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]
    if (part === '.') {
      parts.splice(i, 1)
    } else if (part === '..') {
      parts.splice(i, 1)
      up++
    } else if (up) {
      parts.splice(i, 1)
      up--
    }
  }
  return '/' + parts.join('/')
}

export default bashEmulator
