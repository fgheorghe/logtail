class TabIframe {
  constructor ({visible, onReady, parent, index, tabs, id}) {
    this.index = index
    this.id = id
    this.tabs = tabs
    this.visible = visible
    this.onReady = onReady
    this.parent = parent
    this.moment = require('moment')
    this.elements = []
    this.styleElement = undefined
    this.element = undefined
    this.text = []

    this.search = {
      mode: 'highlight',
      string: 'simple',
      notify: false,
      value: ''
    }

    this.render()
  }

  show () {
    this.visible = true
    this.element.classList.remove('tab-iframe-hidden')
  }

  hide () {
    this.visible = false
    this.element.classList.add('tab-iframe-hidden')
  }

  scrollToBottom () {
    this.element.contentWindow.document.documentElement.scrollTop = this.element.contentWindow.document.body.scrollHeight
  }

  write (text) {
    const element = document.createElement('div')
    // TODO: Configure format.
    element.innerText = this.moment().format(Defaults.DateFormat) + ' ' + text

    this.elements.push(element)
    this.text.push(text)

    this.element.contentWindow.document.getElementById('content').appendChild(element)
    this.scrollToBottom()
    this.highlight(true)
  }

  simpleMatch (subject, pattern) {
    return new RegExp(pattern.split('*').join('.*'), 'gi').test(subject)
  }

  regexMatch (subject, pattern) {
    return new RegExp(pattern, 'gi').test(subject)
  }

  textMatches (text, notifyCheck) {
    let match = false
    if (this.search.mode === 'highlight' && ((this.search.string === 'simple') || (this.search.string === 'regex'))) {
      const short = this.search.value.trim()
      if (short && short !== '*') {
        if (this.search.string === 'simple') {
          match = this.simpleMatch(text, this.search.value)
        } else {
          match = this.regexMatch(text, this.search.value)
        }
      }
    }

    if (match && notifyCheck && (!this.index.windowActive || this.tabs.getActiveTab().id !== this.id)) {
      let searchNotification = new Notification(this.tabs.tabs[this.id].title, {
        body: text
      })
      searchNotification.onclick = () => {
        this.tabs.activate(this.id)
        this.index.electron.ipcRenderer.send('restore')
      }
    }

    return match
  }

  highlight (notifyCheck = false) {
    for (let i = 0; i < this.text.length; i++) {
      if (this.search.mode === 'highlight') {
        if (this.textMatches(this.text[i], notifyCheck)) {
          this.elements[i].classList.add('highlighted')
        } else {
          this.elements[i].classList.remove('highlighted')
        }
      }
    }
  }

  createOrUpdateStyle ({textColor, backgroundColor, fontFamily, fontSize}) {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style')
      this.styleElement.type = 'text/css'
    }

    this.styleElement.innerHTML = 'body {' +
      `    color: ${textColor};` +
      `    background-color: ${backgroundColor};` +
      `    font-family: '${fontFamily}';` +
      `    font-size: ${fontSize}px;` +
      '}'
  }

  render () {
    const iFrame = document.createElement('iframe')
    iFrame.src = '../../views/tabs/iframe.html'
    iFrame.frameBorder = '0'
    iFrame.addEventListener('load', () => {
      this.createOrUpdateStyle({
        textColor: 'white',
        backgroundColor: 'transparent',
        fontFamily: 'Monaco',
        fontSize: 12
      })

      this.element.contentWindow.document.body.appendChild(this.styleElement)
      this.onReady()
    })
    iFrame.classList.add('tab-iframe')
    if (!this.visible) {
      iFrame.classList.add('tab-iframe-hidden')
    }
    this.element = iFrame
    this.parent.appendChild(this.element)
  }
}