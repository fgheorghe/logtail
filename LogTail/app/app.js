// Libraries.
const Log = require('./lib/Log')
const Conf = require('./lib/Conf')

// Data models.
const File = require('./model/File')
const Server = require('./model/Server')
const Group = require('./model/Group')

class App {
  constructor ({log}) {
    this.log = log || new Log()
    this.conf = new Conf()
    this.servers = []
    this.groups = []

    this.loadServersAndFiles()
    this.loadGroups()
  }

  reloadConfiguration () {
    this.servers = []
    this.groups = []

    this.loadServersAndFiles()
    this.loadGroups()
  }

  loadServersAndFiles () {
    this.log.info('Loading servers...')
    try {
      const servers = this.conf.get().servers
      for (let i = 0; i < servers.length; i++) {
        const server = new Server(servers[i])
        server.log = this.log
        this.log.debug('Server: ' + server.name)
        let files = []
        this.log.info('Loading files...')
        for (let j = 0; j < servers[i].files.length; j++) {
          const file = new File({
            ...servers[i].files[j],
            server,
            log: this.log
          })
          this.log.debug('File: ' + file.path)
          files.push(file)
        }
        this.log.info('Done loading ' + files.length + ' file' + (files.length === 1 ? '' : 's') + '.')
        server.files = files
        this.servers.push(server)
      }
      this.log.info('Done loading ' + servers.length + ' server' + (servers.length === 1 ? '' : 's') + '.')
    } catch (ex) {
      this.log.error('Unable to load servers: ' + ex.message)
    }
  }

  loadGroups () {
    this.log.info('Loading groups...')
    try {
      const groups = this.conf.get().groups
      for (let i = 0; i < groups.length; i++) {
        const group = new Group(groups[i])
        this.log.debug('Group: ' + group.name)
        let files = []
        this.log.info('Loading files...')
        for (let j = 0; j < groups[i].files.length; j++) {
          const file = this.getFileByUuid(groups[i].files[j])
          this.log.debug('File: ' + file.path + '@' + file.server.name)
          files.push(file)
        }
        group.files = files

        this.groups.push(group)
      }
      this.log.info('Done loading ' + groups.length + ' group' + (groups.length === 1 ? '' : 's') + '.')
    } catch (ex) {
      this.log.error('Unable to load groups: ' + ex.message)
    }
  }

  getFileByUuid (uuid) {
    for (let i = 0; i < this.servers.length; i++) {
      for (let j = 0; j < this.servers[i].files.length; j++) {
        if (this.servers[i].files[j].uuid === uuid) {
          return this.servers[i].files[j]
        }
      }
    }
    return false
  }
}

module.exports = App
