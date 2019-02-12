class Database {
  constructor ({index, onReady}) {
    this.index = index
    this.sqlite = require('sqlite')
    this.onReady = onReady

    this.migrate()
  }

  async migrate () {
    this.index.log.debug('Updating database schema...')
    this.db = await this.sqlite.open(this.index.electron.remote.app.getAppPath() + '/database')
    await this.db.migrate({
      migrationsPath: 'src/app/sql/',
      //force: this.index.config.Defaults.Debug ? 'last' : false
    })
    this.index.log.debug('Done updating database schema.')
    this.onReady()
  }

  async insertServer (host, key, name, port, username) {
    this.index.log.debug('Inserting new server...')
    await this.db.run('INSERT INTO servers VALUES (?, ?, ?, ?, ?)', [name, key, host, port, username])
    this.index.log.debug('Done.')
  }

  async updateServer (id, host, key, name, port, username) {
    this.index.log.debug('Updating server: ' + id)
    await this.db.run('UPDATE servers SET name = ?, key = ?, host = ?, port = ?, username = ? WHERE rowid = ?', [name, key, host, port, username, id])
    this.index.log.debug('Done.')
  }

  async getServers () {
    this.index.log.debug('Fetching servers...')
    const servers = await this.db.all('SELECT rowid AS id, * FROM servers ORDER BY name ASC')
    this.index.log.debug('Done.')
    return servers
  }

  async getFiles (serverId) {
    this.index.log.debug('Fetching files for server: ' + serverId + '...')
    const files = await this.db.all('SELECT rowid AS id, * FROM files WHERE server_id = ? ORDER BY path ASC', [serverId])
    this.index.log.debug('Done.')
    return files
  }

  async insertFile (serverId, path, sudo) {
    this.index.log.debug('Inserting new file...')
    await this.db.run('INSERT INTO files VALUES (?, ?, ?)', [serverId, path, sudo])
    this.index.log.debug('Done.')
  }

  async enableOrDisableFileSudo (id, enableOrDisable) {
    this.index.log.debug('Updating file: ' + id)
    await this.db.run('UPDATE files SET sudo = ? WHERE rowid = ?', [enableOrDisable, id])
    this.index.log.debug('Done.')
  }

  async removeServer (id) {
    this.index.log.debug('Removing server: ' + id)
    await this.db.run('DELETE FROM files WHERE server_id = ?', [id])
    await this.db.run('DELETE FROM servers WHERE rowid = ?', [id])
    this.index.log.debug('Done.')
  }

  async removeFile(id) {
    this.index.log.debug('Removing file: ' + id)
    await this.db.run('DELETE FROM files WHERE rowid = ?', [id])
    this.index.log.debug('Done.')
  }
}