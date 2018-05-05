const port = 3000;
const fastify = require("fastify")();
// {  logger: true }

const service = require("./services/index.js");

fastify.register(service);

// Run the server!
const start = async () => {
  try {
    await fastify.listen(port);
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
