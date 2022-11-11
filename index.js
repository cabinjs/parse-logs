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

function parseError(error) {
  const err = new Error(error.message);
  const { stack } = err;

  for (const prop in error) {
    if (Object.prototype.hasOwnProperty.call(error, prop))
      err[prop] = error[prop];
  }

  if (!err.name && err.constructor.name) err.name = err.constructor.name;

  // <https://github.com/tjmehta/error-to-json/blob/f8c293395c71d157ac96eb83657da9c47d7dadb2/src/index.ts#L55-L56>
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

  return err;
}

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

  // parse the request body for `err`, `message`, and `meta` object
  const log = {};
  if (isBodyAnObject) {
    if (isObject(req.body.err) && !isEmpty(req.body.err))
      log.err = clone(req.body.err);
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

  // parse the error if it has one in `log.meta.original_err`
  if (
    isObject(log.meta) &&
    isObject(log.meta.original_err) &&
    isString(log.meta.original_err.message) &&
    !isError(log.meta.original_err)
  ) {
    try {
      log.meta.original_err = parseError(log.meta.original_err);
    } catch (err) {
      log.meta.err = err;
    }
  }

  // parse the error if it has one in `log.err`
  if (isObject(log.err) && isString(log.err.message) && !isError(log.err)) {
    try {
      log.err = parseError(log.err);
    } catch (err) {
      log.original_err = log.err;
      log.err = err;
    }
  }

  // parse the error if it has one in `log.meta.err`
  if (
    isObject(log.meta) &&
    isObject(log.meta.err) &&
    isString(log.meta.err.message) &&
    !isError(log.meta.err)
  ) {
    try {
      log.meta.err = parseError(log.meta.err);
    } catch (err) {
      log.meta.original_err = log.meta.err;
      log.meta.err = err;
    }
  }

  // return the log
  return log;
};

module.exports = parseLogs;
