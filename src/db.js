const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function createEventStore(databasePath, baseUrl) {
  ensureParentDirectory(databasePath);
  const db = new DatabaseSync(databasePath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      uid TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      timezone TEXT,
      reminder_minutes_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
  `);

  const insertStmt = db.prepare(`
    INSERT INTO events (
      id, uid, title, description, location, start_at, end_at, timezone,
      reminder_minutes_json, status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?
    )
  `);

  const findStmt = db.prepare(`
    SELECT
      id, uid, title, description, location, start_at, end_at, timezone,
      reminder_minutes_json, status, created_at, updated_at
    FROM events
    WHERE id = ? AND status = 'active'
  `);

  function mapRow(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      uid: row.uid,
      title: row.title,
      description: row.description,
      location: row.location,
      startAt: row.start_at,
      endAt: row.end_at,
      timezone: row.timezone,
      reminderMinutes: JSON.parse(row.reminder_minutes_json),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  return {
    createEvent(input) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const uid = `${id}@${new URL(baseUrl).hostname}`;

      insertStmt.run(
        id,
        uid,
        input.title,
        input.description,
        input.location,
        input.start.toISOString(),
        input.end.toISOString(),
        input.timezone,
        JSON.stringify(input.reminderMinutes),
        now,
        now
      );

      return this.getEventById(id);
    },

    getEventById(id) {
      return mapRow(findStmt.get(id));
    },
  };
}

module.exports = { createEventStore };
