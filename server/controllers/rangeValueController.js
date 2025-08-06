const { RangeValue } = require("../models/models");
const { values } = require("pg/lib/native/query");

class RangeValueController {
  async getAll(req, res) {
    const values = await RangeValue.findAll();
    return res.json(values);
  }

  async getOne(req, res) {}
}

module.exports = new RangeValueController();
