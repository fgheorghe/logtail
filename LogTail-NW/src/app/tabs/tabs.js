class Tabs {
  constructor ({index}) {
    this.index = index
    this.tabs = {}
    this.activeTabId = undefined
  }

  create (id, {title, active, closable, onReady, onClose}) {
    if (!this.tabs[id]) {
      console.log('Creating tab: ' + id)
      this.tabs[id] = {
        id,
        title,
        iframe: new TabIframe({
          visible: active,
          onReady,
          parent: document.getElementById('tab-panel'),
          index: this.index,
          tabs: this,
          id
        }),
        button: new TabButton({
          text: title,
          closable,
          active,
          parent: document.getElementById('tab-bar'),
          onCloseButtonClick: () => {
            this.close(id)
            onClose()
          },
          onActivateButtonClick: () => {
            this.activate(id)
          }
        }),
        setSearchOptions: (options) => {
          this.tabs[id].iframe.search = Object.assign(this.tabs[id].iframe.search, options)
        },
        getSearchOption: (option) => {
          return this.tabs[id].iframe.search[option]
        },
        highlight: () => {
          this.tabs[id].iframe.highlight()
        },
        scrollToBottom: () => {
          this.tabs[id].iframe.scrollToBottom()
        }
      }
      if (active) {
        this.activate(id)
      }
    } else {
      console.log('Table already created, activating it.')
      this.activate(id)
    }
  }

  activate (id) {
    console.log('Activating tab: ' + id)
    if (this.activeTabId !== id) {
      if (this.activeTabId) {
        this.getActiveTab().iframe.hide()
        this.getActiveTab().button.deactivate()
        console.log('Deactivated already active tab: ' + this.activeTabId)
      } else {
        console.log('No tab to deactivate.')
      }

      this.tabs[id].iframe.show()
      this.tabs[id].button.activate()
      this.activeTabId = id
      this.index.search.input.value = this.getActiveTab().getSearchOption('value')
      this.getActiveTab().scrollToBottom()
      console.log('Tab activated: ' + id)
    } else {
      console.log('Tab already active.')
    }
  }

  close (id) {
    console.log('Closing tab: ' + id)
    if (this.tabs[id]) {
      const tabIds = Object.keys(this.tabs)
      this.tabs[id].iframe.parent.removeChild(this.tabs[id].iframe.element)
      this.tabs[id].button.parent.removeChild(this.tabs[id].button.element)
      delete this.tabs[id]
      if (id === this.activeTabId) {
        this.activeTabId = undefined
        const pos = tabIds.indexOf(id)
        if (pos) {
          this.activate(tabIds[pos - 1])
        }
      }
    }
    console.log('Done')
  }

  write (id, text) {
    text = text.trim()

    if (!text) {
      return
    }

    if (this.tabs[id]) {
      this.tabs[id].iframe.write(text)
    }
  }

  getActiveTab () {
    return this.tabs[this.activeTabId]
  }
}