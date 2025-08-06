const { StationarySequence } = require("../models/models");

class StationarySequenceController {
  async getAll(req, res) {
    const elems = await StationarySequence.findAll();
    return res.json(elems);
  }

  async getOne(req, res) {}
}

module.exports = new StationarySequenceController();
