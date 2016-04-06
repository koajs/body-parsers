'use strict'

/**
 * To do: move most of the body parsing stuff to a separate library.
 */

var get = require('raw-body')
var qs = require('querystring')

var request = {}
var response = {}

module.exports = function bodypParsers (app) {
  Object.keys(request).forEach(function (key) {
    app.request[key] = request[key]
  })
  Object.keys(response).forEach(function (key) {
    app.response[key] = response[key]
  })
  return app
}

request.json = function (limit) {
  if (!this.length) return Promise.resolve()
  var self = this
  return this.text(limit).then(function (text) {
    return self._parse_json(text)
  })
}

request._parse_json = function (text) {
  if (this.app.jsonStrict !== false) {
    text = text.trim()
    var first = text[0]
    if (first !== '{' && first !== '[') {
      this.ctx.throw(400, 'only json objects or arrays allowed')
    }
  }
  try {
    return JSON.parse(text)
  } catch (err) {
    this.ctx.throw(400, 'invalid json received')
  }
}

request.urlencoded = function (limit) {
  if (!this.length) return Promise.resolve()
  var self = this
  return this.text(limit).then(function (text) {
    return self._parse_urlencoded(text)
  })
}

request._parse_urlencoded = function (text) {
  var parse = (this.app.querystring || qs).parse
  try {
    return parse(text)
  } catch (err) {
    this.ctx.throw(400, 'invalid urlencoded received')
  }
}

request.text = function (limit) {
  this.response.writeContinue()
  return get(this.req, {
    limit: limit || '100kb',
    length: this.length,
    encoding: 'utf8'
  })
}

request.buffer = function (limit) {
  this.response.writeContinue()
  return get(this.req, {
    limit: limit || '1mb',
    length: this.length
  })
}

response.writeContinue = function () {
  if (!this._checkedContinue && this.req.checkContinue) {
    this.res.writeContinue()
    this._checkedContinue = true
  }
  return this
}
