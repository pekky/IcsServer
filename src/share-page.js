function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEventTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function renderSharePage(event, urls) {
  const title = escapeHtml(event.title);
  const description = event.description ? escapeHtml(event.description) : "";
  const location = event.location ? escapeHtml(event.location) : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f3f0e8;
        --panel: #fffdf8;
        --ink: #1d2a22;
        --muted: #5a655f;
        --accent: #0f766e;
        --accent-2: #d97706;
        --line: rgba(29, 42, 34, 0.12);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: Georgia, "Times New Roman", serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(217, 119, 6, 0.18), transparent 30%),
          linear-gradient(180deg, #faf7f0 0%, var(--bg) 100%);
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .card {
        width: min(680px, 100%);
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 28px;
        box-shadow: 0 24px 60px rgba(29, 42, 34, 0.08);
      }
      .eyebrow {
        margin: 0 0 10px;
        font: 600 12px/1.1 ui-monospace, SFMono-Regular, Menlo, monospace;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--accent);
      }
      h1 {
        margin: 0;
        font-size: clamp(2rem, 5vw, 3.25rem);
        line-height: 0.95;
      }
      .meta {
        margin: 22px 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 10px;
      }
      .meta li {
        color: var(--muted);
        font-size: 1rem;
      }
      .meta strong {
        color: var(--ink);
      }
      .actions {
        display: grid;
        gap: 12px;
        margin-top: 28px;
      }
      .button {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        min-height: 52px;
        padding: 0 18px;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 700;
      }
      .button-primary {
        background: var(--accent);
        color: white;
      }
      .button-secondary {
        background: transparent;
        color: var(--ink);
        border: 1px solid var(--line);
      }
      .note {
        margin-top: 16px;
        color: var(--muted);
        font-size: 0.95rem;
      }
      .description {
        margin-top: 18px;
        color: var(--ink);
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <p class="eyebrow">Apple Calendar Import</p>
      <h1>${title}</h1>
      <ul class="meta">
        <li><strong>Starts:</strong> ${escapeHtml(formatEventTime(event.startAt))}</li>
        <li><strong>Ends:</strong> ${escapeHtml(formatEventTime(event.endAt))}</li>
        ${
          location
            ? `<li><strong>Location:</strong> ${location}</li>`
            : ""
        }
      </ul>
      ${
        description
          ? `<p class="description">${description}</p>`
          : ""
      }
      <div class="actions">
        <a class="button button-primary" href="${escapeHtml(urls.icsUrl)}">Add To Apple Calendar</a>
        <a class="button button-secondary" href="${escapeHtml(urls.icsUrl)}">Download Or Open ICS</a>
      </div>
      <p class="note">If your chat client opens an in-app browser first, use the main button above to continue into Calendar.</p>
    </main>
  </body>
</html>`;
}

module.exports = { renderSharePage };
