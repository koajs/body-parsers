'use strict'

/* eslint-env mocha */

const request = require('supertest')
const assert = require('assert')
const http = require('http')
const koa = require('koa')

describe('Body Parsing', () => {
  describe('.request.json()', () => {
    it('should parse a json body', (done) => {
      const app = koala()
      app.use(function * () {
        this.body = yield this.request.json()
      })
      request(app.listen())
        .post('/')
        .send({
          message: 'lol'
        })
        .expect(200)
        .expect(/"message"/)
        .expect(/"lol"/, done)
    })

    it('should throw on non-objects in strict mode', (done) => {
      const app = koala()
      app.use(function * () {
        this.body = yield this.request.json()
      })
      request(app.listen())
        .post('/')
        .type('json')
        .send('"lol"')
        .expect(400, done)
    })

    it('should not throw on non-objects in non-strict mode', (done) => {
      const app = koala()
      app.jsonStrict = false
      app.use(function * () {
        this.body = yield this.request.json()
      })
      request(app.listen())
        .post('/')
        .type('json')
        .send('"lol"')
        .expect(200)
        .expect('lol', done)
    })
  })

  describe('.request.urlencoded()', () => {
    it('should parse a urlencoded body', (done) => {
      const app = koala()
      app.use(function * () {
        this.body = yield this.request.urlencoded()
      })
      request(app.listen())
        .post('/')
        .send('message=lol')
        .expect(200)
        .expect(/"message"/)
        .expect(/"lol"/, done)
    })
  })

  describe('.request.text()', () => {
    it('should get the raw text body', (done) => {
      const app = koala()
      app.use(function * () {
        this.body = yield this.request.text()
        assert.equal('string', typeof this.body)
      })
      request(app.listen())
        .post('/')
        .send('message=lol')
        .expect(200)
        .expect('message=lol', done)
    })

    it('should throw if the body is too large', (done) => {
      const app = koala()
      app.use(function * () {
        yield this.request.text('1kb')
        this.body = 204
      })
      request(app.listen())
        .post('/')
        .send(new Buffer(2048))
        .expect(413, done)
    })
  })

  describe('.request.buffer()', () => {
    it('should get the raw buffer body', (done) => {
      const app = koala()
      app.use(function * () {
        this.body = yield this.request.buffer()
        assert(Buffer.isBuffer(this.body))
      })
      request(app.listen())
        .post('/')
        .send('message=lol')
        .expect(200)
        .expect('message=lol', done)
    })

    it('should throw if the body is too large', (done) => {
      const app = koala()
      app.use(function * () {
        yield this.request.buffer('1kb')
        this.body = 204
      })
      request(app.listen())
        .post('/')
        .send(new Buffer(2048))
        .expect(413, done)
    })
  })

  describe('Expect: 100-continue', () => {
    it('should send 100-continue', (done) => {
      const app = koala()
      app.use(function * () {
        this.body = yield this.request.json()
      })
      app.listen(function () {
        http.request({
          port: this.address().port,
          path: '/',
          headers: {
            expect: '100-continue',
            'content-type': 'application/json'
          }
        })
          .once('continue', function () {
            this.end(JSON.stringify({
              message: 'lol'
            }))
          })
          .once('response', (res) => {
            done()
          })
          .once('error', done)
      })
    })
  })
})

function koala () {
  const app = koa()
  require('..')(app)
  return app
}
