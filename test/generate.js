const swaggerSpec = require("./test-swagger.v2.json");
const generator = require("../generator");
const result = [];

const writer = item => result.push(item);

generator({
  swaggerSpec,
  writer
});

console.log(result.join("\n"));
