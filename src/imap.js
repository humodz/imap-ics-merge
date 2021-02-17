const imaps = require('imap-simple');

const { parseMultipart } = require('./parsers');
const { With, flatten } = require('./utils');


async function readEmails({ config, box, search, fetch }) {
  return With(imapsContext(config), async connection => {
    await connection.openBox(box);
    return await connection.search(search, fetch);
  });
}

function imapsContext(config) {
  return {
    async enter() {
      this.connection = await imaps.connect(config);
      return this.connection;
    },
    exit() {
      if (this.connection) {
        this.connection.end();
      }
    },
  }
};

async function parseEmailBody(email) {
  const body = getBody(email);
  const boundary = getBoundary(email);
  return parseMultipart(body, boundary);
}

function getBoundary(email) {
  return flatten(email.attributes.struct)
    .find(s => s.type === 'alternative')
    .params.boundary;
}

function getBody(email) {
  return email.parts
    .find(part => part.which === 'TEXT')
    .body;
}

function getSubject(email) {
  return email.parts
    .find(part => part.which === 'HEADER')
    .body.subject[0];
}

module.exports = {
  readEmails,
  imapsContext,
  getBoundary,
  getBody,
  getSubject,
  parseEmailBody,
};
