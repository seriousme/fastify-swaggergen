// the service of service.js encapsulated in a fastify plugin
const fp = require("fastify-plugin");
const fsw = require("fastify-swagger");
const swaggerGen = require("../fastify-swaggergen/index.js");
const swaggerSpec = require("./swagger.json");
const service = require("./service.js")();

function fastifySwaggerService(instance, opts = {}, next) {
  const newSwaggerGenOpts = Object.assign(
    {
      swaggerSpec,
      service
    },
    opts.fastifySwaggerGen
  );

  instance.register(swaggerGen, newSwaggerGenOpts, next);

  const newSwaggerOpts = Object.assign(
    {
      swagger: instance.swaggerGenericInfo,
      exposeRoute: true
    },
    opts.fastifySwagger
  );
  instance.register(fsw, newSwaggerOpts);
  next();
}

module.exports = fp(fastifySwaggerService, {
  fastify: ">=0.39.0",
  name: "swaggerservice"
});
