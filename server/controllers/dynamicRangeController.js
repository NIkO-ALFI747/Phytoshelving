const { DynamicRangeElem } = require("../models/models");

class DynamicRangeController {
  async getAll(req, res) {
    const elems = await DynamicRangeElem.findAll();
    return res.json(elems);
  }

  async getOne(req, res) {}
}

module.exports = new DynamicRangeController();
