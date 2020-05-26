const ErrorStackParser = require('error-stack-parser');
const defaultsDeep = require('lodash/defaultsDeep');
const includes = require('lodash/includes');
const isEmpty = require('lodash/isEmpty');
const isError = require('iserror');
const isObject = require('lodash/isObject');
const isString = require('lodash/isString');
const isWhitespace = require('is-whitespace');
const parseRequest = require('parse-request');
const pick = require('lodash/pick');
const prepareStackTrace = require('prepare-stack-trace');
const rfdc = require('rfdc');

const clone = rfdc();

const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

// req = ctx.request (Koa)
// req = req (Express)
// eslint-disable-next-line complexity
const parseLogs = (req, userFields = ['ip_address'], allowEmpty = false) => {
  // ensure that `req` is an object
  if (!isObject(req))
    throw new Error('Request object was missing or not an object');

  const isBodyAnObject = isObject(req.body);

  // ensure that a 'body' exists in the request
  if (!allowEmpty && !isBodyAnObject)
    throw new Error('Log request is missing parsed `body` object property');

  // parse the request body for `message` and `meta` object
  const log = {};
  if (isBodyAnObject) {
    if (isString(req.body.message) && !isWhitespace(req.body.message))
      log.message = clone(req.body.message);
    if (isObject(req.body.meta) && !isEmpty(req.body.meta))
      log.meta = clone(req.body.meta);
  }

  // ensure that we have something sent from the client otherwise throw error
  if (!allowEmpty && isEmpty(log))
    throw new Error(
      'Log is missing `message` and/or `meta` properties (at least one is required)'
    );

  // if `log.meta` is not an object then make it one
  if (!isObject(log.meta)) log.meta = {};

  // parse the request (will populate user and IP if they do not already exist)
  log.meta = defaultsDeep(log.meta, parseRequest({ req, userFields }));

  // parse the app info
  if (isObject(log.meta.app))
    log.meta.app = pick(log.meta.app, [
      'name',
      'version',
      'node',
      'hash',
      'tag',
      'environment',
      'hostname',
      'pid'
    ]);

  // ensure log level is a String if it was passed in request
  if (!allowEmpty && !isString(log.meta.level))
    throw new Error('Log meta `level` must be a String');

  // ensure it is a valid log level
  if (!allowEmpty && !includes(levels, log.meta.level))
    throw new Error(
      `Log \`level\` of "${
        log.meta.level
      }" was invalid, it must be one of: ${levels.join(', ')}`
    );

  // TODO: if there was a `log.meta.user` property

  // parse the error if it has one
  if (
    isObject(log.meta) &&
    isObject(log.meta.err) &&
    isString(log.meta.err.message) &&
    !isError(log.meta.err)
  ) {
    try {
      const err = new Error(log.meta.err.message);
      const { stack } = err;
      for (const prop in log.meta.err) {
        if (Object.prototype.hasOwnProperty.call(log.meta.err, prop))
          err[prop] = log.meta.err[prop];
      }

      if (!err.name && err.constructor.name) err.name = err.constructor.name;
      // <https://github.com/tjmehta/error-to-json/blob/master/index.js#L46-L55>
      if (err.stack === stack) err.stack = stack.slice(0, stack.indexOf('\n'));
      //
      // Note we could use `stackTrace.parse(err)`
      // however we shouldn't assume that everyone
      // will be sending us Node-like stack traces
      // (e.g. ones converted using StackTrace.JS `fromError`)
      //
      // const stackTrace = require('stack-trace');
      //
      err.stack = prepareStackTrace(err, ErrorStackParser.parse(err));
      log.meta.err = err;
    } catch (err) {
      log.meta.original_err = log.meta.err;
      log.meta.err = err;
    }
  }

  // return the log
  return log;
};

module.exports = parseLogs;
