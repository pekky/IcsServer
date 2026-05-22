const { getConfig } = require("./config");
const { createEventStore } = require("./db");
const { createApp, startServer } = require("./server");

async function main() {
  const config = getConfig();
  const store = createEventStore(config.databasePath, config.baseUrl);
  const handler = createApp({
    store,
    baseUrl: config.baseUrl,
  });

  const server = await startServer({
    port: config.port,
    handler,
  });

  console.log(`ICS service listening on ${config.port}`);

  const shutdown = () => {
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
