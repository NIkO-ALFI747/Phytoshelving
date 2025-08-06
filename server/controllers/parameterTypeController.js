const { ParameterType } = require("../models/models");

class ParameterTypeController {
  async getAll(req, res) {
    const types = await ParameterType.findAll();
    return res.json(types);
  }

  async getOne(req, res) {}
}

module.exports = new ParameterTypeController();
