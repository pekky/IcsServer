const http = require("node:http");
const { URL } = require("node:url");
const { renderEventIcs } = require("./ics");
const { renderSharePage } = require("./share-page");
const { validateCreateEventPayload } = require("./validation");

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function notFound(response) {
  json(response, 404, {
    error: {
      code: "not_found",
      message: "Resource not found",
    },
  });
}

function sendError(response, error) {
  const statusCode = error.statusCode || 500;
  const payload = {
    error: {
      code: statusCode === 400 ? "validation_error" : "internal_error",
      message:
        statusCode === 500 ? "Internal server error" : error.message,
    },
  };

  if (error.details && statusCode === 400) {
    payload.error.details = error.details;
  }

  json(response, statusCode, payload);
}

function buildEventUrls(baseUrl, eventId) {
  return {
    icsUrl: `${baseUrl}/v1/events/${eventId}.ics`,
    shareUrl: `${baseUrl}/share/${eventId}`,
  };
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString("utf8");
  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Request body must be valid JSON");
    error.statusCode = 400;
    throw error;
  }
}

function createApp({ store, baseUrl }) {
  return async function handler(request, response) {
    try {
      const requestUrl = new URL(request.url, "http://localhost");
      const pathname = requestUrl.pathname;

      if (request.method === "GET" && pathname === "/healthz") {
        return json(response, 200, { ok: true });
      }

      if (request.method === "POST" && pathname === "/v1/events") {
        const payload = await readJsonBody(request);
        const validated = validateCreateEventPayload(payload);
        const event = store.createEvent(validated);
        const urls = buildEventUrls(baseUrl, event.id);
        return json(response, 201, {
          id: event.id,
          uid: event.uid,
          title: event.title,
          reminderMinutes: event.reminderMinutes,
          ...urls,
        });
      }

      const icsMatch = pathname.match(/^\/v1\/events\/([a-f0-9-]+)\.ics$/);
      if (request.method === "GET" && icsMatch) {
        const event = store.getEventById(icsMatch[1]);
        if (!event) {
          return notFound(response);
        }

        response.writeHead(200, {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `inline; filename="${event.id}.ics"`,
          "Cache-Control": "public, max-age=300",
        });
        response.end(renderEventIcs(event));
        return;
      }

      const shareMatch = pathname.match(/^\/share\/([a-f0-9-]+)$/);
      if (request.method === "GET" && shareMatch) {
        const event = store.getEventById(shareMatch[1]);
        if (!event) {
          return notFound(response);
        }

        response.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        });
        response.end(renderSharePage(event, buildEventUrls(baseUrl, event.id)));
        return;
      }

      return notFound(response);
    } catch (error) {
      return sendError(response, error);
    }
  };
}

function startServer({ port, handler }) {
  const server = http.createServer(handler);
  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

module.exports = {
  buildEventUrls,
  createApp,
  startServer,
};
