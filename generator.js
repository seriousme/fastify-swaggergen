// example of a code generator, this could be extended to include examples
// mocks etc

const swagger = require("./examples/petstore-swagger.v2.json");
const jsYaml = require("js-yaml");
const parser = require("./parserV2")();
const schemaID = "http://example.com/schemas/defs1";
const config = parser.parse(swagger, schemaID);
console.log(JSON.stringify(config, null, 2));

function dumpItem(item) {
  let result = "";
  const headers = item.schema.headers;
  const params = item.schema.params;
  const body = item.schema.body;
  const responses = item.swaggerSource.responses;

  if (headers) result += commentize(headers, "req.headers:");
  if (params) result += commentize(params, "req.params:");
  if (body) result += commentize(body, "req.body:");
  if (responses) result += commentize(responses, "valid responses:");
  return result;
}

function commentize(data, label, spacing = "  ") {
  if (!data) return "";
  //const dataStrings = JSON.stringify(data, flatProps, 2).split("\n");
  const dataStrings = jsYaml.safeDump(data).split("\n");
  if (label) dataStrings.unshift(label);
  return (
    dataStrings
      .map((item, i) => (i > 0 ? "// " + spacing + item : "// " + item))
      .join("\n") + "\n"
  );
}

console.log(`
// implementation of the operations in the swagger file

class Service {
  constructor() {}

`);

config.routes.forEach(item => {
  console.log(`
// Operation: ${item.operationId}
// summary:  ${item.schema.summary}
${dumpItem(item)}

  async ${item.operationId}(req, resp) {
    console.log("${item.operationId}", req.params);
    return { key: "value"};
  }`);
});

console.log(`
}

module.exports = config => new Service();
`);
