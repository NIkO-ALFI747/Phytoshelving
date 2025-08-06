const { ParameterSettingRange } = require("../models/models");

class ParameterSettingRangeController {
  async getAll(req, res) {
    const elems = await ParameterSettingRange.findAll();
    return res.json(elems);
  }

  async getOne(req, res) {}
}

module.exports = new ParameterSettingRangeController();
