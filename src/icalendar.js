const { flatten } = require('./utils');

function mergeCalendars(calendars) {
  let timezones = new Map();
  let events = [];

  for (const calendar of calendars) {
    const lines = calendar.split('\r\n');
    const thisTimezones = searchTimezones(lines);
    const thisEvents = searchEvents(lines);

    for (const timezone of thisTimezones) {
      const tzId = getTimezoneId(timezone);
      timezones.set(tzId, timezone);
    }

    events.push(...thisEvents);
  }

  return [
    'BEGIN:VCALENDAR',
    'METHOD:REQUEST',
    'PRODID:imap-ics-fetch',
    'VERSION:0.1',
    ...flatten([...timezones.values()]),
    ...flatten(events),
    'END:VCALENDAR',
  ].join('\r\n');
}

function searchTimezones(lines) {
  return search(lines, 'BEGIN:VTIMEZONE', 'END:VTIMEZONE');
}

function getTimezoneId(timezone) {
  return timezone.find(line => line.startsWith('TZID:'));
}

function searchEvents(lines) {
  return search(lines, 'BEGIN:VEVENT', 'END:VEVENT');
}

function search(lines, begin, end) {
  const items = [];
  let item = [];

  let found = false;

  for (const line of lines) {
    if (line === begin) {
      found = true;
    }

    if (found) {
      item.push(line);
    }

    if (line === end) {
      items.push(item);
      item = [];
      found = false;
    }
  }

  return items;
}

module.exports = {
  mergeCalendars,
};
