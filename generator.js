// example of a code generator, this could be extended to include examples
// mocks etc

const jsYaml = require("js-yaml");
const parser = require("./parser.v2")();

function jsonPath(obj, path) {
  const components = path.split("/").slice(1);
  const reducer = (accumulator, currentValue) => accumulator[currentValue];
  return components.reduce(reducer, obj);
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

function stringifyItem(item) {
  let result = "";
  const headers = item.schema.headers;
  const params = item.schema.params;
  const query = item.schema.querystring;
  const body = item.schema.body;
  const responses = item.swaggerSource.responses;

  if (headers) result += commentize(headers, "req.headers:");
  if (params) result += commentize(params, "req.params:");
  if (query) result += commentize(query, "req.query:");
  if (body) result += commentize(body, "req.body:");
  if (responses) result += commentize(responses, "valid responses:");
  return result;
}

function generator(opts = {}) {
  const swagger = jsonPath(opts, "/swaggerSpec");
  const version = jsonPath(opts, "/swaggerSpec/swagger");
  if (typeof swagger !== "object" || version !== "2.0") {
    next(
      new Error(
        "'swaggerSpec' parameter must contain a swagger version 2.0 specification object"
      )
    );
  }
  const config = parser.parse(swagger);
  const write = opts.writer || console.log;

  write(`// implementation of the operations in the swagger file

class Service {
  constructor() {}

`);

  config.routes.forEach(item => {
    write(`
// Operation: ${item.operationId}
// summary:  ${item.schema.summary}
${stringifyItem(item)}

  async ${item.operationId}(req, reply) {
    console.log("${item.operationId}", req.params);
    return { key: "value"};
  }`);
  });

  write(`
}

module.exports = opts => new Service(opts);
`);
}

module.exports = generator;
