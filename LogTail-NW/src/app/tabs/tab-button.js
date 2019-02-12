class TabButton {
  constructor ({text, active, parent, onActivateButtonClick, onCloseButtonClick, closable}) {
    this.text = text
    this.parent = parent
    this.onActivateButtonClick = onActivateButtonClick
    this.onCloseButtonClick = onCloseButtonClick
    this.closable = closable
    this.active = active
    this.render()
  }

  activate () {
    this.active = true
    this.element.classList.add('active')
  }

  deactivate () {
    this.active = false
    this.element.classList.remove('active')
  }

  render () {
    const tabDiv = document.createElement('div')
    tabDiv.classList.add('tab-item')
    tabDiv.classList.add('tab-width')
    tabDiv.classList.add('tab-text')
    if (this.active) {
      tabDiv.classList.add('active')
    }
    tabDiv.addEventListener('click', this.onActivateButtonClick)

    const tabSpan = document.createElement('span')
    tabSpan.classList.add('icon')
    if (this.closable) {
      tabSpan.classList.add('icon-cancel')
      tabSpan.classList.add('icon-close-tab')
      tabSpan.addEventListener('click', (event) => {
        event.stopPropagation()
        this.onCloseButtonClick(event)
      })
    }
    const tabText = document.createTextNode(this.text)

    tabDiv.appendChild(tabSpan)
    tabDiv.appendChild(tabText)

    this.element = tabDiv

    this.parent.appendChild(this.element)
  }
}