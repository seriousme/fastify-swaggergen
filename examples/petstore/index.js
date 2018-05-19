// a fastify plugin do demo fastify-swaggergen
// it can be run as plugin on any fastify server
// or standalone using "fastify start plugin.js"
const swaggerGen = require("../../index.js");

const options = {
  swaggerSpec: `${__dirname}/petstore-swagger.v2.json`,
  service: `${__dirname}/service.js`,
  fastifySwagger: {
    disabled: false
  }
};

module.exports = async function(fastify, opts) {
  fastify.register(swaggerGen, options);
};
