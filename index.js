'use strict'

/**
 * To do: move most of the body parsing stuff to a separate library.
 */

const get = require('raw-body')
const qs = require('querystring')

module.exports = (app) => {
  Object.keys(request).forEach((key) => {
    app.request[key] = request[key]
  })
  Object.keys(response).forEach((key) => {
    app.response[key] = response[key]
  })
  return app
}

const request = {}
const response = {}

request.json = function (limit) {
  if (!this.length) return Promise.resolve()
  return this.text(limit).then((text) => this._parse_json(text))
}

request._parse_json = function (text) {
  if (this.app.jsonStrict !== false) {
    text = text.trim()
    const first = text[0]
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
  return this.text(limit).then((text) => this._parse_urlencoded(text))
}

request._parse_urlencoded = function (text) {
  const parse = (this.app.querystring || qs).parse
  try {
    return parse(text)
  } catch (err) {
    this.ctx.throw(400, 'invalid urlencoded received')
  }
}

request.body = function (limit) {
  switch (this.is('urlencoded', 'json')) {
    case 'json': return this.json(limit)
    case 'urlencoded': return this.urlencoded(limit)
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
