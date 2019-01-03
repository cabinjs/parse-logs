const _ = require('lodash');
const parseRequest = require('parse-request');
const isWhitespace = require('is-whitespace');

const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

// req = ctx.request (Koa)
// req = req (Express)
const parseLogs = (req, userFields) => {
  // ensure that `req` is an object
  if (!_.isPlainObject(req))
    throw new Error('Request object was missing or not an object');

  // ensure that a 'body' exists in the request
  if (!_.isPlainObject(req.body))
    throw new Error('Log request is missing parsed `body` object property');

  // parse the request body for `message` and `meta` object
  const log = {};
  if (_.isString(req.body.message) && !isWhitespace(req.body.message))
    log.message = _.clone(req.body.message);
  if (_.isPlainObject(req.body.meta) && !_.isEmpty(req.body.meta))
    log.meta = _.cloneDeep(req.body.meta);

  // ensure that we have something sent from the client otherwise throw error
  if (_.isEmpty(log))
    throw new Error(
      'Log is missing `message` and/or `meta` properties (at least one is required)'
    );

  // if `log.meta` is not an object then make it one
  if (!_.isPlainObject(log.meta)) log.meta = {};

  // parse the request (will populate user and IP if they do not already exist)
  log.meta = _.defaultsDeep(log.meta, parseRequest(req, userFields));

  // ensure log level is a String if it was passed in request
  if (!_.isString(log.meta.level))
    throw new Error('Log meta `level` must be a String');

  // ensure it is a valid log level
  if (!_.includes(levels, log.meta.level))
    throw new Error(
      `Log \`level\` of "${
        log.meta.level
      }" was invalid, it must be one of: ${levels.join(', ')}`
    );

  // filter out the properties we want
  log.meta = _.pick(log.meta, ['request', 'user', 'err', 'level']);

  // return the log
  return log;
};

module.exports = parseLogs;
