'use strict'

/* eslint-env mocha */

const request = require('supertest')
const assert = require('assert')
const http = require('http')
const Koa = require('koa')

describe('Body Parsing', () => {
  describe('.request.json()', () => {
    it('should parse a json body', () => {
      const app = koala()
      app.use(async (ctx) => {
        ctx.body = await ctx.request.json()
      })
      return request(app.listen())
        .post('/')
        .send({
          message: 'lol'
        })
        .expect(200)
        .expect(/"message"/)
        .expect(/"lol"/)
    })

    it('should throw on non-objects in strict mode', () => {
      const app = koala()
      app.use(async (ctx) => {
        ctx.body = await ctx.request.json()
      })
      return request(app.listen())
        .post('/')
        .type('json')
        .send('"lol"')
        .expect(400)
        .expect('only json objects or arrays allowed')
    })

    it('should not throw on non-objects in non-strict mode', () => {
      const app = koala()
      app.jsonStrict = false
      app.use(async (ctx) => {
        ctx.body = await ctx.request.json()
      })
      return request(app.listen())
        .post('/')
        .type('json')
        .send('"lol"')
        .expect(200)
        .expect('lol')
    })

    it('should throw when parsing invalid JSON', () => {
      const app = koala()
      app.use(async (ctx) => {
        ctx.body = await ctx.request.json()
      })
      return request(app.listen())
        .post('/')
        .type('json')
        .send('{invalid:true}')
        .expect(400)
        .expect('invalid json received')
    })
  })

  describe('.request.urlencoded()', () => {
    it('should parse a urlencoded body', () => {
      const app = koala()
      app.use(async (ctx) => {
        ctx.body = await ctx.request.urlencoded()
      })
      return request(app.listen())
        .post('/')
        .send('message=lol')
        .expect(200)
        .expect(/"message"/)
        .expect(/"lol"/)
    })

    it('should return immediately when receiving an empty body', () => {
      const app = koala()
      app.use(async (ctx) => {
        ctx.body = await ctx.request.urlencoded()
      })
      return request(app.listen())
        .post('/')
        .send('')
        .expect(204)
        .expect('')
    })

    it('should throw when the underlying parser fails', () => {
      const app = koala()
      app.querystring = () => { throw new Error('parsing failed') }
      app.use(async (ctx) => {
        ctx.body = await ctx.request.urlencoded()
      })
      return request(app.listen())
        .post('/')
        .send('boop')
        .expect(400)
        .expect('invalid urlencoded received')
    })
  })

  describe('.request.text()', () => {
    it('should get the raw text body', () => {
      const app = koala()
      app.use(async (ctx) => {
        ctx.body = await ctx.request.text()
        assert.equal('string', typeof ctx.body)
      })
      return request(app.listen())
        .post('/')
        .send('message=lol')
        .expect(200)
        .expect('message=lol')
    })

    it('should throw if the body is too large', () => {
      const app = koala()
      app.use(async (ctx) => {
        await ctx.request.text('1kb')
        ctx.body = 204
      })
      return request(app.listen())
        .post('/')
        .send(Buffer.alloc(2048))
        .expect(413)
    })
  })

  describe('.request.buffer()', () => {
    it('should get the raw buffer body', () => {
      const app = koala()
      app.use(async (ctx) => {
        ctx.type = 'text'
        ctx.body = await ctx.request.buffer()
        assert(Buffer.isBuffer(ctx.body))
      })
      return request(app.listen())
        .post('/')
        .send('message=lol')
        .expect(200)
        .expect('message=lol')
    })

    it('should throw if the body is too large', () => {
      const app = koala()
      app.use(async (ctx) => {
        await ctx.request.buffer('1kb')
        ctx.body = 204
      })
      return request(app.listen())
        .post('/')
        .send(Buffer.alloc(2048))
        .expect(413)
    })
  })

  describe('.request.body()', () => {
    it('should parse a json body', () => {
      const app = koala()
      app.use(async (ctx) => {
        ctx.body = await ctx.request.body()
      })
      return request(app.listen())
        .post('/')
        .send({
          message: 'lol'
        })
        .expect(200)
        .expect(/"message"/)
        .expect(/"lol"/)
    })

    it('should parse a urlencoded body', () => {
      const app = koala()
      app.use(async (ctx) => {
        ctx.body = await ctx.request.body()
      })
      return request(app.listen())
        .post('/')
        .send('message=lol')
        .expect(200)
        .expect(/"message"/)
        .expect(/"lol"/)
    })
  })

  describe('Expect: 100-continue', () => {
    it('should send 100-continue', (done) => {
      const app = koala()
      app.use(async (ctx) => {
        ctx.body = await ctx.request.json()
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

    it('should send 100-continue when not using app.listen()', (done) => {
      const app = koala()
      app.use(async (ctx) => {
        ctx.body = await ctx.request.text()
      })

      const fn = app.callback()
      const server = http.createServer()
      server.on('checkContinue', (req, res) => {
        req.checkContinue = true
        fn(req, res)
      })

      server.listen(function () {
        http.request({
          port: this.address().port,
          path: '/',
          headers: {
            Expect: '100-continue',
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
  const app = new Koa()
  require('..')(app)
  return app
}
