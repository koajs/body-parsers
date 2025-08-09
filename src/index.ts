import getRawBody from 'raw-body'
import qs from 'querystring'
import type Koa from 'koa'

declare module 'koa' {
  interface Request {
    json: (limit?: string) => Promise<any>
    _parse_json: (text: string) => any
    urlencoded: (limit?: string) => Promise<any>
    _parse_urlencoded: (text: string) => any
    body: (limit?: string) => Promise<any>
    text: (limit?: string) => Promise<string>
    buffer: (limit?: string) => Promise<Buffer>
    length?: number
  }

  interface Response {
    writeContinue: () => this
    _checkedContinue?: boolean
  }
}

const requestExtensions = {
  async json (this: Koa.Request, limit?: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!this.length) return await Promise.resolve()

    const parsedAsText = await this.text(limit)
    return this._parse_json(parsedAsText)
  },

  _parse_json (this: Koa.Request, text: string): any {
    if (
      (this.app as typeof this.app & { jsonStrict?: boolean }).jsonStrict !==
      false
    ) {
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
  },

  async urlencoded (this: Koa.Request, limit?: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!this.length) return await Promise.resolve()

    const parsedAsText = await this.text(limit)
    return this._parse_urlencoded(parsedAsText)
  },

  _parse_urlencoded (this: Koa.Request, text: string): any {
    const qsParser = (
      (this.app as typeof this.app & { querystring?: typeof qs }).querystring ??
      qs
    ).parse

    try {
      return qsParser(text)
    } catch (err) {
      this.ctx.throw(400, 'invalid urlencoded received')
    }
  },

  async body (this: Koa.Request, limit?: string): Promise<any> {
    switch (this.is('urlencoded', 'json')) {
      case 'json':
        return await this.json(limit)
      case 'urlencoded':
        return await this.urlencoded(limit)
      default:
        return await Promise.resolve()
    }
  },

  async text (this: Koa.Request, limit?: string): Promise<string> {
    this.response.writeContinue()
    return await getRawBody(this.req, {
      limit: limit ?? '100kb',
      length: this.length,
      encoding: 'utf8'
    })
  },

  async buffer (this: Koa.Request, limit?: string): Promise<Buffer> {
    this.response.writeContinue()

    return await getRawBody(this.req, {
      limit: limit ?? '1mb',
      length: this.length
    })
  }
}

const responseExtensions = {
  writeContinue (this: Koa.Response): Koa.Response {
    if (
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      !this._checkedContinue &&
      'checkContinue' in this.req &&
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      this.req.checkContinue
    ) {
      this.res.writeContinue()
      this._checkedContinue = true
    }

    return this
  }
}

export const withBodyParsers = (app: Koa): Koa => {
  Object.keys(requestExtensions).forEach((key) => {
    // @ts-expect-error
    app.request[key] = requestExtensions[key]
  })

  Object.keys(responseExtensions).forEach((key) => {
    // @ts-expect-error
    app.response[key] = responseExtensions[key]
  })

  return app
}

export default withBodyParsers
