const MAX_REMINDERS = 2;
const MAX_REMINDER_MINUTES = 525600;

function validationError(message, details = {}) {
  const error = new Error(message);
  error.name = "ValidationError";
  error.statusCode = 400;
  error.details = details;
  return error;
}

function parseDateInput(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw validationError(`${fieldName} must be a non-empty ISO 8601 string`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw validationError(`${fieldName} must be a valid ISO 8601 datetime`);
  }

  return date;
}

function normalizeOptionalString(value, fieldName) {
  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    throw validationError(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeReminderMinutes(value) {
  if (value == null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw validationError("reminderMinutes must be an array of integers");
  }

  if (value.length > MAX_REMINDERS) {
    throw validationError(`reminderMinutes supports at most ${MAX_REMINDERS} items`);
  }

  const normalized = value.map((minutes, index) => {
    if (!Number.isInteger(minutes)) {
      throw validationError(`reminderMinutes[${index}] must be an integer`);
    }
    if (minutes <= 0) {
      throw validationError(`reminderMinutes[${index}] must be greater than 0`);
    }
    if (minutes > MAX_REMINDER_MINUTES) {
      throw validationError(
        `reminderMinutes[${index}] must not exceed ${MAX_REMINDER_MINUTES}`
      );
    }
    return minutes;
  });

  const deduped = [...new Set(normalized)];
  if (deduped.length !== normalized.length) {
    throw validationError("reminderMinutes must not contain duplicates");
  }

  return deduped.sort((a, b) => a - b);
}

function validateCreateEventPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw validationError("Request body must be a JSON object");
  }

  const title = normalizeOptionalString(payload.title, "title");
  if (!title) {
    throw validationError("title is required");
  }

  const start = parseDateInput(payload.start, "start");
  const end = parseDateInput(payload.end, "end");

  if (start >= end) {
    throw validationError("start must be earlier than end");
  }

  return {
    title,
    description: normalizeOptionalString(payload.description, "description"),
    location: normalizeOptionalString(payload.location, "location"),
    timezone: normalizeOptionalString(payload.timezone, "timezone"),
    start,
    end,
    reminderMinutes: normalizeReminderMinutes(payload.reminderMinutes),
  };
}

module.exports = {
  MAX_REMINDERS,
  MAX_REMINDER_MINUTES,
  validationError,
  validateCreateEventPayload,
};
