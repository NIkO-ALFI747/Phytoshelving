const { Parameter } = require("../models/models");

class ParameterController {
  async getAll(req, res) {
    const parameters = await Parameter.findAll();
    return res.json(parameters);
  }

  async getOne(req, res) {}
}

module.exports = new ParameterController();
