function pwd (env) {
  env.system.getDir().then(function (dir) {
    env.output(dir)
    env.exit()
  })
}

export default pwd
