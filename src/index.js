const isObject = require('lodash/isObject');
const isEmpty = require('lodash/isEmpty');
const pick = require('lodash/pick');
const defaultsDeep = require('lodash/defaultsDeep');
const isString = require('lodash/isString');
const includes = require('lodash/includes');
const parseRequest = require('parse-request');
const isWhitespace = require('is-whitespace');
const rfdc = require('rfdc');

const clone = rfdc();

const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

// req = ctx.request (Koa)
// req = req (Express)
const parseLogs = (req, userFields = ['ip_address']) => {
  // ensure that `req` is an object
  if (!isObject(req))
    throw new Error('Request object was missing or not an object');

  // ensure that a 'body' exists in the request
  if (!isObject(req.body))
    throw new Error('Log request is missing parsed `body` object property');

  // parse the request body for `message` and `meta` object
  const log = {};
  if (isString(req.body.message) && !isWhitespace(req.body.message))
    log.message = clone(req.body.message);
  if (isObject(req.body.meta) && !isEmpty(req.body.meta))
    log.meta = clone(req.body.meta);

  // ensure that we have something sent from the client otherwise throw error
  if (isEmpty(log))
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
  if (!isString(log.meta.level))
    throw new Error('Log meta `level` must be a String');

  // ensure it is a valid log level
  if (!includes(levels, log.meta.level))
    throw new Error(
      `Log \`level\` of "${
        log.meta.level
      }" was invalid, it must be one of: ${levels.join(', ')}`
    );

  // TODO: if there was a `log.meta.user` property

  // return the log
  return log;
};

module.exports = parseLogs;
