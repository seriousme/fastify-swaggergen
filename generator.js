// example of a code generator, this could be extended to include examples
// mocks etc

const swagger = require("./examples/petstore-swagger.v2.json");
const parser = require("./parserV2")();
const schemaID = "http://example.com/schemas/defs1";
const config = parser.parse(swagger, schemaID);

console.log(`
  // implementation of the operations in the swagger file

  class Service {
    constructor() {}

`);

config.routes.forEach(item => {
  console.log(`
    async ${item.operationId}(req, resp) {
      console.log("${item.operationId}", req.params);
      return { key: "value"};
    }

    `);
});

console.log(`
  }

  module.exports = config => new Service();
`);
