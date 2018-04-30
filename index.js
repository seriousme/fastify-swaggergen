"use strict";

const port = 3000;
const fastify = require("fastify")();

const service = require("./service.js")();
const swagger = require("./examples/petstore-swagger.v2.json");
const parser = require("./parserV2")();
const schemaID = "http://example.com/schemas/defs1";
const config = parser.parse(swagger, schemaID);
const routeConf = {};

// AJV misses some validators for int32, int64 etc which ajv-oai adds
const Ajv = require("ajv-oai");
const ajv = new Ajv({
  // the fastify defaults
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true
});

function addRoutes(fastify, opts, next) {
  config.routes.forEach(item => {
    if (service[item.operationId]) {
      console.log("service has", item.operationId);
      item.handler = service[item.operationId];
    } else {
      item.handler = async (request, reply) => {
        throw new Error(`Operation ${item.operationId} not implemented`);
      };
    }
    fastify.route(item);
  });
  next();
}

ajv.addSchema(config.schema, schemaID);

fastify.setSchemaCompiler(function(schema) {
  return ajv.compile(schema);
});

fastify.register(require("fastify-swagger"), {
  swagger: config.generic,
  exposeRoute: true
});

if (config.prefix) {
  routeConf.prefix = config.prefix;
}

fastify.register(addRoutes, routeConf);

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
