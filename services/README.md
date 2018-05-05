# Services

This folder contains:

* a [swagger specification](swagger.json)
* a [partial implementation of the services](service.js) specified in
  this specification
* a [Fastify plugin](index.js) which encapsulates the implementation of the services

The plugin should be standard while the implementation could be (partially) generated from the swagger specification.
A generator utility would:
* copy the provide swagger specification into swagger.json
* clone index.js (as its not specific to the specification nor implementation)
* generate a service implementation and write it to service.js
