class Log {
  info (...args) {
    console.info(...args)
  }

  debug (...args) {
    console.debug(...args)
  }

  warn (...args) {
    console.warn(...args)
  }

  error (...args) {
    console.error(...args)
  }
}

module.exports = Log
