const swaggerSpec = require("./fastify-swaggergen/examples/petstore-swagger.v2.json");
const generator = require("./fastify-swaggergen/generator");
const result = [];

const writer = item => result.push(item);

generator({
  swaggerSpec,
  writer
});

console.log(result.join("\n"));
