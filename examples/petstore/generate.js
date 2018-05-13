const swaggerSpec = require("./petstore-swagger.v2.json");
const gen = require("../../lib/generator")({ swaggerSpec });
const result = [];

const writer = item => {
  result.push(item);
};

gen.generate(writer);
console.log(result.join("\n"));
