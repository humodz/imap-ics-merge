const Dicer = require('dicer');
const quotedPrintable = require('quoted-printable');
const contentType = require('content-type');
const { decodeFlowed } = require('libmime');

async function parseMultipart(body, boundary) {
  return new Promise((resolve, reject) => {
    const parts = [];

    const dicer = new Dicer({ boundary });

    dicer.on('part', part => {
      const partData = {};
      parts.push(partData);

      const chunks = [];

      part.on('header', header => {
        partData.header = header;
      });

      part.on('data', chunk => {
        chunks.push(chunk);
      });

      part.on('end', () => {
        partData.data = Buffer.concat(chunks);
      });

      part.on('error', error => {
        partData.error = error;
      });
    });

    dicer.on('error', error => {
      reject(error);
    });

    dicer.on('finish', () => resolve(parts));
    dicer.write(body);
  });
}

function decodeBody(header, body) {
  const ct = contentType.parse(header['content-type'][0]).parameters;
  const transferEncoding = header['content-transfer-encoding'][0];

  let data = body.toString();

  if (ct.format === 'flowed') {
    data = decodeFlowed(data, ct.delsp === 'yes');
  }

  if (transferEncoding === 'base64') {
    data = Buffer.from(data, 'base64');
  } else if (transferEncoding === 'quoted-printable') {
    data = Buffer.from(quotedPrintable.decode(data), 'binary');
  }

  return data.toString(ct.charset || 'utf-8');
}

function hasContentType(part, type) {
  const ct = contentType.parse(part.header['content-type'][0]);
  return ct.type === type;
}

module.exports = {
  parseMultipart,
  decodeBody,
  hasContentType,
};
