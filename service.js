// an example of implementation of the operations in the swagger file

class Service {
  constructor() {}

  async getPetById(req, resp) {
    console.log("getPetById", req.params.petId);
    return { pet: "Rudolph the red nosed raindeer" };
  }
}

module.exports = config => new Service();
