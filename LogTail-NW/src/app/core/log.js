class Log {
  constructor ({index}) {
    this.index = index
  }

  info (message) {
    this.index.tabs.write('console', message)
  }

  debug (message) {
    if (this.index.config.Defaults.Debug) {
      this.index.tabs.write('console', '(debug) ' + message)
    }
  }

  error(message) {
    this.index.tabs.write('console', '(error) ' + message)
  }
}