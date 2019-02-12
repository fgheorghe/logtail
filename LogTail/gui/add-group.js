const electron = require('electron')
const {ipcRenderer} = electron

const Conf = require('../../app/lib/Conf')

class AddGroup {
  constructor () {
    this.conf = new Conf()

    this.buttons = {
      cancel: document.getElementById('cancel-button'),
      add: document.getElementById('add-button')
    }

    this.inputs = {
      name: document.getElementById('name-input'),
      server: document.getElementById('server-select'),
      serverFiles: document.getElementById('server-files-select'),
      watchFiles: document.getElementById('watch-files-select')
    }

    this.watchFiles = []

    this.currentServer = undefined
    this.currentFiles = {}
  }

  init () {
    document.onkeydown = (event) => {
      event = event || window.event
      if (event.keyCode === 27) {
        this.cancelAddGroup()
      }
    }

    this.buttons.cancel.addEventListener('click', this.cancelAddGroup.bind(this))
    this.buttons.add.addEventListener('click', this.addGroup.bind(this))

    const servers = this.conf.get().servers
    for (let i = 0; i < servers.length; i++) {
      const option = document.createElement('option')
      option.text = servers[i].name
      option.value = servers[i].uuid
      this.inputs.server.add(option, i + 1)
    }

    this.inputs.server.addEventListener('change', (event) => {
      this.currentServer = undefined
      this.currentFiles = {}
      const options = this.inputs.serverFiles.options
      const length = this.inputs.serverFiles.options.length
      for (let i = length - 1; i >= 0; i--) {
        options.remove(i)
      }

      if (event.target.value) {
        const servers = this.conf.get().servers
        for (let i = 0; i < servers.length; i++) {
          if (servers[i].uuid === event.target.value) {
            this.currentServer = servers[i]
            for (let j = 0; j < servers[i].files.length; j++) {
              const option = document.createElement('option')
              option.text = servers[i].files[j].path
              option.value = servers[i].files[j].uuid
              this.inputs.serverFiles.add(option, j)
              this.currentFiles[servers[i].files[j].uuid] = servers[i].files[j]
            }
          }
        }
      }
    })

    this.inputs.serverFiles.addEventListener('change', (event) => {
      const fileUuid = event.target.value
      this.inputs.serverFiles.selectedIndex = -1

      if (this.currentServer && this.currentFiles[fileUuid] && this.watchFiles.indexOf(fileUuid) === -1) {
        this.watchFiles.push(fileUuid)
        const option = document.createElement('option')
        option.text = this.currentServer.name + ':' + this.currentFiles[fileUuid].path
        option.value = fileUuid
        this.inputs.watchFiles.add(option, this.inputs.watchFiles.options.length)
      }
    })

    this.inputs.watchFiles.addEventListener('change', (event) => {
      const fileUuid = event.target.value
      const pos = this.watchFiles.indexOf(fileUuid)
      if (pos !== -1) {
        this.inputs.serverFiles.selectedIndex = -1
        this.watchFiles.splice(pos, 1)
        this.inputs.watchFiles.options.remove(pos)
      }
    })
  }

  cancelAddGroup () {
    ipcRenderer.send('cancel-add-group')
  }

  addGroup () {
    const name = this.inputs.name.value

    if (!name) {
      alert('Please input a valid group name.\nExample: Error Logs')
    } else {
      ipcRenderer.send('add-group', {
        name,
        files: this.watchFiles
      })
    }
  }
}
