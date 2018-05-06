// a class for parsing swagger V2 data into config data for fastify

class parserV2 {
  constructor() {
    this.config = { generic: {}, routes: [] };
    this.schemaStore = {};
  }

  resolveRef(ref) {
    const [id, path] = ref.split("#");
    const schema = this.schemaStore[id];
    if (schema === undefined) {
      throw new Error(`Schema with id '${id}' not found`);
    }
    const components = path.split("/").slice(1);
    const reducer = (accumulator, currentValue) => accumulator[currentValue];
    const result = components.reduce(reducer, schema);
    if (result === undefined) {
      throw new Error(`Can't deference schema $ref '${ref}'`);
    }
    return result;
  }

  resolveRefs(schema) {
    for (let item in schema) {
      const thisItem = schema[item];
      if (typeof thisItem === "object" && thisItem !== null) {
        if (thisItem.$ref) {
          schema[item] = this.resolveRef(thisItem.$ref);
        }
        this.resolveRefs(schema[item]);
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

  makeURL(path) {
    // fastify wants 'path/:param' instead of swaggers 'path/{param}'
    return path.replace(/{(\w+)}/g, ":$1");
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

  parseResponses(responses) {
    const result = {};
    let hasResponse = false;
    for (let httpCode in responses) {
      if (responses[httpCode].schema !== undefined) {
        result[httpCode] = responses[httpCode].schema;
        hasResponse = true;
      }
    }
    return hasResponse ? result : null;
  }

  makeSchema(data) {
    const schema = {};
    const copyItems = [
      "tags",
      "summary",
      "description",
      "operationId",
      "produces",
      "consumes",
      "deprecated"
    ];
    this.copyProps(data, schema, copyItems);
    if (data.parameters) {
      this.parseParameters(schema, data.parameters);
    }
    if (data.responses) {
      const response = this.parseResponses(data.responses);
      if (response) {
        schema.response = response;
      }
    }
    return schema;
  }

  processOperation(base, path, operation, data) {
    const route = {
      method: operation.toUpperCase(),
      url: this.makeURL(path),
      schema: this.makeSchema(data),
      operationId: data.operationId || this.makeOperationId(operation, path),
      swaggerSource: data
    };
    this.config.routes.push(route);
  }

  processPaths(base, paths) {
    for (let path in paths) {
      for (let operation in paths[path]) {
        this.processOperation(base, path, operation, paths[path][operation]);
      }
    }
  }

  addSchema(schema, label) {
    const id = label || schema["$id"] || "";
    if (this.schemaStore[id] !== undefined) {
      throw new Error(`Schema with id '${id}' already declared!`);
    }
    this.schemaStore[id] = schema;
  }

  parse(swagger, schemaID) {
    for (let item in swagger) {
      switch (item) {
        case "paths":
          this.processPaths(swagger.basePath, swagger.paths);
          break;
        case "definitions":
          this.addSchema({ definitions: swagger.definitions });
        default:
          this.config.generic[item] = swagger[item];
          if (item === "basePath") {
            this.config.prefix = swagger[item];
          }
      }
    }
    // schema refs need to be resolved
    this.resolveRefs(this.config.routes);
    return this.config;
  }
}

module.exports = config => new parserV2(config);
