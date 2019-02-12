const settings = require('electron-settings')

class Conf {
  get () {
    if (!settings.has('configuration')) {
      this.set({
        debug: false,
        servers: [],
        groups: [],
        settings: {
          dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
          maxLines: 1000
        }
      })
    }

    return settings.get('configuration')
  }

  set (configuration) {
    settings.set('configuration', configuration)
  }
}

module.exports = Conf
