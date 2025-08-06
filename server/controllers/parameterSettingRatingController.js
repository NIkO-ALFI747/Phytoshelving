const { ParameterSettingRating } = require("../models/models");

class ParameterSettingRatingController {
  async getAll(req, res) {
    const ratings = await ParameterSettingRating.findAll();
    return res.json(ratings);
  }

  async getOne(req, res) {}

  async ranking(req, res) {
    const parameterSettingRating = await ParameterSettingRating.findOne({
      where: {
        parameterPollingSettingId: req.body.id,
      },
    });
    parameterSettingRating.visit_num += 1;
    await parameterSettingRating.save({ fields: ["visit_num"] });
    console.log({
      msg: "success",
      parameter_id: req.body.id,
      visit_num: parameterSettingRating.visit_num,
    });
    return res.json({
      msg: "success",
      parameter_id: req.body.id,
      visit_num: parameterSettingRating.visit_num,
    });
  }
}

module.exports = new ParameterSettingRatingController();
