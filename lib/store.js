const level = require('level-party')
const root = require('app-root-path')
const levelTtl = require('level-ttl')
const db = levelTtl(level(root.path + '/db', { valueEncoding: 'json' }))
// Unfortunately, level-ttl doesn't return promises
const { promisify } = require('util')
const get = promisify(db.get.bind(db))
const put = promisify(db.put.bind(db))

module.exports = {
  get: key =>  get(key),
  set: (key, value, options) => put(key, value, options)
}
