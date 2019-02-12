const {app, ipcMain} = require('electron')
const {BrowserWindow} = require('electron')
const {Menu} = require('electron')
const uuid = require('uuid')

const Conf = require('../app/lib/Conf')

class MainWindow {
  /**
   * @param app Electron app.
   * @param config Browser window configuration.
   * @param url URL to open.
   * @param menu Native menu template.
   */
  constructor ({app, config, url, menu}) {
    this.app = app
    this.config = config
    this.conf = new Conf()
    this.url = url
    this.menu = menu
    this.window = undefined

    this.configurationWindow = undefined

    this.addGroupWindow = undefined
    this.editGroupWindow = undefined

    this.addServerWindow = undefined
    this.editServerWindow = undefined

    this.addFileWindow = undefined
    this.addFileWindowServer = undefined

    Object.seal(this)
  }

  /**
   * Creates the window and shows the window when ready.
   */
  createWindow () {
    this.window = new BrowserWindow(this.config)

    this.window.loadFile(this.url)
    //this.window.toggleDevTools()
    this.window.once('ready-to-show', () => {
      this.window.show()
    })
    this.window.on('blur', () => {
      this.window.webContents.send('blur', true)
    })
    this.window.on('focus', () => {
      this.window.webContents.send('focus', true)
    })
  }

  /**
   * Creates the native menu.
   */
  createMenu () {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate(
        this.menu
      )
    )
  }

  /**
   * Initializes the user interface.
   */
  init () {
    this.app.on('ready', () => {
      this.createWindow()
      this.createMenu()
    })
    this.app.on('activate', () => {
      this.window.restore()
      this.window.focus()
    })
    ipcMain.on('restore', () => {
      this.window.restore()
    })
    ipcMain.on('show-configuration-window', this.showConfigurationWindow.bind(this))
    ipcMain.on('show-add-server-window', this.showAddServerWindow.bind(this))
    ipcMain.on('show-add-group-window', this.showAddGroupWindow.bind(this))
    ipcMain.on('show-edit-server-window', this.showEditServerWindow.bind(this))
    ipcMain.on('show-add-file-window', this.showAddFileWindow.bind(this))

    ipcMain.on('cancel-configuration', () => {
      this.configurationWindow.hide()
      this.configurationWindow.destroy()
      this.configurationWindow = undefined
    })
    ipcMain.on('save-configuration', (event, params) => {
      const configuration = this.conf.get()
      configuration.debug = params.debugging
      configuration.settings.maxLines = params.logBuffer
      configuration.settings.dateFormat = params.dateFormat
      this.conf.set(configuration)
      this.configurationWindow.hide()
      this.configurationWindow.destroy()
      this.configurationWindow = undefined
      this.window.webContents.send('reload-configuration')
    })

    ipcMain.on('cancel-add-group', () => {
      this.addGroupWindow.hide()
      this.addGroupWindow.destroy()
      this.addGroupWindow = undefined
    })
    ipcMain.on('cancel-edit-group', () => {
      this.editGroupWindow.hide()
      this.editGroupWindow.destroy()
      this.editGroupWindow = undefined
    })
    ipcMain.on('cancel-add-server', () => {
      this.addServerWindow.hide()
      this.addServerWindow.destroy()
      this.addServerWindow = undefined
    })
    ipcMain.on('cancel-edit-server', () => {
      this.editServerWindow.hide()
      this.editServerWindow.destroy()
      this.editServerWindow = undefined
    })
    ipcMain.on('edit-server', (event, params) => {
      const configuration = this.conf.get()
      for (let i = 0; i < configuration.servers.length; i++) {
        if (configuration.servers[i].uuid === params.uuid) {
          configuration.servers[i].name = params.name
          configuration.servers[i].host = params.host
          configuration.servers[i].port = params.port
          configuration.servers[i].username = params.username
          configuration.servers[i].privateKey = params.key
        }
      }
      this.conf.set(configuration)
      this.editServerWindow.hide()
      this.editServerWindow.destroy()
      this.editServerWindow = undefined
      this.window.webContents.send('reload-configuration')
    })
    ipcMain.on('add-server', (event, params) => {
      const configuration = this.conf.get()
      configuration.servers.push({
        uuid: uuid.v1().toString(),
        name: params.name,
        host: params.host,
        port: params.port,
        username: params.username,
        privateKey: params.key,
        files: []
      })
      this.conf.set(configuration)
      this.addServerWindow.hide()
      this.addServerWindow.destroy()
      this.addServerWindow = undefined
      this.window.webContents.send('reload-configuration')
    })
    ipcMain.on('add-group', (event, params) => {
      const configuration = this.conf.get()
      configuration.groups.push({
        uuid: uuid.v1().toString(),
        name: params.name,
        files: params.files
      })
      this.conf.set(configuration)
      this.addGroupWindow.hide()
      this.addGroupWindow.destroy()
      this.addGroupWindow = undefined
      this.window.webContents.send('reload-configuration')
    })
    ipcMain.on('save-group', (event, params) => {
      const configuration = this.conf.get()
      for (let i = 0; i < configuration.groups.length; i++) {
        if (configuration.groups[i].uuid === params.uuid) {
          configuration.groups[i] = {
            uuid: params.uuid,
            name: params.name,
            files: params.files
          }
        }
      }
      this.conf.set(configuration)
      this.editGroupWindow.hide()
      this.editGroupWindow.destroy()
      this.editGroupWindow = undefined
      this.window.webContents.send('reload-configuration')
    })
    ipcMain.on('cancel-add-file', () => {
      this.addFileWindow.hide()
      this.addFileWindow.destroy()
      this.addFileWindow = undefined
      this.addFileWindowServer = undefined
    })
    ipcMain.on('add-file', (event, params) => {
      const serverUuid = this.addFileWindowServer.uuid
      const configuration = this.conf.get()
      for (let i = 0; i < configuration.servers.length; i++) {
        if (configuration.servers[i].uuid === serverUuid) {
          configuration.servers[i].files.push({
            ...params,
            uuid: uuid.v4(),
            serverUuid
          })
        }
      }
      this.conf.set(configuration)
      this.addFileWindow.hide()
      this.addFileWindow.destroy()
      this.addFileWindow = undefined
      this.addFileWindowServer = undefined
      this.window.webContents.send('reload-configuration')
    })

    const removeFile = (server, file, noReload, conf) => {
      const configuration = conf || this.conf.get()
      for (let i = 0; i < configuration.groups.length; i++) {
        let groupFiles = []
        for (let j = 0; j < configuration.groups[i].files.length; j++) {
          if (configuration.groups[i].files[j] !== file.uuid) {
            groupFiles.push(configuration.groups[i].files[j])
          }
        }
        configuration.groups[i].files = groupFiles
      }

      for (let i = 0; i < configuration.servers.length; i++) {
        if (configuration.servers[i].uuid === server.uuid) {
          let serverFiles = []
          for (let j = 0; j < configuration.servers[i].files.length; j++) {
            if (configuration.servers[i].files[j].uuid !== file.uuid) {
              serverFiles.push(configuration.servers[i].files[j])
            } else {
              this.window.webContents.send('close-tab', {
                tabId: file.uuid
              })
            }
          }
          configuration.servers[i].files = serverFiles
        }
      }
      this.conf.set(configuration)
      if (!noReload) {
        this.window.webContents.send('reload-configuration')
      }
    }

    ipcMain.on('remove-server', (event, params) => {
      const configuration = this.conf.get()

      let servers = []
      for (let i = 0; i < configuration.servers.length; i++) {
        if (params.server.uuid === configuration.servers[i].uuid) {
          for (let j = 0; j < configuration.servers[i].files.length; j++) {
            this.window.webContents.send('close-tab', {
              tabId: configuration.servers[i].files[j].uuid
            })
            for (let k = 0; k < configuration.groups.length; k++) {
              const pos = configuration.groups[k].files.indexOf(configuration.servers[i].files[j].uuid)
              if (pos !== -1) {
                // TODO: once a file is removed from a group, stop tracking it - but keep the group open.
                configuration.groups[k].files.splice(pos, 1)
              }
            }
          }
        } else {
          servers.push(configuration.servers[i])
        }
      }

      configuration.servers = servers
      this.conf.set(configuration)
      this.window.webContents.send('reload-configuration')
    })

    ipcMain.on('remove-group', (event, params) => {
      const configuration = this.conf.get()

      let groups = []
      for (let i = 0; i < configuration.groups.length; i++) {
        if (params.group.uuid !== configuration.groups[i].uuid) {
          groups.push(configuration.groups[i])
        } else {
          this.window.webContents.send('close-tab', {
            tabId: params.group.uuid
          })
        }
      }
      configuration.groups = groups
      this.conf.set(configuration)
      this.window.webContents.send('reload-configuration')
    })

    ipcMain.on('remove-file', (event, params) => {
      removeFile(params.server, params.file)
    })

    ipcMain.on('show-edit-group-window', this.showEditGroupWindow.bind(this))
  }

  showAddFileWindow (event, params) {
    this.addFileWindow = new BrowserWindow({
      parent: this.window,
      modal: true,
      show: false,
      height: 240,
      width: 410
    })

    this.addFileWindow.loadFile('./gui/resources/add-file.html')
    this.addFileWindowServer = params.server

    this.addFileWindow.once('ready-to-show', () => {
      this.addFileWindow.show()
    })
  }

  showAddServerWindow () {
    this.addServerWindow = new BrowserWindow({
      parent: this.window,
      modal: true,
      show: false,
      height: 530,
      width: 400
    })
    this.addServerWindow.loadFile('./gui/resources/add-server.html')

    this.addServerWindow.once('ready-to-show', () => {
      this.addServerWindow.show()
    })
  }

  showAddGroupWindow () {
    this.addGroupWindow = new BrowserWindow({
      parent: this.window,
      modal: true,
      show: false,
      height: 510,
      width: 400
    })
    this.addGroupWindow.loadFile('./gui/resources/add-group.html')

    this.addGroupWindow.once('ready-to-show', () => {
      this.addGroupWindow.show()
    })
  }

  showEditGroupWindow (event, params) {
    this.editGroupWindow = new BrowserWindow({
      parent: this.window,
      modal: true,
      show: false,
      height: 510,
      width: 400
    })
    this.editGroupWindow.loadFile('./gui/resources/edit-group.html')

    this.editGroupWindow.once('ready-to-show', () => {
      this.editGroupWindow.webContents.send('edit-group-data', params.group)
      this.editGroupWindow.show()
    })
  }

  showEditServerWindow (event, params) {
    this.editServerWindow = new BrowserWindow({
      parent: this.window,
      modal: true,
      show: false,
      height: 530,
      width: 400
    })
    this.editServerWindow.loadFile('./gui/resources/edit-server.html')

    this.editServerWindow.once('ready-to-show', () => {
      this.editServerWindow.webContents.send('edit-server-data', params.server)
      this.editServerWindow.show()
    })
  }

  showConfigurationWindow () {
    this.configurationWindow = new BrowserWindow({
      parent: this.window,
      modal: true,
      show: false,
      height: 320,
      width: 480
    })
    this.configurationWindow.loadFile('./gui/resources/configuration.html')

    this.configurationWindow.once('ready-to-show', () => {
      this.configurationWindow.show()
    })
  }
}

// Main application window.
const main = new MainWindow({
  app,
  config: {
    width: 860,
    height: 500,
    title: 'Log Watch',
    resizable: true,
    show: false
  },
  url: './gui/resources/main.html',
  menu: [
    {
      label: 'Log Watch',
      submenu: [
        {
          label: 'Quit',
          role: 'quit'
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:'},
        {label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:'}
      ]
    }
  ]
})
main.init()
