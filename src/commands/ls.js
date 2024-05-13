const disclaimer =
  '\n' +
  'The output here is limited.' +
  '\n' +
  'On a real system you would also see file permissions, user, group, block size and more.'

function ls (env, args) {
  args.shift()

  const lsFlags = {
    a: {
      description: 'Show hidden files',
      handler: (listing) => listing
    },
    l: {
      description: 'Use long listing format',
      handler: (base, listing) =>
        Promise.all(
          listing.map((filePath) =>
            env.system.stat(base + '/' + filePath).then((stats) => {
              const date = new Date(stats.modified)
              const timestamp =
                date.toDateString().slice(4, 10) +
                ' ' +
                date.toTimeString().slice(0, 5)
              let type = stats.type

              if (type === 'dir') {
                type += ' '
              }
              return type + '  ' + timestamp + '  ' + stats.name
            })
          )
        ).then(
          (lines) =>
            'total ' + lines.length + '\n' + lines.join('\n') + disclaimer
        )
    }
  }

  function parseFlags (args) {
    const flags = {}
    args.forEach((arg) => {
      if (!arg.startsWith('-')) {
        return
      }

      for (let i = 1; i < arg.length; i++) {
        const flag = arg[i]
        if (!lsFlags[flag]) {
          env.output(`ls: invalid flag: ${arg}`)
          env.exit(2)
          return
        }
        flags[flag] = true
      }
    })

    return flags
  }

  const flags = parseFlags(args)

  const showHidden = flags.a || false
  const longFormat = flags.l || false

  function filterOutFlags (args) {
    return args.filter(function (e) {
      if (e.startsWith('-')) {
        return false
      }
      return true
    })
  }
  args = filterOutFlags(args)

  if (!args.length) {
    args.push('.')
  }

  function excludeHidden (listing) {
    return showHidden ? listing : listing.filter((item) => item[0] !== '.')
  }

  function formatListing (base, listing) {
    if (!longFormat) {
      return Promise.resolve(listing.join(' '))
    }
    return lsFlags.l.handler(base, listing)
  }

  Promise.all(
    args.sort().map((path) =>
      env.system
        .readDir(path)
        .then((listing) => excludeHidden(listing, showHidden))
        .then((listing) => formatListing(path, listing))
        .then((formattedListing) =>
          args.length === 1 ? formattedListing : path + ':\n' + formattedListing
        )
    )
  )
    .then((listings) => listings.join('\n\n'))
    .then((result) => {
      env.output(result)
      env.exit()
    })
    .catch((err) => {
      env.output('ls: ' + err)
      env.exit(2)
    })
}

module.exports = ls
