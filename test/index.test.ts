"use strict";

import assert from "node:assert";
import http from "node:http";
import { describe, it } from "node:test";
import type { Socket } from "node:net";

import Koa from 'koa';
import request from "supertest";

import { withBodyParsers } from '../src'

export const createApp = (): Koa => {
  const app = new Koa()
  withBodyParsers(app)

  return app
}

describe("Body Parsing", () => {
  describe(".request.json()", () => {
    it("should parse a json body", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.body = await ctx.request.json();
      });

      await request(app.callback())
        .post("/")
        .send({
          message: "lol",
        })
        .expect(200)
        .expect(/"message"/)
        .expect(/"lol"/);
    });

    it("should throw on non-objects in strict mode", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.body = await ctx.request.json();
      });

      await request(app.callback())
        .post("/")
        .type("json")
        .send('"lol"')
        .expect(400)
        .expect("only json objects or arrays allowed");
    });

    it("should not throw on non-objects in non-strict mode", async () => {
      const app = createApp();
      // @ts-expect-error
      app.jsonStrict = false;
      app.use(async (ctx) => {
        ctx.body = await ctx.request.json();
      });

      await request(app.callback())
        .post("/")
        .type("json")
        .send('"lol"')
        .expect(200)
        .expect("lol");
    });

    it("should throw when parsing invalid JSON", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.body = await ctx.request.json();
      });

      await request(app.callback())
        .post("/")
        .type("json")
        .send("{invalid:true}")
        .expect(400)
        .expect("invalid json received");
    });
  });

  describe(".request.urlencoded()", () => {
    it("should parse a urlencoded body", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.body = await ctx.request.urlencoded();
      });

      await request(app.callback())
        .post("/")
        .send("message=lol")
        .expect(200)
        .expect(/"message"/)
        .expect(/"lol"/);
    });

    it("should return immediately when receiving an empty body", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.body = await ctx.request.urlencoded();
      });

      await request(app.callback()).post("/").send("").expect(204).expect("");
    });

    it("should throw when the underlying parser fails", async () => {
      const app = createApp();
      // @ts-expect-error
      app.querystring = () => {
        throw new Error("parsing failed");
      };
      app.use(async (ctx) => {
        ctx.body = await ctx.request.urlencoded();
      });

      await request(app.callback())
        .post("/")
        .send("boop")
        .expect(400)
        .expect("invalid urlencoded received");
    });
  });

  describe(".request.text()", () => {
    it("should get the raw text body", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.body = await ctx.request.text();
        assert.equal("string", typeof ctx.body);
      });

      await request(app.callback())
        .post("/")
        .send("message=lol")
        .expect(200)
        .expect("message=lol");
    });

    it("should throw if the body is too large", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        await ctx.request.text("1kb");
        ctx.body = 204;
      });

      await request(app.callback())
        .post("/")
        .send(Buffer.alloc(2048))
        .expect(413);
    });
  });

  describe(".request.buffer()", () => {
    it("should get the raw buffer body", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.type = "text";
        ctx.body = await ctx.request.buffer();
        assert(Buffer.isBuffer(ctx.body));
      });

      await request(app.callback())
        .post("/")
        .send("message=lol")
        .expect(200)
        .expect("message=lol");
    });

    it("should throw if the body is too large", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        await ctx.request.buffer("1kb");
        ctx.body = 204;
      });

      await request(app.callback())
        .post("/")
        .send(Buffer.alloc(2048))
        .expect(413);
    });
  });

  describe(".request.body()", () => {
    it("should parse a json body", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.body = await ctx.request.body();
      });

      await request(app.callback())
        .post("/")
        .send({
          message: "lol",
        })
        .expect(200)
        .expect(/"message"/)
        .expect(/"lol"/);
    });

    it("should parse a urlencoded body", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.body = await ctx.request.body();
      });

      await request(app.callback())
        .post("/")
        .send("message=lol")
        .expect(200)
        .expect(/"message"/)
        .expect(/"lol"/);
    });
  });

  describe("Expect: 100-continue", () => {
    const send100ContinueRequest = async (
      port: number,
      path = "/"
    ): Promise<void> => {
      return await new Promise<void>((resolve, reject) => {
        const req = http.request({
          port,
          path,
          headers: {
            expect: "100-continue",
            "content-type": "application/json",
          },
        });

        req.once("continue", function (this: Socket) {
          this.end(JSON.stringify({ message: "lol" }));
        });

        req.once("response", () => resolve());

        req.once("error", (err) => reject(err));

        req.end();
      });
    };

    it("should send 100-continue", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.body = await ctx.request.json();
      });

      const server = app.listen();
      try {
        const addressInfo = server.address();
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!addressInfo || typeof addressInfo === "string") {
          throw new Error("Server address not found");
        }

        await send100ContinueRequest(addressInfo.port);
      } finally {
        server.close();
      }
    });

    it("should send 100-continue when not using app.listen()", async () => {
      const app = createApp();
      app.use(async (ctx) => {
        ctx.body = await ctx.request.text();
      });

      const fn = app.callback();
      const server = http.createServer();

      server.on("checkContinue", (req, res) => {
        // Inform Node this is a 100-continue request
        // @ts-expect-error
        req.checkContinue = true;
        fn(req, res);
      });

      await new Promise<void>((resolve, reject) => {
        server.listen(async () => {
          try {
            const addressInfo = server.address();
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            if (!addressInfo || typeof addressInfo === "string") {
              throw new Error("Server address not found");
            }

            await send100ContinueRequest(addressInfo.port);
            resolve();
          } catch (err) {
            reject(err);
          } finally {
            server.close();
          }
        });
      });
    });
  });
});
