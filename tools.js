const minimist = require('minimist');
const stripAnsi = require('strip-ansi');
const {
  pipe,
  nth,
  slice,
  split,
  applySpec,
  pathOr,
  map,
  match,
  reject,
  isEmpty,
  head,
  when,
  prop,
  trim,
  replace,
  test,
  last,
  is,
} = require('ramda');
const fs = require('fs');
const path = require('path');

const DEFAULT_SYSTEM_USER = require('os').userInfo().username;

const DEFAULT_SSH_PORT = 22;
const destinationRegex = /(.*?)((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))(:?([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])?)/i;

const parseAuthData = pipe(
  nth(1),
  slice(0, -1),
  split(':'),
  map(when(isEmpty, () => null)),
  applySpec({
    username: pathOr(DEFAULT_SYSTEM_USER, [0]),
    password: pathOr(null, [1]),
  }),
);

const parseDestination = pipe(
  map(match(destinationRegex)),
  reject(isEmpty),
  head,
  applySpec({
    username: pipe(parseAuthData, prop('username')),
    password: pipe(parseAuthData, prop('password')),
    host: nth(2),
    port: pipe(pathOr(DEFAULT_SSH_PORT, [4]), parseInt),
  }),
);

const getPrivateKey = (pathToKey) => {
  const absolutePath = path.resolve(__dirname, pathToKey);

  try {
    return fs.readFileSync(absolutePath);
  } catch (e) {
    return null;
  }
};

const getConfig = () => {
  const {
    _: destination,
    i: identityFile,
  } = minimist(process.argv.slice(2));

  return {
    ...parseDestination(destination),
    privateKey: identityFile ? getPrivateKey(identityFile) : null,
  };
};

const parsePath = pipe(
  nth(2),
  trim,
  split(' '),
  applySpec({
    from: nth(0),
    to: pathOr('.', [1]),
  }),
);


const parseCommand = when(
  test(/(get|put)(.*)/i),
  pipe(
    match(/(get|put)(.*)/i),
    map(pipe(
      trim,
      replace(/\s+/g, ' '),
      stripAnsi,
      replace(/[\b]/g, ''),
      replace(/\s+/g, ' '),
    )),
    applySpec({
      command: nth(1),
      filePath: parsePath,
    }),
  ),
);

const getFileName = pipe(
  split('/'),
  last,
);

const isObject = is(Object);

module.exports = {
  getConfig,
  parseCommand,
  getFileName,
  isObject,
};
