
# Koa Body Parsers

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Greenkeeper badge](https://badges.greenkeeper.io/koajs/body-parsers.svg)](https://greenkeeper.io/)
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

A more functional version of body parsing.
Use this module if you want to "lazily" parse the body.
Other middleware automatically parse the body in the middleware chain, which might not be ideal as business logic like authentication, authorization, and routing are not done prior to body parsing.

Includes a `json` and `urlencoded` parsers,
as well as a utility to save streams to disk.

See https://github.com/koajs/koala/blob/master/docs/body-parsing.md for more details.

[npm-image]: https://img.shields.io/npm/v/koa-body-parsers.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-body-parsers
[travis-image]: https://img.shields.io/travis/koajs/body-parsers.svg?style=flat-square
[travis-url]: https://travis-ci.org/koajs/body-parsers
[coveralls-image]: https://img.shields.io/coveralls/koajs/body-parsers.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/koajs/body-parsers
[david-image]: http://img.shields.io/david/koajs/body-parsers.svg?style=flat-square
[david-url]: https://david-dm.org/koajs/body-parsers
[license-image]: http://img.shields.io/npm/l/koa-body-parsers.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/koa-body-parsers.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/koa-body-parsers
