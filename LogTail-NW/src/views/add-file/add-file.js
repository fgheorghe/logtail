const electron = require('electron')
const {ipcRenderer} = electron
const {ipcMain} = electron.remote

class AddFile {
  constructor () {
    this.buttons = {
      cancel: document.getElementById('cancel-button'),
      add: document.getElementById('add-button')
    }

    this.inputs = {
      path: document.getElementById('path-input'),
      sudo: document.getElementById('sudo-checkbox')
    }
  }

  init () {
    document.onkeydown = (event) => {
      event = event || window.event
      if (event.keyCode === 27) {
        this.cancelAddFile()
      }
    }

    this.buttons.cancel.addEventListener('click', this.cancelAddFile.bind(this))
    this.buttons.add.addEventListener('click', this.addFile.bind(this))

    ipcMain.on('add-file-error', (event, ex) => {
      if (ex.errno === 19) {
        alert('Path already in use for this server.')
      }
    })
  }

  cancelAddFile () {
    ipcRenderer.send('cancel-add-file')
  }

  addFile () {
    const path = this.inputs.path.value
    const sudo = this.inputs.sudo.checked

    if (!path) {
      alert('Please input a valid server path.\nExample: /var/log/syslog')
    } else {
      ipcRenderer.send('add-file', {
        path,
        sudo
      })
    }
  }
}
