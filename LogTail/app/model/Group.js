class Group {
  constructor ({uuid, name, files}) {
    let values = {
      'uuid': uuid || '',
      'name': name || '',
      'files': files || []
    }

    for (let key in values) {
      Object.defineProperty(this, key, {
        enumerable: true,
        get: function () { return values[key] },
        set: function (value) {
          values[key] = value
          return this
        }
      })
    }

    Object.seal(this)
  }

  async watch (onData, onError) {
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i]
      file.watch(onData, onError)
    }
  }

  stop () {
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i]
      file.stop()
    }
  }
}

module.exports = Group
