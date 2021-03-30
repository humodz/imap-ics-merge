const fs = require('fs');
const path = require('path');

const { Command } = require('commander');
const inquirer = require('inquirer');

const { readEmails, parseEmailBody } = require('./imap');
const { hasContentType, decodeBody } = require('./parsers');
const { mergeCalendars } = require('./icalendar');


async function cli() {
  const program = new Command();

  program
    .name('imap-ics-merge')
    .addHelpText(
      'before',
      'Reads iCalendar events from an e-mail address and merges\n' +
      'them into a single .ics file\n',
    );

  program
    .requiredOption('-H, --host <url>', 'IMAP server host')
    .requiredOption('-u, --user <username>', 'IMAP server username')
    .option('-i, --input <folders...>', 'e-mail folders to read from', ['INBOX'])
    .requiredOption('-o, --output <destination>', 'output file (.ics)')
    .option(
      '-n --no-merge',
      'Do not merge .ics files. In that case, --output should be a directory',
      false,
     );

  program.exitOverride();

  try {
    program.parse();
  } catch (error) {
    console.error();
    program.outputHelp({ error: true });
    process.exit(1);
  }

  const answers = await inquirer
    .prompt([
      { type: 'password', name: 'password', message: 'IMAP server password' },
    ]);

  return { ...program.opts(), ...answers };
}

async function main() {
  /**/
  const options = await cli();
  /**/

  /** /
  const options = {
    host: 'imap.uhserver.com',
    user: '',
    password: '',
    input: ['INBOX'],
    output: 'data/merged.ics',
    merge: true,
  };
  /**/

  /**/
  const config = {
    imap: {
      user: options.user,
      password: options.password,
      host: options.host,
      port: 993,
      tls: true,
      authTimeout: 3000
    },
  };

  const emails = await readEmails({
    config,
    box: options.input,
    search: [['TEXT', 'Content-Type: text/calendar;']],
    fetch: {
      bodies: ['HEADER', 'TEXT'],
      markSeen: false,
      struct: true,
    },
  });
  /**/

  /** /
  const { saveJson, loadJson } = require('./utils');
  //saveJson('data/emails-2.json', emails); return;
  //const emails = loadJson('data/emails-2.json');
  /**/

  const bodies = await Promise.all(
    emails.map(e => parseEmailBody(e))
  );

  const calendars = bodies.map(b => parseCalendar(b));

  if (options.merge) {
    const result = mergeCalendars(calendars);

    fs.mkdirSync(path.dirname(options.output), { recursive: true });
    fs.writeFileSync(options.output, result);
  } else {
    fs.mkdirSync(options.output, { recursive: true });

    calendars.forEach((calendar, i) => {
      fs.writeFileSync(path.join(options.output, `${i}.ics`), calendar);
    });
  }
}

function parseCalendar(body) {
  const part = body.find(
    part => hasContentType(part, ['text/calendar', 'text/ics']),
  );
  const text = decodeBody(part.header, part.data);
  return text;
}

main().catch(console.error);
