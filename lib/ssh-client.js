const { Client } = require('ssh2');
const {
  parseCommand,
  isObject,
} = require('../tools');
const {
  runCommand,
} = require('./file-server');

const sshClient = new Client();

const CTRL_C = '\x03';
const carriageReturnChars = [10, 13];

sshClient.on('ready', () => {
  sshClient.shell({
    term: process.env.TERM,
    rows: process.stdout.rows,
    cols: process.stdout.columns,
  }, (err, stream) => {
    if (err) throw err;

    stream.on('close', () => {
      process.stdin.unref();
      sshClient.end();
    });

    let tempBuffer = '';

    process.stdin.setRawMode(true);
    process.stdin
      .on('readable', () => {
        let chunk;
        while ((chunk = process.stdin.read())) {
          if (chunk !== null) {
            for (let i = 0; i < chunk.length; i += 1) {
              if (carriageReturnChars.includes(chunk[i])) {
                const parsedCommand = parseCommand(tempBuffer);
                tempBuffer = '';
                if (isObject(parsedCommand)) {
                  runCommand(sshClient, parsedCommand);
                  stream.write(CTRL_C);
                  return;
                }
              } else {
                tempBuffer = tempBuffer.concat(chunk.toString());
              }
            }
            stream.write(chunk);
          }
        }
      });

    stream.pipe(process.stdout);

    process.stdout.on('resize', () => {
      stream.setWindow(process.stdout.rows, process.stdout.columns, 0, 0);
    });
  });
});

module.exports = sshClient;
