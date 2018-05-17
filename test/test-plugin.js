const t = require("tap");
const test = t.test;
const Fastify = require("fastify");
const fastifySwaggerGen = require("../index");

const swaggerSpec = require("./test-swagger.v2.json");
const petStoreSpec = require("./petstore-swagger.v2.json");
const serviceFile = `${__dirname}/service.js`;
const swaggerInfoFile = `${__dirname}/test-swagger-info.v2.json`;
const swaggerSpecYAML = `${__dirname}/test-swagger.v2.yaml`;
const service = require(serviceFile);
const swaggerInfo = require(swaggerInfoFile);
const opts = {
  swaggerSpec,
  service
};

const yamlOpts = {
  swaggerSpec: swaggerSpecYAML,
  service,
  fastifySwagger: {
    disabled: true
  }
};

const invalidSwaggerOpts = {
  swaggerSpec: { valid: false },
  service
};

const invalidServiceOpts = {
  swaggerSpec: swaggerSpecYAML,
  service: null
};

const missingServiceOpts = {
  swaggerSpec: swaggerSpecYAML,
  service: `${__dirname}/not-a-valid-service.js`
};

const infoOpts = {
  swaggerSpec: swaggerInfoFile,
  service: serviceFile
};

const petStoreOpts = {
  swaggerSpec: petStoreSpec,
  service
};

test("fastify-swagger registered correctly", t => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifySwaggerGen, infoOpts);

  fastify.inject(
    {
      method: "GET",
      url: "/documentation/json"
    },
    (err, res) => {
      t.error(err);

      var payload = JSON.parse(res.payload);
      // compensate for the behavior of fastify-swagger
      payload.paths = {};
      // payload.basePath = "/v2";
      payload.host = "localhost";
      t.strictSame(payload, swaggerInfo, "swagger object as expected");
    }
  );
});

test("path parameters work", t => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifySwaggerGen, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/v2/pathParam/2"
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 200);
    }
  );
});

test("query parameters work", t => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifySwaggerGen, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/v2/queryParam?int1=1&int2=2"
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 200);
    }
  );
});

test("header parameters work", t => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifySwaggerGen, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/v2/headerParam",
      headers: {
        "X-Request-ID": "test data"
      }
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 200);
    }
  );
});

test("body parameters work", t => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifySwaggerGen, opts);

  fastify.inject(
    {
      method: "post",
      url: "/v2/bodyParam",
      payload: { str1: "test data" }
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 200);
    }
  );
});

test("missing operation from service returns error 500", t => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifySwaggerGen, opts);

  fastify.inject(
    {
      method: "get",
      url: "/v2/noOperationId/1"
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 500);
    }
  );
});

test("response schema works with valid response", t => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifySwaggerGen, opts);

  fastify.inject(
    {
      method: "get",
      url: "/v2/responses?replyType=valid"
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 200);
    }
  );
});

test("response schema works with invalid response", t => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifySwaggerGen, opts);

  fastify.inject(
    {
      method: "get",
      url: "/v2/responses?replyType=invalid"
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 500);
    }
  );
});

test("yaml spec works", t => {
  t.plan(2);
  const fastify = Fastify();
  fastify.register(fastifySwaggerGen, yamlOpts);

  fastify.inject(
    {
      method: "GET",
      url: "/v2/pathParam/2"
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 200);
    }
  );
});

test("invalid swagger specification throws error ", t => {
  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifySwaggerGen, invalidSwaggerOpts);
  fastify.ready(err => {
    if (err) {
      t.equal(
        err.message,
        "'swaggerSpec' parameter must contain a swagger version 2.0 specification",
        "got expected error"
      );
    } else {
      t.fail("missed expected error");
    }
  });
});

test("missing service definition throws error ", t => {
  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifySwaggerGen, invalidServiceOpts);
  fastify.ready(err => {
    if (err) {
      t.equal(
        err.message,
        "'service' parameter must refer to an object",
        "got expected error"
      );
    } else {
      t.fail("missed expected error");
    }
  });
});

test("invalid service definition throws error ", t => {
  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifySwaggerGen, missingServiceOpts);
  fastify.ready(err => {
    if (err) {
      t.match(err.message, /^failed to load/, "got expected error");
    } else {
      t.fail("missed expected error");
    }
  });
});

test("full swagger pet store definition does not throw error ", t => {
  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifySwaggerGen, petStoreOpts);
  fastify.ready(err => {
    if (err) {
      t.fail("got unexpected error");
    } else {
      t.pass("no unexpected error");
    }
  });
});
