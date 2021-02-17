# imap-ics-merge

Reads iCalendar events from an e-mail address and merges them into a single `.ics` file

[Import events to Google Calendar][1]

[1]: https://support.google.com/calendar/answer/37118?co=GENIE.Platform%3DDesktop&hl=en

```
Usage: imap-ics-merge [options]

Options:
  -H, --host <url>            IMAP server host
  -u, --user <username>       IMAP server username
  -i, --input <folders...>    e-mail folders to read from (default: ["INBOX"])
  -o, --output <destination>  output file (.ics)
  -h, --help                  display help for command
```
