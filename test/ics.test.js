const test = require("node:test");
const assert = require("node:assert/strict");
const { renderEventIcs, reminderMinutesToTrigger } = require("../src/ics");

test("reminderMinutesToTrigger formats days, hours, and minutes", () => {
  assert.equal(reminderMinutesToTrigger(1440), "-P1D");
  assert.equal(reminderMinutesToTrigger(120), "-PT2H");
  assert.equal(reminderMinutesToTrigger(15), "-PT15M");
});

test("renderEventIcs includes alarms and escaped text", () => {
  const ics = renderEventIcs({
    uid: "abc@example.com",
    createdAt: "2026-05-22T12:00:00.000Z",
    startAt: "2026-05-23T07:00:00.000Z",
    endAt: "2026-05-23T08:00:00.000Z",
    title: "Launch, Sync",
    description: "Line1\nLine2",
    location: "Office;Room 2",
    reminderMinutes: [10, 1440],
  });

  assert.match(ics, /SUMMARY:Launch\\, Sync/);
  assert.match(ics, /DESCRIPTION:Line1\\nLine2/);
  assert.match(ics, /LOCATION:Office\\;Room 2/);
  assert.match(ics, /TRIGGER:-PT10M/);
  assert.match(ics, /TRIGGER:-P1D/);
});
