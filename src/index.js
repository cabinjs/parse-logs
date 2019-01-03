const _ = require('lodash');
const parseRequest = require('parse-request');
const isWhitespace = require('is-whitespace');

const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

const parseLogs = req => {
  // parse the request body for `message` and `meta` object
  const log = {};
  if (_.isString(req.message) && !isWhitespace(req.message))
    log.message = req.message;
  if (_.isPlainObject(req.meta) && !_.isEmpty(req.meta)) log.meta = req.meta;

  // ensure that we have something sent from the client otherwise throw error
  if (_.isEmpty(log))
    throw new Error(
      'Log is missing `message` and/or `meta` properties (at least one is required)'
    );

  // if `log.meta` is not an object then make it one
  if (!_.isPlainObject(log.meta)) log.meta = {};

  // parse the request and populate an IP if it didn't have one
  log.meta = _.defaultsDeep(log.meta, parseRequest(req, ['ip_address']));

  // ensure log level is a String if it was passed in request
  if (!_.isUndefined(req.level) && !_.isString(req.level))
    throw new Error(
      `Log \`level\` must be a String, not a ${typeof log.level}`
    );

  // ensure it was set in the body
  if (!_.isString(req.level))
    throw new Error(`Log is missing \`level\` property`);

  // set the value
  log.level = req.level;

  // ensure it is a valid log level
  if (!_.includes(levels, log.level))
    throw new Error(
      `Log \`level\` of "${
        log.level
      }" was invalid, it must be one of: ${levels.join(', ')}`
    );

  // filter out the properties we want
  log.meta = _.pick(log.meta, ['request', 'user', 'err', 'level']);

  // return the log
  return log;
};

module.exports = parseLogs;
