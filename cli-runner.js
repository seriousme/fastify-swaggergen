// haven't figured out yet how to pass custom options to fastify-cli
// so for now we'll use a workaround
const plugin = require("./index.js");

const options = {
  swaggerSpec: `${__dirname}/examples/petstore/petstore-swagger.v2.json`,
  service: `${__dirname}/examples/petstore/service.js`,
  fastifySwagger: {
    disabled: false
  }
};

module.exports = async function(fastify, opts) {
  fastify.register(plugin, options);
};
