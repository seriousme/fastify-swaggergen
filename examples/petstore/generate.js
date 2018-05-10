const swaggerSpec = require("petstore-swagger.v2.json");
const generator = require("../../lib/generator");
const result = [];

const writer = item => result.push(item);

generator({
  swaggerSpec,
  writer
});

console.log(result.join("\n"));
