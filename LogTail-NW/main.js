const {app, BrowserWindow, ipcMain} = require('electron')
const Defaults = require('./src/defaults')

let mainWindow

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    }
  })

  if (Defaults.Debug) {
    mainWindow.toggleDevTools()
  }

  ipcMain.on('restore', () => {
    mainWindow.restore()
  })

  mainWindow.loadURL('file://' + __dirname + '/src/views/index/index.html')
})