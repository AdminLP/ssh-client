const SSH2Promise = require('ssh2-promise');
const {
  parseCommand,
  isObject,
} = require('../tools');
const {
  runCommand,
} = require('./file-server');

const CTRL_C = '\x03';
const carriageReturnChars = [10, 13];

const connect = async (config) => {
  const ssh = new SSH2Promise(config);
  const sftp = ssh.sftp();
  await ssh.connect();
  const socket = await ssh.shell({
    term: process.env.TERM,
    rows: process.stdout.rows,
    cols: process.stdout.columns,
  });
  socket.on('close', () => {
    process.stdin.unref();
    ssh.close();
  });

  let tempBuffer = '';

  process.stdin.setRawMode(true);
  process.stdin.once('readable', () => {
    socket.on('data', (data) => {
      tempBuffer = tempBuffer.concat(data.toString());
    });
  });
  process.stdin
    .on('readable', () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        for (let i = 0; i < chunk.length; i += 1) {
          if (carriageReturnChars.includes(chunk[i])) {
            const parsedCommand = parseCommand(tempBuffer);
            tempBuffer = '';
            if (isObject(parsedCommand)) {
              runCommand(sftp, parsedCommand);
              socket.write(CTRL_C);
              chunk = null;
              break;
            }
          }
        }
        if (chunk) {
          socket.write(chunk);
        }
      }
    });

  socket.pipe(process.stdout);

  process.stdout.on('resize', () => {
    socket.setWindow(process.stdout.rows, process.stdout.columns, 0, 0);
  });
};

module.exports = connect;
