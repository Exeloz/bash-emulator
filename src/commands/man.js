const fetchManPage = require('./man_helper')

function man (env, args) {
  if (args.length === 1) {
    env.error(
      'What manual page do you want?' +
      'For example, try \'man man\'.')
    env.exit(1)
    return
  }

  const command = args[1]

  fetchManPage(env, command)
}

module.exports = man
