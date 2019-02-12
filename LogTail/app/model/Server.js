const SSH2Promise = require('ssh2-promise')
const fs = require('fs')

class Server {
  constructor ({uuid, name, host, username, port, privateKey, files, log}) {
    let values = {
      'uuid': uuid || '',
      'name': name || '',
      'host': host || '',
      'username': username || '',
      'port': port || 22,
      'privateKey': privateKey || '',
      'files': files || [],
      'log': log
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

  async connect () {
    this.log.info('Connecting to: ' + this.name)
    const connection = new SSH2Promise({
      host: this.host,
      port: this.port,
      username: this.username,
      privateKey: fs.readFileSync(this.privateKey)
    })
    await connection.connect()
    this.log.info('Connection made to: ' + this.name)
    return connection
  }
}

module.exports = Server
