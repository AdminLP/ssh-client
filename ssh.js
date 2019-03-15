const connect = require('./lib/ssh-client');
const { getConfig } = require('./tools');

connect({
  ...getConfig(),
});
