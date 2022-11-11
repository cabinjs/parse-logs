# parse-logs

[![build status](https://github.com/cabinjs/parse-logs/actions/workflows/ci.yml/badge.svg)](https://github.com/cabinjs/parse-logs/actions/workflows/ci.yml)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/cabinjs/parse-logs.svg)](LICENSE)

> Parse and validate logs to adhere to the message and meta standards from [Lad][] and [Cabin][].


## Table of Contents

* [Install](#install)
* [How does it work](#how-does-it-work)
* [Usage](#usage)
  * [Koa](#koa)
  * [Express](#express)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install parse-logs
```


## How does it work

This package exports a function that accepts two arguments `req` which is either `ctx.request` from [Koa][] or `req` from [Express][], and `userFields`, which is an Array of user fields to pick using [parse-request][]'s `userFields` option (by default it is simply `[ "ip_address" ]`).

You use this function to parse an inbound HTTP request body in order to return and validate a log object.

In order for this to work properly, the `body` must already be a parsed Object (it cannot be a String).

For example, below is an example request Object that you can pass as `req` to `parseLogs(req)`:

```js
const parseLogs = require('.');

const req = {
  method: 'GET',
  query: {},
  headers: {
    'X-Request-Id': '123456',
    'User-Agent': 'Test User Agent'
  },
  cookies: {},
  body: {
    err: {
      message: 'Oops',
      stack: '...'
    },
    message: 'Oops',
    meta: {
      level: 'error',
      user: {
        id: '123456',
        email: 'test@example.com'
      }
    }
  },
  url: ''
};

console.log(parseLogs(req));
```

Outputs to console:

```sh
{
  err: Error: Oops
      at ... (::),
  message: 'Oops',
  meta: {
    level: 'error',
    user: { id: '123456', email: 'test@example.com' },
    id: '636e9a831bdc98012abd4519',
    timestamp: '2022-11-11T18:54:59.000Z',
    request: { method: 'GET', headers: [Object], id: '123456' },
    duration: 0.728459
  }
}
```

Note that there is a `user` object returned, which will be parsed from `req.user` automatically.

The `user` object will also have a `ip_address` property added, but only if one does not already exists and if an IP address was actually detected.

Additionally, `err`, `meta.err`, and `meta.original_err` properties from a request body payload will be parsed into Error objects with stack traces (normalized across Node and browser environments).

For an example implementation please refer to the [Forward Email][forward-email] codebase.


## Usage

### Koa

```js
const parseLogs = require('parse-logs');
const bodyParser = require('koa-bodyparser');

app.use(bodyParser());
app.use((ctx, next) => {
  const log = parseLogs(ctx.request);
  console.log(log);
  ctx.body = log;
});
```

### Express

```js
const parseLogs = require('parse-logs');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use((req, res, next) => {
  const log = parseLogs(req);
  console.log(log);
  res.json(log);
});
```


## Contributors

| Name           | Website                    |
| -------------- | -------------------------- |
| **Nick Baugh** | <http://niftylettuce.com/> |


## License

[MIT](LICENSE) © [Nick Baugh](http://niftylettuce.com/)


##

[npm]: https://www.npmjs.com/

[cabin]: https://cabinjs.com

[lad]: https://lad.js.org

[koa]: https://koajs.com

[express]: https://expressjs.com

[parse-request]: https://github.com/cabinjs/parse-request

[forward-email]: https://github.com/forwardemail/forwardemail.net
