
# Koa Body Parsers

[![NPM version][npm-image]][npm-url]

A more functional version of body parsing.
Use this module if you want to "lazily" parse the body.
Other middleware automatically parse the body in the middleware chain, which might not be ideal as business logic like authentication, authorization, and routing are not done prior to body parsing.

Includes a `json` and `urlencoded` parsers.

## API

Initialization:

```js
import koaBodyParsers from 'koa-body-parsers'
import Koa from 'koa'

const app = new Koa()
koaBodyParsers(app)

// example usage
app.use(async (ctx) => {
  const currentUser = UserService.getCurrentUser(ctx)
  ctx.assert(currentUser, 401)

  ctx.assert(ctx.request.is('json'), 415)
  const body = await ctx.request.json('100kb')
  ctx.body = body
})
```

Because this module is a plugin for the `context`, the API signature is different.

### Expect: 100-continue and ctx.response.writeContinue()

`Expect: 100-continue` is automatically supported as long as you use `app.listen()`.
Otherwise, create your server like this:

```js
const fn = app.callback();
const server = http.createServer(); // or whatever server you use
server.on('request', fn); // regular requests
server.on('checkContinue', function (req, res) {
  // tag requests with `Expect: 100-continue`
  req.checkContinue = true;
  fn(req, res);
});
```

If `Expect: 100-continue` was sent to the client,
this will automatically response with a "100-continue".
Use this right before parsing the body.
Automatically called by all following body parsers,
but you would still have to call it if you're doing something like:

```js
app.use(async (ctx) => {
  if (ctx.request.is('image/*')) {
    ctx.response.writeContinue();
    const buffer = await ctx.request.buffer()
  }
})
```

### const body = await ctx.request.json([limit])

Get the JSON body of the request, if any.
`limit` defaults to `100kb`.

### const body = await ctx.request.urlencoded([limit])

Get the traditional form body of the request, if any,
`limit` defaults to `100kb`.

### const text = await ctx.request.text([limit])

Get the body of the request as a single `text` string.
`limit` defaults to `100kb`.
You could use this to create your own request body parser of some sort.

### const buffer = await ctx.request.buffer([limit])

Get the body of the request as a single `Buffer` instance.
`limit` defaults to `1mb`.

[npm-image]: https://img.shields.io/npm/v/koa-body-parsers.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-body-parsers
