const test = require('ava');
const parseErr = require('parse-err');
const _ = require('lodash');

const parseLogs = require('..');

test('throws error if it was not passed an object', t => {
  const error = t.throws(() => parseLogs());
  t.is(error.message, 'Request object was missing or not an object');
});

test('throws error if body does not exist', t => {
  const error = t.throws(() => parseLogs({}));
  t.is(error.message, 'Log request is missing parsed `body` object property');
});

test('throws error with missing log message and/or meta', t => {
  const error = t.throws(() =>
    parseLogs({
      body: {}
    })
  );
  t.is(
    error.message,
    'Log is missing `message` and/or `meta` properties (at least one is required)'
  );
});

test('throws error with missing String for log level', t => {
  const error = t.throws(() =>
    parseLogs({
      body: {
        message: 'Hello',
        meta: {
          level: 1
        }
      }
    })
  );
  t.is(error.message, 'Log meta `level` must be a String');
});

test('throws error with invalid log level', t => {
  const error = t.throws(() =>
    parseLogs({
      body: {
        message: 'Hello',
        meta: {
          level: 'infoo'
        }
      }
    })
  );
  t.regex(error.message, /Log `level` of "infoo" was invalid/);
});

test('filters out only specific log level properties', t => {
  const log = parseLogs({
    body: {
      message: 'Hello',
      meta: {
        level: 'error',
        err: parseErr(new Error('Hello'))
      }
    }
  });
  t.deepEqual(Object.keys(log), ['message', 'meta']);
  t.true(_.isString(log.message));
  t.true(_.isPlainObject(log.meta));
  t.deepEqual(
    Object.keys(log.meta).sort(),
    ['request', 'user', 'level', 'err'].sort()
  );
});

test('populates user object', t => {
  const log = parseLogs(
    {
      body: {
        message: 'Hello',
        meta: {
          level: 'info'
        }
      },
      ip: '127.0.0.1',
      user: {
        full_name: 'niftylettuce'
      }
    },
    ['full_name', 'ip_address']
  );
  t.deepEqual(log.meta.user, {
    full_name: 'niftylettuce',
    ip_address: '127.0.0.1'
  });
});

test('populates user object from meta', t => {
  const log = parseLogs({
    body: {
      message: 'Hello',
      meta: {
        level: 'info',
        user: {
          full_name: 'niftylettuce'
        }
      }
    },
    ip: '127.0.0.1'
  });
  t.deepEqual(log.meta.user, {
    full_name: 'niftylettuce',
    ip_address: '127.0.0.1'
  });
});

test('populates IP address based off `req.ip`', t => {
  const log = parseLogs(
    {
      body: {
        message: 'Hello',
        meta: {
          level: 'info',
          user: {
            ip_address: '127.0.0.1'
          }
        }
      }
    },
    ['ip_address']
  );
  t.deepEqual(log.meta.user, {
    ip_address: '127.0.0.1'
  });
});

test('filters out specific userFields if the argument was passed', t => {
  const log = parseLogs(
    {
      body: {
        message: 'Hello',
        meta: {
          level: 'info',
          user: {
            ip_address: '127.0.0.1'
          }
        }
      }
    },
    ['ip_address']
  );
  t.deepEqual(log.meta.user, {
    ip_address: '127.0.0.1'
  });
});
