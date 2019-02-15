const SSH2Promise = require('ssh2-promise')
const fs = require('fs')

class Watch {
  constructor ({index}) {
    this.index = index
    this.connections = {}
    this.sockets = {}
  }

  async acquireConnection (server, file, onLine) {
    onLine('Connecting to: ' + server.username + '@' + server.host + ', port: ' + server.port + '...')

    const connection = new SSH2Promise({
      host: server.host,
      port: server.port,
      username: server.username,
      privateKey: fs.readFileSync(server.key).toString(),
      reconnect: false,
      keepaliveInterval: 300,
      debug: (message) => {
        console.log(message)
      }
    })
    await connection.connect()
    this.connections[server.host + server.port + server.username + file.path] = connection
    onLine('Done.')

    return this.connections[server.host + server.port + server.username + file.path]
  }

  async createSocket (connection, server, file) {
    const command = (file.sudo === 1 ? 'sudo ' : '') + 'tail -n 1 -f ' + file.path
    this.sockets[server.host + server.port + server.username + file.path] = await connection.spawn(command, {}, {
      pty: true
    })
    return this.sockets[server.host + server.port + server.username + file.path]
  }

  async watch ({server, file, onLine}) {
    let connection
    try {
      connection = await this.acquireConnection(
        server,
        file,
        onLine
      )
    } catch (ex) {
      onLine('Can not connect to: ' + server.username + '@' + server.host + ', port: ' + server.port + ':')
      onLine(ex.message)
      return false
    }

    let socket
    try {
      socket = await this.createSocket(
        connection,
        server,
        file
      )
    } catch (ex) {
      onLine('Can not create socket on: ' + server.username + '@' + server.host + ', port: ' + server.port + ':')
      onLine(ex.message)
      return false
    }

    onLine('Watching ' + file.path)
    socket.on('data', (data) => {
      onLine(data.toString())
    })
    socket.on('error', (err) => {
      onLine('Error: ' + JSON.stringify(err))
    })
    socket.on('close', () => {
      onLine('Connection to: ' + server.username + '@' + server.host + ', port: ' + server.port + ' closed.')
    })
  }

  async stop ({server, file, onLine}) {
    if (this.sockets[server.host + server.port + server.username + file.path] && this.connections[server.host + server.port + server.username + file.path]) {
      await this.sockets[server.host + server.port + server.username + file.path].write('\x03')
      delete this.sockets[server.host + server.port + server.username + file.path]
      await this.connections[server.host + server.port + server.username + file.path].close()
      delete this.connections[server.host + server.port + server.username + file.path]
      onLine('Connection to: ' + server.username + '@' + server.host + ', port: ' + server.port + ' closed.')
    }
  }
}