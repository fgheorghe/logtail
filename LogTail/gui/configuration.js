const electron = require('electron')
const {ipcRenderer} = electron

const Conf = require('../../app/lib/Conf')

class Configuration {
  constructor () {
    this.conf = new Conf()

    this.buttons = {
      cancel: document.getElementById('cancel-button'),
      save: document.getElementById('save-button')
    }

    this.inputs = {
      logBuffer: document.getElementById('log-buffer-input'),
      dateFormat: document.getElementById('date-format-input'),
      debugging: document.getElementById('debugging-checkbox')
    }
  }

  init () {
    document.onkeydown = (event) => {
      event = event || window.event
      if (event.keyCode === 27) {
        this.cancelConfiguration()
      }
    }

    this.inputs.logBuffer.value = this.conf.get().settings.maxLines
    this.inputs.dateFormat.value = this.conf.get().settings.dateFormat
    this.inputs.debugging.checked = this.conf.get().debug

    this.buttons.cancel.addEventListener('click', this.cancelConfiguration.bind(this))
    this.buttons.save.addEventListener('click', this.saveConfiguration.bind(this))
  }

  cancelConfiguration () {
    ipcRenderer.send('cancel-configuration')
  }

  saveConfiguration () {
    const logBuffer = parseInt(this.inputs.logBuffer.value, 10)
    const dateFormat = this.inputs.dateFormat.value
    const debugging = this.inputs.debugging.checked

    if (!Number.isInteger(logBuffer)) {
      alert('Log buffer value must be an integer.\nExample: 1000')
    } else if (!dateFormat) {
      alert('Please input a valid date format.\nExample: YYYY-MM-DD HH:mm:ss.SSS')
    } else {
      ipcRenderer.send('save-configuration', {
        logBuffer,
        dateFormat,
        debugging
      })
    }
  }
}
