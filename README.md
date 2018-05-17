# Fastify swagger generator
[![Build Status](https://travis-ci.org/seriousme/fastify-swaggergen.svg?branch=master)](https://travis-ci.org/seriousme/fastify-swaggergen)
[![Greenkeeper badge](https://badges.greenkeeper.io/seriousme/fastify-swaggergen.svg)](https://greenkeeper.io/)

This repository contains an experiment to see if its possible to take a swagger file (v2) and autogenerate a configuration for [fastify](https://www.fastify.io).


The result contains the following:

* [index.js](index.js) contains the Fastify plugin which is controlled by the following options:
  - `swaggerSpec`: this can be a JSON object, or the name of a JSON or YAML file containing a valid swagger (v2) file 
  - `service`: this can be a javascript object or class, or the name of a javascript file containing such an object. If the import of the file results in a function instead of an object then the function will be executed.
  - `fastifySwagger`: an object containing the options for the [fastify-swagger](https://github.com/fastify/fastify-swagger) plugin. To avoid registering this plugin pass `{ fastifySwagger: { disabled: true }}`

  `swaggerSpec` and `service` are required. An example:
  ```javascript
  {
    swaggerSpec: `${__dirname}/examples/petstore/petstore-swagger.v2.json`,
    service: `${__dirname}/examples/petstore/service.js`,
    fastifySwagger: {
      disabled: true
    }
  }
  ```

* [generate.js](generate.js) is a tool that can generate a project based on a swaggerfile. The generator could be extended to add mocks, etc.

* [examples/generatedProject](examples/generatedProject) contains the result of running `node generate -l --baseDir=examples examples/petstore/petstore-swagger.v2.yaml`. The generated code can be started using `npm start` in `examples/generatedProject` (need to run `npm i` there first)

## Examples

Clone this repository and run `npm i` 
Executing `npm start` will then start fastify on localhost port 3000 with the
routes extracted from the [petstore example](examples/petstore/petstore-swagger.v2.json) and the [accompanying service definition](examples/petstore/service.js)

* http://localhost:3000/documentation will show the swagger UI, for comparison one could look
  at http://petstore.swagger.io/
* http://localhost:3000/v2/pet/24 will return a pet as specified in service.js
* http://localhost:3000/v2/pet/myPet will return a fastify validation error:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "params.petId should be integer"
}
```

* http://localhost:3000/v2/pet/findByStatus?status=a&status=b will return
  the following error:

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Operation findPetsByStatus not implemented"
}
```

* http://localhost:3000/v2/pet/0 will return the following error:

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "name is required!"
}
```

as the pet returned by service.js does not match the response schema.

# License
MIT
