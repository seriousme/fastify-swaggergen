"use strict";

const port = 3000;
const fastify = require("fastify")();

const service = require("./service.js")();
const swagger = require("./examples/petstore-swagger.v2.json");
const parser = require("./parserV2")();
const config = parser.parse(swagger);
const routeConf = {};

// AJV misses some validators for int32, int64 etc which ajv-oai adds
const Ajv = require("ajv-oai");
const ajv = new Ajv({
  // the fastify defaults
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true
});

// fastify uses the built-in AJV instance during serialization, and that
// instance does not know about int32 and int64 so remove those formats
// from the responses
const unknownFormats = { int32: true, int64: true };

function stripResponseFormats(schema) {
  for (let item in schema) {
    if (typeof schema[item] === "object" && schema[item] !== null) {
      if (schema[item].format && unknownFormats[schema[item].format]) {
        schema[item].format = undefined;
      }
      stripResponseFormats(schema[item]);
    }
  }
}

function addRoutes(fastify, opts, next) {
  config.routes.forEach(item => {
    const response = item.schema.response;
    if (response) {
      stripResponseFormats(response);
    }
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

fastify.setSchemaCompiler(function(schema) {
  return ajv.compile(schema);
});

// fastify swagger does not overwrite the 'host' property, so we remove it here
config.generic.host = undefined;
// fastify swagger does not overwrite the 'basePath' property, but adds
// the prefix to the routes anyway, resulting in a double basePath in the url
// e.g. /v2/v2/pet  vs /v2/pet, so we remove 'basePath' here.
config.generic.basePath = undefined;

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
