const path = require("node:path");

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function getConfig() {
  const port = Number.parseInt(process.env.PORT || "3000", 10);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  const baseUrl = stripTrailingSlash(
    process.env.BASE_URL || `http://localhost:${port}`
  );

  return {
    port,
    baseUrl,
    databasePath:
      process.env.DATABASE_PATH ||
      path.join(process.cwd(), "data", "events.db"),
  };
}

module.exports = { getConfig };
