const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { Readable, Writable } = require("node:stream");
const { createEventStore } = require("../src/db");
const { createApp } = require("../src/server");

class MockResponse extends Writable {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.chunks = [];
  }

  writeHead(statusCode, headers) {
    this.statusCode = statusCode;
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  _write(chunk, encoding, callback) {
    this.chunks.push(Buffer.from(chunk));
    callback();
  }

  end(chunk) {
    if (chunk) {
      this.chunks.push(Buffer.from(chunk));
    }
    this.finished = true;
    super.end();
  }

  text() {
    return Buffer.concat(this.chunks).toString("utf8");
  }

  json() {
    return JSON.parse(this.text());
  }
}

function createRequest({ method, url, body }) {
  const request = Readable.from(body ? [Buffer.from(body)] : []);
  request.method = method;
  request.url = url;
  request.headers = body
    ? { "content-type": "application/json" }
    : {};
  return request;
}

async function invoke(handler, { method, url, jsonBody }) {
  const request = createRequest({
    method,
    url,
    body: jsonBody ? JSON.stringify(jsonBody) : "",
  });
  const response = new MockResponse();

  await handler(request, response);
  return response;
}

function createTestHandler() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ics-server-test-"));
  const store = createEventStore(
    path.join(tempDir, "events.db"),
    "https://calendar.example.com"
  );

  return createApp({
    store,
    baseUrl: "https://calendar.example.com",
  });
}

test("POST /v1/events creates an event and returns links", async () => {
  const handler = createTestHandler();
  const response = await invoke(handler, {
    method: "POST",
    url: "/v1/events",
    jsonBody: {
      title: "Planning Session",
      start: "2026-05-23T15:00:00+08:00",
      end: "2026-05-23T16:00:00+08:00",
      reminderMinutes: [10],
    },
  });

  assert.equal(response.statusCode, 201);
  const body = response.json();
  assert.ok(body.id);
  assert.equal(
    body.icsUrl,
    `https://calendar.example.com/v1/events/${body.id}.ics`
  );
  assert.equal(body.shareUrl, `https://calendar.example.com/share/${body.id}`);
});

test("GET /v1/events/:id.ics returns calendar content", async () => {
  const handler = createTestHandler();
  const createResponse = await invoke(handler, {
    method: "POST",
    url: "/v1/events",
    jsonBody: {
      title: "Weekly Review",
      description: "Review metrics",
      start: "2026-05-23T15:00:00+08:00",
      end: "2026-05-23T16:00:00+08:00",
      reminderMinutes: [10, 1440],
    },
  });
  const created = createResponse.json();

  const response = await invoke(handler, {
    method: "GET",
    url: `/v1/events/${created.id}.ics`,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["Content-Type"], "text/calendar; charset=utf-8");
  const ics = response.text();
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /SUMMARY:Weekly Review/);
  assert.match(ics, /TRIGGER:-PT10M/);
  assert.match(ics, /TRIGGER:-P1D/);
});

test("GET /share/:id returns HTML", async () => {
  const handler = createTestHandler();
  const createResponse = await invoke(handler, {
    method: "POST",
    url: "/v1/events",
    jsonBody: {
      title: "Design Review",
      start: "2026-05-23T15:00:00+08:00",
      end: "2026-05-23T16:00:00+08:00",
    },
  });
  const created = createResponse.json();

  const response = await invoke(handler, {
    method: "GET",
    url: `/share/${created.id}`,
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.headers["Content-Type"], /^text\/html/);
  assert.match(response.text(), /Add To Apple Calendar/);
});
