class Index {
  constructor () {
    this.config = {
      Defaults
    }
    this.electron = require('electron')
    this.windowActive = true

    this.log = {
      info: console.log
    }
    this.log.info('UI Loaded.')

    this.log.info('Loading tab system.')
    this.tabs = new Tabs({index: this})
    this.log.info('Done loading tab system..')

    this.log.info('Loading toolbar.')
    this.toolbar = new Toolbar({index: this})
    this.log.info(this.toolbar)
    this.log.info('Done loading toolbar.')

    this.log.info('Binding event listeners.')
    this.bindEventListeners()
    this.log.info('Done binding event listeners.')

    this.log.info('Starting watch mechanism.')
    this.watch = new Watch({index: this})
    this.log.info('Done.')

    this.log.info('Starting highlight functionality.')
    this.initHighlight()
    this.log.info('Done.')

    this.log.info('Loading console tab.')
    this.initConsole()
    this.log.info('Done loading console tab.')
  }

  bindEventListeners () {
    try {
      document.getElementById('button-console').addEventListener('click', (event) => { this.toolbar.buttonConsoleClickEventListener(event) })
      document.getElementById('button-servers').addEventListener('click', (event) => { this.toolbar.buttonServersClickEventListener(event) })
      document.getElementById('button-configuration').addEventListener('click', (event) => { this.toolbar.buttonConfigurationClickEventListener(event)})
      document.getElementById('button-help').addEventListener('click', (event) => { this.toolbar.buttonHelpClickEventListener(event)})
      window.addEventListener('focus', () => {this.windowActive = true})
      window.addEventListener('blur', () => {this.windowActive = false})
    } catch (ex) {
      this.log.info('Unable to bind event listener: ')
      this.log.info(ex)
    }
  }

  initHighlight () {
    this.search = {
      optionsButton: document.getElementById('search-options-button'),
      button: document.getElementById('search-button'),
      input: document.getElementById('search-input')
    }

    this.search.optionsButton.addEventListener('click', this.showSearchOptionsMenu.bind(this))
    this.search.input.addEventListener('keyup', this.searchChange.bind(this))
  }

  searchChange (event) {
    this.tabs.getActiveTab().setSearchOptions({value: event.target.value})
    this.tabs.getActiveTab().highlight()
  }

  showSearchOptionsMenu () {
    const template = [
      {
        label: 'Simple',
        type: 'checkbox',
        checked: this.tabs.getActiveTab().getSearchOption('string') === 'simple',
        click: () => {
          this.tabs.getActiveTab().setSearchOptions({string: 'simple'})
          this.tabs.getActiveTab().highlight()
        }
      },
      {
        label: 'Regex',
        type: 'checkbox',
        checked: this.tabs.getActiveTab().getSearchOption('string') === 'regex',
        click: () => {
          this.tabs.getActiveTab().setSearchOptions({string: 'regex'})
          this.tabs.getActiveTab().highlight()
        }
      },
      {type: 'separator'},
      {
        label: 'Notify', type: 'checkbox', checked: this.tabs.getActiveTab().getSearchOption('notify'), click: () => {
          this.tabs.getActiveTab().setSearchOptions({notify: !this.tabs.getActiveTab().getSearchOption('notify')})
        }
      }
    ]

    const {Menu} = this.electron.remote
    const menu = Menu.buildFromTemplate(template)

    const rect = this.search.optionsButton.getBoundingClientRect()
    menu.popup({
      x: parseInt(rect.x, 10),
      y: parseInt(rect.y + rect.height + 4, 10)
    })
  }

  initConsole () {
    this.tabs.create('console', {
      title: 'Console',
      onReady: this.tabConsoleReadyEventListener.bind(this),
      active: true,
      closable: false
    })
  }

  tabConsoleReadyEventListener () {
    this.log.info('Console tab ready.')
    this.log = new Log({index: this})
    this.log.info('User interface ready.')

    this.log.info('Loading database.')
    this.initDatabase()
  }

  initDatabase () {
    this.database = new Database({
      index: this,
      onReady: () => {
        this.log.info('Done loading database.')
        this.log.info('App ready.')
      }
    })
  }
}

window.addEventListener('load', function () {
  new Index()
})