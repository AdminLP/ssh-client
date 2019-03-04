const fs = require('fs');
const {
  getFileName,
} = require('../tools');

const getFile = (sftp, serverPath, clientPath) => {
  const fileName = getFileName(serverPath);
  const absoluteClientFileName = `${clientPath}/${fileName}`;
  sftp.fastGet(serverPath, absoluteClientFileName, {}, (downloadError) => {
    if (downloadError) throw downloadError;
    process.stdout.write('\nFile is downloaded successfully');
  });
};

const putFile = (sftp, clientPath, serverPath) => {
  const fileName = getFileName(clientPath);
  const absoluteServerFileName = `${serverPath}/${fileName}`;
  const readStream = fs.createReadStream(clientPath);
  const writeStream = sftp.createWriteStream(absoluteServerFileName);

  readStream.pipe(writeStream);

  writeStream.on('close', () => {
    process.stdout.write('\nFile is uploaded successfully');
  });

  writeStream.on('error', error => process.stdout.write(error));
};

const runCommand = (sshClient, parsedCommand) => {
  const {
    command,
    filePath: {
      from,
      to,
    },
  } = parsedCommand;
  sshClient.sftp((e, sftp) => {
    if (e) throw e;
    switch (command) {
      case 'get':
        getFile(sftp, from, to);
        break;
      case 'put':
        putFile(sftp, from, to);
        break;
      default:
        process.stdout.write('Unknown action');
    }
  });
};

module.exports = {
  runCommand,
};
