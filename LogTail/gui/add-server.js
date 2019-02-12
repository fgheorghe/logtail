const electron = require('electron')
const {ipcRenderer} = electron
const {dialog} = electron.remote
const fs = require('fs')

class AddServer {
  constructor () {
    this.buttons = {
      cancel: document.getElementById('cancel-button'),
      add: document.getElementById('add-button'),
      browse: document.getElementById('browse-button')
    }

    this.inputs = {
      privateSshKey: document.getElementById('private-ssh-key-input'),
      name: document.getElementById('name-input'),
      host: document.getElementById('host-input'),
      port: document.getElementById('port-input'),
      username: document.getElementById('username-input')
    }
  }

  init () {
    document.onkeydown = (event) => {
      event = event || window.event
      if (event.keyCode === 27) {
        this.cancelAddServer()
      }
    }

    this.buttons.cancel.addEventListener('click', this.cancelAddServer.bind(this))
    this.buttons.add.addEventListener('click', this.addServer.bind(this))
    this.buttons.browse.addEventListener('click', this.browsePrivateKeyFile.bind(this))
  }

  browsePrivateKeyFile () {
    const file = dialog.showOpenDialog({
      properties: ['openFile', 'showHiddenFiles']
    })

    if (file) {
      this.inputs.privateSshKey.value = file
    }
  }

  cancelAddServer () {
    ipcRenderer.send('cancel-add-server')
  }

  addServer () {
    const name = this.inputs.name.value
    const host = this.inputs.host.value
    const port = parseInt(this.inputs.port.value, 10)
    const username = this.inputs.username.value
    const key = this.inputs.privateSshKey.value

    if (!name) {
      alert('Please input a unique server name.\nExample: Database Server 1')
    } else if (!host) {
      alert('Please input a hostname or ip address.\nExample: 192.168.1.2')
    } else if (!port || !Number.isInteger(port)) {
      alert('Please input a numeric port number.\nExample: 22')
    } else if (!username) {
      alert('Please input a valid username.\nExample: logwatchuser')
    } else if (!key || !fs.existsSync(key)) {
      alert('Please select an existing, and readable, private ssh key file.\nExample: ~/.ssh/id_rsa')
    } else {
      ipcRenderer.send('add-server', {
        name,
        host,
        port,
        username,
        key
      })
    }
  }
}
