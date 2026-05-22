function escapeICSText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatUtcTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function foldLine(line) {
  const chunks = [];
  let remaining = line;

  while (remaining.length > 75) {
    chunks.push(remaining.slice(0, 75));
    remaining = ` ${remaining.slice(75)}`;
  }

  chunks.push(remaining);
  return chunks.join("\r\n");
}

function reminderMinutesToTrigger(minutes) {
  const dayMinutes = 1440;
  if (minutes % dayMinutes === 0) {
    return `-P${minutes / dayMinutes}D`;
  }

  const hourMinutes = 60;
  if (minutes % hourMinutes === 0) {
    return `-PT${minutes / hourMinutes}H`;
  }

  return `-PT${minutes}M`;
}

function renderEventIcs(event) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IcsServer//Single Event//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeICSText(event.uid)}`,
    `DTSTAMP:${formatUtcTimestamp(new Date(event.createdAt))}`,
    `DTSTART:${formatUtcTimestamp(new Date(event.startAt))}`,
    `DTEND:${formatUtcTimestamp(new Date(event.endAt))}`,
    `SUMMARY:${escapeICSText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICSText(event.location)}`);
  }

  for (const minutes of event.reminderMinutes) {
    lines.push("BEGIN:VALARM");
    lines.push("ACTION:DISPLAY");
    lines.push(`TRIGGER:${reminderMinutesToTrigger(minutes)}`);
    lines.push("DESCRIPTION:Reminder");
    lines.push("END:VALARM");
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

module.exports = {
  escapeICSText,
  formatUtcTimestamp,
  reminderMinutesToTrigger,
  renderEventIcs,
};
