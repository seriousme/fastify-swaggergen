// a class for parsing swagger V2 data into config data for fastify

class parserV2 {
  constructor() {
    this.config = { generic: {}, routes: [] };
    this.schemaID = "http://example.com/schemas/defs";
  }

  fixRefs(schema) {
    for (let item in schema) {
      const thisItem = schema[item];
      if (typeof thisItem === "object" && thisItem !== null) {
        if (thisItem.$ref) {
          if (thisItem.$ref.match(/^#/)) {
            thisItem.$ref = this.schemaID + thisItem.$ref;
          }
        }
        this.fixRefs(thisItem);
      }
    }
  }

  makeOperationId(operation, path) {
    // make a nice camelCase operationID
    // e.g. get /user/{name}  becomes getUserByName
    const firstUpper = str => str.substr(0, 1).toUpperCase() + str.substr(1);
    const by = (matched, p1) => "By" + firstUpper(p1);
    const parts = path.split("/").slice(1);
    const opId = parts
      .map((item, i) => (i > 0 ? firstUpper(item) : item))
      .join("")
      .replace(/{(\w+)}/g, by)
      .replace(/[^a-z]/gi, "");
    return opId;
  }

  makeURL(base, path) {
    // fastify wants 'path/:param' instead of swaggers 'path/{param}'
    return path.replace(/{(\w+)}/g, ":$1");
    // add basePath if present, might alternatively solve this using { prefix: basePath }
    // return base ? base + newPath : newPath;
  }

  copyProps(source, target, list) {
    list.forEach(item => {
      if (source[item]) target[item] = source[item];
    });
  }

  parseParams(data) {
    const params = {
      type: "object",
      properties: {}
    };
    const required = [];
    data.forEach(item => {
      params.properties[item.name] = {};
      this.copyProps(item, params.properties[item.name], [
        "type",
        "description"
      ]);
      // ajv wants "required" to be an array, which seems to be too strict
      // see https://github.com/json-schema/json-schema/wiki/Properties-and-required
      if (item.required) {
        required.push(item.name);
      }
    });
    if (required.length > 0) {
      params.required = required;
    }
    return params;
  }

  parseParameters(schema, data) {
    const params = [];
    const querystring = [];
    const headers = [];
    data.forEach(item => {
      switch (item.in) {
        case "body":
          if (item.schema) schema.body = item.schema;
          break;
        case "formData":
          if (item.schema) {
            schema.body = item.schema;
            schema.body.contentType = "application/x-www-form-urlencoded";
          }
          break;
        case "path":
          params.push(item);
          break;
        case "query":
          querystring.push(item);
          break;
        case "header":
          headers.push(item);
          break;
        default:
          console.log(`unknown parameter type ${item.in}`);
      }
    });
    if (params.length > 0) schema.params = this.parseParams(params);
    if (querystring.length > 0)
      schema.querystring = this.parseParams(querystring);
    if (headers.length > 0) schema.headers = this.parseParams(headers);
  }

  makeSchema(data) {
    const schema = {};
    const copyItems = [
      "tags",
      "summary",
      "description",
      "operationId",
      "produces",
      "consumes"
    ];
    this.copyProps(data, schema, copyItems);
    if (data.parameters) {
      this.parseParameters(schema, data.parameters);
    }
    if (data.responses) {
      schema.responses = data.responses;
    }
    return schema;
  }

  processOperation(base, path, operation, data) {
    const route = {
      method: operation.toUpperCase(),
      url: this.makeURL(base, path),
      schema: this.makeSchema(data),
      operationId: data.operationId || this.makeOperationId(operation, path)
    };
    // schema refs need to be fixed from local schema to remote
    this.fixRefs(route);
    this.config.routes.push(route);
  }

  processPaths(base, paths) {
    for (let path in paths) {
      for (let operation in paths[path]) {
        this.processOperation(base, path, operation, paths[path][operation]);
      }
    }
  }

  processDefs(definitions) {
    this.config.schema = {
      schemaid: this.schemaID,
      definitions
    };
  }

  parse(swagger, schemaID) {
    this.schemaID = schemaID;
    for (let item in swagger) {
      if (item === "paths") {
        this.processPaths(swagger.basePath, swagger.paths);
      } else if (item === "definitions") {
        this.processDefs(swagger.definitions);
      } else {
        this.config.generic[item] = swagger[item];
        if (item === "basePath") {
          this.config.prefix = swagger[item];
        }
      }
    }
    return this.config;
  }
}

module.exports = config => new parserV2(config);
