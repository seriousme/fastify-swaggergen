# Fastify swagger generator

This repository contains an experiment to see if its possible to take a swagger file (v2) and autogenerate a configuration for [fastify](https://www.fastify.io).


The result contains the following:

* [index.js](index.js) contains the Fastify plugin which takes the following parameters:
- swaggerSpec 


* [generate.js](examples/petstore/generate.js) demonstrates how to generate a `Service` class. The generator can be extended to add mocks, tests etc.

* [fastify-swagger](https://github.com/fastify/fastify-swagger) has been included to do a round trip. The swagger UI shows on `/documentation`

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
