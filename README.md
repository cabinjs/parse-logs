# parse-logs

[![build status](https://img.shields.io/travis/cabinjs/parse-logs.svg)](https://travis-ci.org/cabinjs/parse-logs)
[![code coverage](https://img.shields.io/codecov/c/github/cabinjs/parse-logs.svg)](https://codecov.io/gh/cabinjs/parse-logs)
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

[yarn][]:

```sh
yarn add parse-logs
```


## How does it work

This package exports a function that accepts two arguments `req` which is either `ctx.request` from [Koa][] or `req` from [Express][], and `userFields`, which is an Array of user fields to pick using [parse-request][]'s `userFields` option (by default it is simply `[ "ip_address" ]`).

You use this function to parse an inbound HTTP request body in order to return and validate a log object.

```js
{
  request: {
    method: 'GET',
    query: {},
    headers: {},
    cookies: {},
    body: '',
    url: ''
  },
  user: {}
}
```

Note that there is a `user` object returned, which will be parsed from `req.user` automatically.

The `user` object will also have a `ip_address` property added, but only if one does not already exists and if an IP address was actually detected.


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

[yarn]: https://yarnpkg.com/

[cabin]: https://cabinjs.com

[lad]: https://lad.js.org

[koa]: https://koajs.com

[express]: https://expressjs.com

[parse-request]: https://github.com/cabinjs/parse-request
