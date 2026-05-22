const test = require("node:test");
const assert = require("node:assert/strict");
const { validateCreateEventPayload } = require("../src/validation");

test("validateCreateEventPayload normalizes valid payloads", () => {
  const result = validateCreateEventPayload({
    title: " Team Sync ",
    description: " Discuss launch ",
    location: " Room 2 ",
    start: "2026-05-23T15:00:00+08:00",
    end: "2026-05-23T16:00:00+08:00",
    reminderMinutes: [1440, 10],
  });

  assert.equal(result.title, "Team Sync");
  assert.equal(result.description, "Discuss launch");
  assert.equal(result.location, "Room 2");
  assert.deepEqual(result.reminderMinutes, [10, 1440]);
});

test("validateCreateEventPayload rejects more than 2 reminders", () => {
  assert.throws(
    () =>
      validateCreateEventPayload({
        title: "Demo",
        start: "2026-05-23T15:00:00+08:00",
        end: "2026-05-23T16:00:00+08:00",
        reminderMinutes: [5, 10, 15],
      }),
    /at most 2 items/
  );
});
