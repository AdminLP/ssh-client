const sshClient = require('./lib/ssh-client');
const { getConfig } = require('./tools');

sshClient.connect({
  ...getConfig(),
});
