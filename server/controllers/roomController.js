const { Room } = require("../models/models");

class RoomController {
  async getAll(req, res) {
    try {
      const rooms = await Room.findAll();
      if (rooms.length !== 0) return res.json(rooms);
      else return res.status(404).json("Отсутствуют комнаты");
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async getOne(req, res) {
    try {
      const name = req.params.name;
      const room = await Room.findOne({ where: { name } });
      if (room.length !== 0) return res.json(room);
      else return res.status(404).json("Комната не найдена");
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async count(req, res) {
    try {
      const quant = await Room.count();
      if (0 !== quant) return res.json(quant);
      else return res.status(404).json("Отсутствуют комнаты");
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }
}

module.exports = new RoomController();
