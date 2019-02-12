class File {
  constructor ({uuid, server, path, sudo, log}) {
    let values = {
      'uuid': uuid || '',
      'server': server || undefined,
      'path': path || '',
      'sudo': sudo || false,
      'log': log,
      'connection': undefined,
      'socket': undefined
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
    try {
      this.connection = await this.server.connect()
      const command = (this.sudo ? 'sudo ' : '') + 'tail -n 1 -f ' + this.path
      this.socket = await this.connection.spawn(command, {}, {
        pty: true
      })
      this.log.info('Watching: ' + this.path + '@' + this.server.name)
      this.socket.on('data', onData)
      this.socket.on('error', onError)
    } catch (exp) {
      onError(exp.message, this)
    }
  }

  stop () {
    if (this.socket) {
      this.log.info('Stopped watching: ' + this.path + '@' + this.server.name)
      this.socket.write('\x03')
      this.connection.close()
    }
  }
}

module.exports = File
