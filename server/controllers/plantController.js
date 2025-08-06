const { Plant, Shelf, Shelving, Room } = require("../models/models");

class PlantController {
  async getAll(req, res) {
    const plants = await Plant.findAll();
    return res.json(plants);
  }

  async getOne(req, res) {
    try {
      const plant = await Shelf.findOne({
        where: {
          serial_num: req.query.shelfNum,
        },
        attributes: [],
        include: [
          {
            model: Shelving,
            attributes: [],
            where: { name: req.query.shelvingName },
            include: [
              {
                model: Room,
                attributes: [],
                where: { name: req.query.roomName },
              },
            ],
          },
          {
            model: Plant,
            attributes: ["name"],
          },
        ],
      });
      return res.json(plant);
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }
}

module.exports = new PlantController();
