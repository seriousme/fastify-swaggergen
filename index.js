const fp = require("fastify-plugin");
const parser = require("./lib/parser");

function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}

function getObject(param) {
  let data = param;
  if (typeof param === "string") {
    try {
      data = require(param);
    } catch (error) {
      throw new Error(`failed to load ${param}`);
    }
  }
  if (typeof data === "function") {
    data = data();
  }

  return data;
}

// fastify uses the built-in AJV instance during serialization, and that
// instance does not know about int32 and int64 so remove those formats
// from the responses
const unknownFormats = { int32: true, int64: true };

function stripResponseFormats(schema) {
  for (let item in schema) {
    if (isObject(schema[item])) {
      if (schema[item].format && unknownFormats[schema[item].format]) {
        schema[item].format = undefined;
      }
      stripResponseFormats(schema[item]);
    }
  }
}

async function fastifySwaggerGen(instance, opts) {
  if (!isObject(opts)) opts = {};
  if (!isObject(opts.fastifySwagger)) opts.fastifySwagger = {};

  const SwaggerUI = !opts.fastifySwagger.disabled;

  const service = getObject(opts.service);
  if (!isObject(service)) {
    throw new Error("'service' parameter must refer to an object");
  }

  const config = await parser().parse(opts.swaggerSpec);
  const routeConf = {};

  // AJV misses some validators for int32, int64 etc which ajv-oai adds
  const Ajv = require("ajv-oai");
  const ajv = new Ajv({
    // the fastify defaults
    removeAdditional: true,
    useDefaults: true,
    coerceTypes: true
  });

  instance.setSchemaCompiler(schema => ajv.compile(schema));

  // fastify swagger does not overwrite the 'host' property, so we remove it here
  config.generic.host = undefined;
  // fastify swagger does not overwrite the 'basePath' property, but adds
  // the prefix to the routes anyway, resulting in a double basePath in the url
  // e.g. /v2/v2/pet  vs /v2/pet, so we remove 'basePath' here.
  config.generic.basePath = undefined;

  if (config.prefix) {
    routeConf.prefix = config.prefix;
  }

  async function generateRoutes(routesInstance, opts) {
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
  }

  if (SwaggerUI) {
    const fastifySwagger = require("fastify-swagger");
    const swaggerOpts = Object.assign(
      {
        swagger: config.generic,
        exposeRoute: true
      },
      opts.fastifySwagger
    );
    instance.register(fastifySwagger, swaggerOpts);
  }
  instance.register(generateRoutes, routeConf);
}

module.exports = fp(fastifySwaggerGen, {
  fastify: ">=0.39.0",
  name: "fastify-swaggergen"
});

module.exports.options = {
  swaggerSpec: "examples/petstore/petstore-swagger.v2.json",
  service: "examples/petstore/service.js",
  fastifySwagger: {
    disabled: false
  }
};
