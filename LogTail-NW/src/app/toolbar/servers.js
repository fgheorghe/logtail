class Servers {
  constructor ({index, toolbar}) {
    this.toolbar = toolbar
    this.index = index

    this.addServerWindow = undefined
    this.editServerWindow = undefined
    this.addFileWindow = undefined
    this.addFileWindowServer = undefined

    this.initIpc()
  }

  initIpc () {
    this.ipcMain = this.index.electron.remote.ipcMain
    this.ipcRenderer = this.index.electron.ipcRenderer

    this.ipcMain.on('cancel-add-server', this.cancelAddServer.bind(this))
    this.ipcMain.on('cancel-edit-server', this.cancelEditServer.bind(this))
    this.ipcMain.on('cancel-add-file', this.cancelAddFile.bind(this))
    this.ipcMain.on('add-server', this.addServer.bind(this))
    this.ipcMain.on('add-file', this.addFile.bind(this))
    this.ipcMain.on('edit-server', this.addServer.bind(this))
  }

  hideAddServerWindow () {
    this.addServerWindow.hide()
    this.addServerWindow.destroy()
    this.addServerWindow = undefined
  }

  showAddServerWindow () {
    this.addServerWindow = new this.index.electron.remote.BrowserWindow({
      parent: this.index.electron.remote.getCurrentWindow(),
      modal: true,
      show: false,
      height: 530,
      width: 400
    })

    this.addServerWindow.loadFile('src/views/add-server/add-server.html')

    this.addServerWindow.once('ready-to-show', () => {
      this.addServerWindow.show()
    })
  }

  cancelAddServer () {
    this.index.log.debug('"cancel-add-server" triggered.')
    this.hideAddServerWindow()
  }

  hideEditServerWindow () {
    this.editServerWindow.hide()
    this.editServerWindow.destroy()
    this.editServerWindow = undefined
  }

  showEditServerWindow (server) {
    this.editServerWindow = new this.index.electron.remote.BrowserWindow({
      parent: this.index.electron.remote.getCurrentWindow(),
      modal: true,
      show: false,
      height: 530,
      width: 400
    })

    this.editServerWindow.loadFile('src/views/edit-server/edit-server.html')

    this.editServerWindow.once('ready-to-show', () => {
      this.editServerWindow.webContents.send('edit-server-data', server)
      this.editServerWindow.show()
    })
  }

  cancelEditServer () {
    this.index.log.debug('"cancel-edit-server" triggered.')
    this.hideEditServerWindow()
  }

  showAddFileWindow (server) {
    this.addFileWindowServer = server
    this.addFileWindow = new this.index.electron.remote.BrowserWindow({
      parent: this.index.electron.remote.getCurrentWindow(),
      modal: true,
      show: false,
      height: 240,
      width: 410
    })

    this.addFileWindow.loadFile('src/views/add-file/add-file.html')

    this.addFileWindow.once('ready-to-show', () => {
      this.addFileWindow.show()
    })
  }

  cancelAddFile () {
    this.index.log.debug('"cancel-add-file" triggered.')
    this.hideAddFileWindow()
  }

  hideAddFileWindow () {
    this.addFileWindow.hide()
    this.addFileWindow.destroy()
    this.addFileWindow = undefined
    this.addFileWindowServer = undefined
  }

  async addServer (event, params) {
    this.index.log.debug((params.id ? 'Updating' : 'Adding') + ' server: ' + JSON.stringify(params))
    try {
      if (!params.id) {
        await this.index.database.insertServer(params.host, params.key, params.name, params.port, params.username)
        this.hideAddServerWindow()
      } else {
        await this.index.database.updateServer(params.id, params.host, params.key, params.name, params.port, params.username)
        this.hideEditServerWindow()
      }
    } catch (ex) {
      this.index.log.debug('Exception caught: ' + JSON.stringify(ex))
      if (ex.errno === 19) {
        this.index.log.info('Unable to ' + (params.id ? 'update' : 'add') + ' server: name already in use.')
        this.ipcRenderer.send('edit-server-error', {
          errno: 19
        })
      } else {
        this.index.log.error('Fatal error: ' + ex.message)
        this.hideEditServerWindow()
      }
    }
  }

  async addFile (event, params) {
    this.index.log.debug('Adding file (' + this.addFileWindowServer.name + '): ' + JSON.stringify(params))
    try {
      await this.index.database.insertFile(this.addFileWindowServer.id, params.path, params.sudo)
      this.hideAddFileWindow()
    } catch (ex) {
      this.index.log.debug('Exception caught: ' + JSON.stringify(ex))
      if (ex.errno === 19) {
        this.index.log.info('Unable to add file: path already in use for server ' + this.addFileWindowServer.name + '.')
        this.ipcRenderer.send('add-file-error', {
          errno: 19
        })
      } else {
        this.index.log.error('Fatal error: ' + ex.message)
        this.hideAddFileWindow()
      }
    }
  }

  async enableOrDisableFileSudo (file, enableOrDisable) {
    this.index.log.debug((enableOrDisable ? 'Enabling' : 'Disabling') + ' sudo for file: ' + JSON.stringify(file))
    try {
      await this.index.database.enableOrDisableFileSudo(file.id, enableOrDisable)
    } catch (ex) {
      this.index.log.error('Fatal error: ' + ex.message)
    }
  }

  async unwatch (server, file) {
    await this.index.watch.stop({
      server,
      file,
      onLine: this.index.log.debug.bind(this)
    })
    this.index.log.info('Stopped watching: ' + file.path + '@' + server.name)
  }

  async showToolbarMenu (event) {
    const menuTemplate = [{
      label: 'Add',
      click: () => {
        this.index.log.debug('"Add Server" menu button clicked.')
        this.showAddServerWindow()
      }
    }]

    const servers = await this.index.database.getServers()
    if (servers.length) {
      menuTemplate.push({
        type: 'separator'
      })
    }
    for (const server of servers) {
      const submenu = [{
        label: 'Edit',
        click: () => {
          this.index.log.debug('"Edit" ' + server.name + ' menu button clicked.')
          this.showEditServerWindow(server)
        }
      }, {
        label: 'Remove',
        click: async () => {
          this.index.log.debug('"Remove" ' + server.name + ' menu button clicked.')
          const remove = confirm('Remove server ' + server.name + ' and associated files from list?')
          if (remove) {
            const filesToRemove = await this.index.database.getFiles(server.id)
            for (const fileToRemove of filesToRemove) {
              this.index.tabs.close(fileToRemove.path + '@' + server.name)
              await this.unwatch(
                server,
                fileToRemove
              )
            }

            await this.index.database.removeServer(server.id)
          }
        }
      }, {
        type: 'separator'
      }, {
        label: 'Add File',
        click: () => {
          this.index.log.debug('"Add File" ' + server.name + ' menu button clicked.')
          this.showAddFileWindow(server)
        }
      }]

      const files = await this.index.database.getFiles(server.id)
      if (files.length) {
        submenu.push({
          type: 'separator'
        })
      }
      for (const file of files) {
        submenu.push({
          label: file.path,
          submenu: [{
            label: 'Remove',
            click: async () => {
              this.index.log.debug('"Remove" ' + file.path + '@' + server.name + ' menu button clicked.')
              const remove = confirm('Remove file ' + file.path + ' from server ' + server.name + ' list?')
              if (remove) {
                this.index.tabs.close(file.path + '@' + server.name)
                await this.unwatch(
                  server,
                  file
                )
                await this.index.database.removeFile(file.id)
              }
            }
          }, {
            type: 'separator'
          }, {
            label: 'Watch',
            click: () => {
              this.index.log.debug('"Watch" ' + file.path + '@' + server.name + ' menu button clicked.')
              this.index.tabs.create(file.path + '@' + server.name, {
                title: file.path + '@' + server.name,
                onReady: async () => {
                  await this.index.watch.watch({
                    server,
                    file,
                    onLine: (line) => {
                      this.index.tabs.write(file.path + '@' + server.name, line)
                    }
                  })
                },
                onClose: async () => {
                  await this.unwatch(
                    server,
                    file
                  )
                },
                active: true,
                closable: true
              })
            }
          }, {
            type: 'separator'
          }, {
            label: 'Sudo',
            type: 'radio',
            checked: file.sudo === 1,
            click: async () => {
              this.index.log.debug('"Sudo" ' + file.path + '@' + server.name + ' menu button clicked.')
              await this.enableOrDisableFileSudo(file, !(file.sudo === 1))
            }
          }]
        })
      }

      menuTemplate.push({
        label: server.name,
        submenu,
        click: () => {
          this.index.log.debug('Server "' + server.name + '" menu button clicked.')
        }
      })
    }

    this.toolbar.showDropDownButtonMenu(
      event.target,
      menuTemplate
    )
  }
}