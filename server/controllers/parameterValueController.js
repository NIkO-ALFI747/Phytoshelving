const { ParameterValue } = require("../models/models");
const { Op } = require("sequelize");

class ParameterValueController {
  async getAll(req, res) {
    try {
      const values = await ParameterValue.findAll();
      return res.json(values);
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async getOne(req, res) {
    return res.status(501).json("Not implemented");
  }

  async getWithDates(req, res) {
    try {
      let date1 = new Date(req.query.selectedDate);
      let date2 = new Date(req.query.selectedDate);

      // Adjust date range (+5h, +1d+5h)
      date1 = new Date(date1.setTime(date1.getTime() + 5 * 60 * 60 * 1000));
      date2 = new Date(date2.setTime(date2.getTime() + 24 * 60 * 60 * 1000));

      const values = await ParameterValue.findAll({
        where: {
          parameterPollingSettingId: 1,
          fixate_time: {
            [Op.between]: [date1, date2],
          },
        },
      });

      return res.json(values);
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async clearAll(req, res) {
    try {
      await ParameterValue.destroy({ where: {}, truncate: true });
      return res.status(200).json({ message: "All ParameterValue records deleted." });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
}

module.exports = new ParameterValueController();
