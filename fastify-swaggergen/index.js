"use strict";

const fp = require("fastify-plugin");

function jsonPath(obj, path) {
  const components = path.split("/").slice(1);
  const reducer = (accumulator, currentValue) => accumulator[currentValue];
  return components.reduce(reducer, obj);
}

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

function fastifySwaggerGen(instance, opts = {}, next) {
  const swagger = jsonPath(opts, "/swaggerSpec");
  const version = jsonPath(opts, "/swaggerSpec/swagger");
  const service = jsonPath(opts, "/service");
  if (typeof swagger !== "object" || version !== "2.0") {
    next(
      new Error(
        "'swaggerSpec' parameter must contain a swagger version 2.0 specification object"
      )
    );
  }

  console.log("typeof service", typeof service);

  if (typeof service !== "object") {
    next(new Error("'service' parameter refer to an object"));
  }

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

  instance.setSchemaCompiler(function (schema) {
    return ajv.compile(schema);
  });

  // fastify swagger does not overwrite the 'host' property, so we remove it here
  config.generic.host = undefined;
  // fastify swagger does not overwrite the 'basePath' property, but adds
  // the prefix to the routes anyway, resulting in a double basePath in the url
  // e.g. /v2/v2/pet  vs /v2/pet, so we remove 'basePath' here.
  config.generic.basePath = undefined;

  if (config.prefix) {
    routeConf.prefix = config.prefix;
  }

  function addRoutes(routesInstance, opts, next) {
    config.routes.forEach(item => {
      const response = item.schema.response;
      if (response) {
        stripResponseFormats(response);
      }
      if (service[item.operationId]) {
        routesInstance.log.debug("service has", item.operationId);
        item.handler = service[item.operationId];
      } else {
        item.handler = async (request, reply) => {
          throw new Error(`Operation ${item.operationId} not implemented`);
        };
      }
      routesInstance.route(item);
    });
    next();
  }

  instance.register(addRoutes, routeConf);
  instance.decorate("swaggerGenericInfo", config.generic);
  next();
}

module.exports = fp(fastifySwaggerGen, {
  fastify: ">=0.39.0",
  name: "fastify-swaggergen"
});
