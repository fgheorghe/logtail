class Toolbar {
  constructor ({index}) {
    this.index = index
    this.servers = new Servers({index: index, toolbar: this})
  }

  buttonConsoleClickEventListener () {
    this.index.tabs.activate('console')
  }

  buttonServersClickEventListener (event) {
    this.servers.showToolbarMenu(event)
  }

  buttonConfigurationClickEventListener () {
    // TODO: Implement.
  }

  buttonHelpClickEventListener () {
    // TODO: Implement.
  }

  showDropDownButtonMenu (button, menuTemplate) {
    const {Menu} = this.index.electron.remote
    const menu = Menu.buildFromTemplate(menuTemplate)

    const rect = button.getBoundingClientRect()
    menu.popup({
      x: parseInt(rect.x, 10),
      y: parseInt(rect.y + rect.height + 4, 10)
    })
  }
}