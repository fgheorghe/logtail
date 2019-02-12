const App = require('../../app/app.js')
const moment = require('moment')
const electron = require('electron')
const {ipcRenderer, remote} = electron
const {Menu} = remote
const Conf = require('../../app/lib/Conf')

class Gui {
  constructor () {
    this.app = undefined
    this.conf = new Conf()

    this.windowActive = false

    this.activeTabId = undefined

    this.tabs = {}

    this.tab = {
      pane: document.getElementById('tab-pane'),
      group: document.getElementById('tab-group'),
      ready: false
    }

    this.buttons = {
      console: document.getElementById('console-button'),
      servers: document.getElementById('servers-button'),
      logGroups: document.getElementById('log-groups-button'),
      configuration: document.getElementById('configuration-button')
    }

    this.search = {
      optionsButton: document.getElementById('search-options-button'),
      button: document.getElementById('search-button'),
      input: document.getElementById('search-input'),
      mode: 'highlight',
      string: 'simple',
      notify: false,
      value: ''
    }

    ipcRenderer.on('blur', () => {
      this.windowActive = false
    })
    ipcRenderer.on('focus', () => {
      this.windowActive = true
    })
    ipcRenderer.on('reload-configuration', () => {
      this.writeTab('console', 'Reloading configuration...')
      this.app.reloadConfiguration()
      this.writeTab('console', 'Done.')
    })
    ipcRenderer.on('close-tab', (event, params) => {
      this.closeTab(params.tabId)
    })

    Object.seal(this)
  }

  init () {
    this.createTab({
      id: 'console',
      title: 'Console',
      closable: false,
      onReady: () => {
        this.writeTab('console', 'Loading configuration...')
        this.app = new App({
          log: {
            info: (message) => {
              this.writeTab('console', message)
            },
            debug: (message) => {
              if (this.conf.get().settings.debug) {
                this.writeTab('console', message)
              }
            },
            error: (message) => {
              this.writeTab('console', message)
            }
          }
        })
        this.buttons.servers.addEventListener('click', this.showServersMenu.bind(this))
        this.buttons.logGroups.addEventListener('click', this.showGroupsMenu.bind(this))
        this.buttons.configuration.addEventListener('click', this.showConfigurationWindow.bind(this))
        this.search.optionsButton.addEventListener('click', this.showSearchOptionsMenu.bind(this))
        this.search.button.addEventListener('click', this.find.bind(this))
        this.search.input.addEventListener('keyup', this.searchChange.bind(this))
        this.buttons.console.addEventListener('click', () => {
          this.showTab('console')
        })
      }
    })

    this.showTab('console')
  }

  showConfigurationWindow () {
    ipcRenderer.send('show-configuration-window')
  }

  createTab ({id, title, closable, file, group, onReady}) {
    if (!this.tabs[id]) {
      const iframe = document.createElement('iframe')
      iframe.src = 'content-iframe.html'
      iframe.frameBorder = 0
      iframe.classList.add('content-iframe')
      iframe.classList.add('content-iframe-hidden')
      iframe.addEventListener('load', () => {
        this.tabs[id].iframe.contentWindow.document.addEventListener('contextmenu', this.showCopyPasteMenu(id))
        onReady()
      })
      this.tab.pane.appendChild(iframe)

      const tab = document.createElement('div')
      tab.classList.add('tab-item')
      tab.classList.add('tab-width')
      tab.classList.add('tab-text')
      tab.addEventListener('click', () => {
        this.showTab(id)
      })

      const tabButton = document.createElement('span')
      tabButton.classList.add('icon')
      if (closable) {
        tabButton.classList.add('icon-cancel')
        tabButton.classList.add('icon-close-tab')
        tabButton.addEventListener('click', () => {
          if (file) {
            file.stop()
          }
          if (group) {
            group.stop()
          }
          this.closeTab(id)
        })
      }
      const tabTitle = document.createTextNode(title)

      tab.appendChild(tabButton)
      tab.appendChild(tabTitle)

      this.tab.group.appendChild(tab)

      this.tabs[id] = {
        tab,
        iframe,
        elements: [],
        text: [],
        title,
        search: {
          mode: 'highlight', // or filter
          value: '',
          string: 'simple', // or regex
          notify: false
        }
      }
    }
  }

  showTab (id) {
    if (this.tabs[id]) {
      for (const tab in this.tabs) {
        if (this.tabs.hasOwnProperty(tab)) {
          if (tab !== id) {
            this.hideTab(tab)
          }
        }
      }

      this.tabs[id].tab.classList.add('active')
      this.tabs[id].iframe.classList.remove('content-iframe-hidden')

      this.search.input.value = this.tabs[id].search.value
      this.search.value = this.tabs[id].search.value
      this.search.mode = this.tabs[id].search.mode
      this.search.string = this.tabs[id].search.string
      this.search.notify = this.tabs[id].search.notify

      this.activeTabId = id
    }
  }

  hideTab (id) {
    if (this.tabs[id]) {
      this.tabs[id].tab.classList.remove('active')
      this.tabs[id].iframe.classList.add('content-iframe-hidden')
    }
  }

  writeTab (id, text) {
    text = text.trim()

    if (!text) {
      return
    }
    if (this.tabs[id]) {
      const element = document.createElement('div')
      element.innerText = moment().format(this.conf.get().settings.dateFormat) + ' ' + text
      this.tabs[id].elements.push(element)
      this.tabs[id].text.push(text)

      if (this.tabs[id].elements.length > this.conf.get().settings.maxLines) {
        this.tabs[id].elements[0].remove()
        this.tabs[id].elements.shift()
        this.tabs[id].text.shift()
      }

      if (this.tabs[id].search.mode === 'highlight') {
        if (this.textMatches(text, id)) {
          element.classList.add('highlighted')
          if (this.windowActive === false && this.tabs[id].search.notify) {
            let searchNotification = new Notification(this.tabs[id].title, {
              body: text
            })
            searchNotification.onclick = () => {
              this.showTab(id)
              ipcRenderer.send('restore')
            }
          }
        } else {
          element.classList.remove('highlighted')
        }
      }

      this.tabs[id].iframe.contentWindow.document.getElementById('content').appendChild(element)

      this.tabs[id].iframe.contentWindow.document.documentElement.scrollTop = this.tabs[id].iframe.contentWindow.document.body.scrollHeight
    }
  }

  closeTab (id) {
    if (this.tabs[id]) {
      const openTabs = Object.keys(this.tabs)
      const tabToShow = openTabs.indexOf(id) - 1
      this.tabs[id].iframe.remove()
      this.tabs[id].tab.remove()
      delete this.tabs[id]
      this.showTab(openTabs[tabToShow])
    }
  }

  showServersMenu (event) {
    let template = [{
      label: 'Add Server',
      click: () => {
        ipcRenderer.send('show-add-server-window')
      }
    }]

    for (let i = 0; i < this.app.servers.length; i++) {
      const server = this.app.servers[i]

      if (i === 0) {
        template.push({
          type: 'separator'
        })
      }
      let submenu = [{
        label: 'Edit Server',
        click: () => {
          ipcRenderer.send('show-edit-server-window', {server})
        }
      }, {
        label: 'Remove Server',
        click: () => {
          const remove = confirm('Remove server from list?\n\n' + 'Server: ' + server.name)
          if (remove) {
            ipcRenderer.send('remove-server', {server})
          }
        }
      }, {
        label: 'Add File',
        click: () => {
          ipcRenderer.send('show-add-file-window', {server})
        }
      }]

      for (let j = 0; j < server.files.length; j++) {
        const file = server.files[j]
        if (j === 0) {
          submenu.push({
            type: 'separator'
          })
        }
        submenu.push({
          label: file.path,
          submenu: [{
            label: 'Remove File',
            click: () => {
              const remove = confirm('Remove file from list?\n\nPath: ' + file.path + '\n' + 'Server: ' + server.name)
              if (remove) {
                ipcRenderer.send('remove-file', {server, file})
              }
            }
          }, {
            type: 'separator'
          }, {
            label: 'Watch File',
            click: async () => {
              if (!this.tabs[file.uuid]) {
                this.createTab({
                  id: file.uuid,
                  title: file.path + '@' + file.server.name,
                  closable: true,
                  file,
                  onReady: async () => {
                    this.showTab(file.uuid)
                    file.watch((data) => {
                      this.writeTab(file.uuid, data.toString())
                    }, (err, file) => {
                      this.writeTab('console', 'Unable to watch file: ' + file.path + '@' + file.server.name + ', error: ' + err)
                      file.stop()
                      this.writeTab('console', 'Connection closed: ' + file.server.name)
                    })
                  }
                })
              } else {
                this.showTab(file.uuid)
              }
            }
          }]
        })
      }

      template.push({
        label: this.app.servers[i].name,
        submenu
      })
    }

    this.showMenu(
      event.target,
      template
    )
  }

  showGroupsMenu (event) {
    let template = [{
      label: 'Add Group',
      click: () => {
        ipcRenderer.send('show-add-group-window')
      }
    }]

    for (let i = 0; i < this.app.groups.length; i++) {
      const group = this.app.groups[i]
      if (i === 0) {
        template.push({
          type: 'separator'
        })
      }
      let submenu = [{
        label: 'Edit Group',
        click: () => {
          ipcRenderer.send('show-edit-group-window', {group})
        }
      }, {
        label: 'Remove Group',
        click: () => {
          const remove = confirm('Remove group from list?\n\nGroup: ' + group.name)
          if (remove) {
            ipcRenderer.send('remove-group', {group})
          }
        }
      }, {
        type: 'separator'
      }, {
        label: 'Watch Group',
        click: async () => {
          if (!this.tabs[group.uuid]) {
            this.createTab({
              id: group.uuid,
              title: group.name,
              closable: true,
              group,
              onReady: async () => {
                this.showTab(group.uuid)
                group.watch((data) => {
                  this.writeTab(group.uuid, data.toString())
                }, (err, file) => {
                  this.writeTab('console', 'Unable to watch group \'' + group.name + '\' file: ' + file.path + '@' + file.server.name + ', error: ' + err)
                  file.stop()
                  this.writeTab('console', 'Connection closed: ' + file.server.name)
                })
              }
            })
          } else {
            this.showTab(group.uuid)
          }
        }
      }]

      template.push({
        label: group.name,
        submenu
      })
    }

    this.showMenu(
      event.target,
      template
    )
  }

  showMenu (element, template) {
    const menu = Menu.buildFromTemplate(template)
    const rect = element.getBoundingClientRect()
    menu.popup({
      x: parseInt(rect.x, 10),
      y: parseInt(rect.y + rect.height + 4, 10)
    })
  }

  showCopyPasteMenu (tabId) {
    return (event) => {
      event.preventDefault()
      event.stopPropagation()
      const menu = Menu.buildFromTemplate([
        {label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:'},
        {label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:'},
        {type: 'separator'},
        {
          label: 'Clear',
          click: () => {
            for (let element of this.tabs[tabId].elements) {
              element.remove()
            }
          }
        }
      ])
      menu.popup(remote.getCurrentWindow())
    }
  }

  showSearchOptionsMenu () {
    const template = [
      {
        label: 'Simple', type: 'checkbox', checked: this.search.string === 'simple', click: () => {
          this.tabs[this.activeTabId].search.string = 'simple'
          this.search.string = this.tabs[this.activeTabId].search.string
          this.find()
        }
      },
      {
        label: 'Regex', type: 'checkbox', checked: this.search.string === 'regex', click: () => {
          this.tabs[this.activeTabId].search.string = 'regex'
          this.search.string = this.tabs[this.activeTabId].search.string
          this.find()
        }
      },
      {type: 'separator'},
      {
        label: 'Notify', type: 'checkbox', checked: this.search.notify, click: () => {
          this.tabs[this.activeTabId].search.notify = !this.search.notify
          this.search.notify = this.tabs[this.activeTabId].search.notify
        }
      }
    ]

    this.showMenu(
      this.search.optionsButton,
      template
    )
  }

  searchChange (event) {
    this.tabs[this.activeTabId].search.value = event.target.value
    this.search.value = this.tabs[this.activeTabId].search.value
    this.find()
  }

  simpleMatch (subject, pattern) {
    return new RegExp(pattern.split('*').join('.*'), 'gi').test(subject)
  }

  regexMatch (subject, pattern) {
    return new RegExp(pattern, 'gi').test(subject)
  }

  textMatches (text, tabId) {
    let match = false
    if (this.tabs[tabId].search.mode === 'highlight' && (this.tabs[tabId].search.string === 'simple' || this.tabs[tabId].search.string === 'regex')) {
      const short = this.tabs[tabId].search.value.trim()
      if (short && short !== '*') {
        if (this.tabs[tabId].search.string === 'simple') {
          match = this.simpleMatch(text, this.tabs[tabId].search.value)
        } else {
          match = this.regexMatch(text, this.tabs[tabId].search.value)
        }
      }
    }

    return match
  }

  find () {
    for (let i = 0; i < this.tabs[this.activeTabId].text.length; i++) {
      if (this.search.mode === 'highlight') {
        if (this.textMatches(this.tabs[this.activeTabId].text[i], this.activeTabId)) {
          this.tabs[this.activeTabId].elements[i].classList.add('highlighted')
        } else {
          this.tabs[this.activeTabId].elements[i].classList.remove('highlighted')
        }
      }
    }
  }
}
