const { ShelvingView } = require("../models/views");
const { Shelving, Room } = require("../models/models");
const db = require("../db");

const { getWorker } = require("../utils/workerManager");

class ShelvingController {
  async getAll(req, res) {
    try {
      const shelvings = await ShelvingView.findAll();
      if (null !== shelvings) return res.json(shelvings);
      else return res.status(404).json("Отсутствуют стеллажи");
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async getOne(req, res) {
    try {
      const query = req.query;
      const shelving = await ShelvingView.findOne({
        where: {
          name: query.name,
          roomId: query.roomId,
        },
      });
      if (null !== shelving) return res.json(shelving);
      else return res.status(404).json("Стеллаж не найден");
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async count(req, res) {
    try {
      const quant = await ShelvingView.count();
      if (null !== quant) return res.json(quant);
      else return res.status(404).json("Отсутствуют стеллажи");
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async getAllByRoom(req, res) {
    try {
      const shelvings = await Shelving.findAll({
        where: { roomId: req.query.id },
      });
      if (shelvings.length !== 0) return res.json(shelvings);
      else return res.status(404).json("Стеллажи не найдены");
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async shelving(req, res) {
    try {
      const worker = getWorker();
      const shelvingsParams = await db.query(`
        SELECT DISTINCT parameter_polling_settings.id as configured_parameters_id, 
        activity, parameters.name as parameter,
        parameter_types.description as parameters_type,
        serial_num as shelf, plants.name as plants, shelvings.name as shelving
        FROM parameter_polling_settings
        INNER JOIN parameter_settings_ranges
        ON parameter_settings_ranges."parameterPollingSettingId"
        = parameter_polling_settings.id
        INNER JOIN parameters
        ON parameter_polling_settings."parameterId"
        = parameters.id
        INNER JOIN parameter_types
        ON parameters."parameterTypeId"
        = parameter_types.id
        INNER JOIN shelves
        ON parameter_polling_settings."shelfId"
        = shelves.id
        INNER JOIN plants
        ON shelves."plantId"
        = plants.id
        INNER JOIN shelvings
        ON shelves."shelvingId"
        = shelvings.id
        WHERE shelvings.id = ${req.body.id}
        ORDER BY parameter_polling_settings.id
      `);

      if (shelvingsParams[0].length != 0) {
        let msg2 = ``;
        for (let i = 0; i < shelvingsParams[0].length; i++) {
          if (req.body.type == "activeRealtimeShelving") {
            const paramLastValue = await db.query(`
              SELECT id, value
              FROM value_configured_parameters
              WHERE "parameterPollingSettingId" = ${shelvingsParams[0][i].configured_parameters_id}
              ORDER BY id DESC
              LIMIT 1
            `);

            // Check if a value was returned before accessing it
            if (paramLastValue[0].length > 0) {
              shelvingsParams[0][i].lastValue = paramLastValue[0][0].value;
            } else {
              shelvingsParams[0][i].lastValue = null; // Set to null if no value exists
            }

            if (shelvingsParams[0][i].activity) {
              msg2 += `Получение значений параметра ${shelvingsParams[0][i].configured_parameters_id} в реальном времени активировано\n`;
              worker.send({
                type: req.body.type,
                id: shelvingsParams[0][i].configured_parameters_id,
              });
            } else {
              msg2 += `Параметр ${shelvingsParams[0][i].configured_parameters_id} неактивен\n`;
            }
          } else {
            if (shelvingsParams[0][i].activity) {
              msg2 += `Получение значений параметра ${shelvingsParams[0][i].configured_parameters_id} в реальном времени прекращено\n`;
              worker.send({
                type: req.body.type,
                id: shelvingsParams[0][i].configured_parameters_id,
              });
            } else {
              msg2 += `Параметр ${shelvingsParams[0][i].configured_parameters_id} неактивен\n`;
            }
          }
        }
        return res.status(200).json({
          msg: "success",
          msg2: msg2,
          shelvings_params: shelvingsParams[0],
          type: req.body.type,
          id: req.body.id,
        });
      } else {
        return res.status(200).json({
          msg: `Параметров для стеллажа ${req.body.id} не найдено`,
          id: req.body.id,
        });
      }
    } catch (e) {
      console.error("Error in shelvingController.js:", e);
      return res
        .status(500)
        .json({ msg: "Internal Server Error", error: e.message });
    }
  }
}

module.exports = new ShelvingController();
