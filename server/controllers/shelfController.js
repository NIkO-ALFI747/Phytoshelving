const { ShelfView } = require("../models/views");
const { Shelf, Shelving, Room, Plant } = require("../models/models");
const db = require("../db");

const { getWorker } = require("../utils/workerManager");

class ShelfController {
  async getAll(req, res) {
    try {
      const shelves = await ShelfView.findAll();
      if (null !== shelves) return res.json(shelves);
      else return res.status(404).json("Отсутствуют полки");
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async getOne(req, res) {
    try {
      const query = req.query;
      const shelf = await Shelf.findOne({
        where: {
          serial_num: query.serial_num,
        },
        attributes: ["serial_num"],
        include: [
          {
            model: Shelving,
            attributes: ["name"],
            where: { id: query.shelvingId },
            include: [
              {
                model: Room,
                attributes: ["name"],
                where: { id: query.roomId },
              },
            ],
          },
          {
            model: Plant,
            attributes: ["name"],
          },
        ],
      });
      if (null !== shelf) return res.json(shelf);
      else return res.status(404).json("Полка не найдена");
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async count(req, res) {
    try {
      const quant = await ShelfView.count();
      if (null !== quant) return res.json(quant);
      else return res.status(404).json("Отсутствуют полки");
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async getAllByShelving(req, res) {
    try {
      const shelves = await Shelf.findAll({
        where: { shelvingId: req.query.id },
      });
      if (shelves.length !== 0) return res.json(shelves);
      else return res.status(404).json("Полки не найдены");
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async shelf(req, res) {
    let msg2 = "";
    const shelfId = req.body.id;
    const type = req.body.type;

    try {
      const worker = getWorker();
      // Fetch parameters for the specified shelf
      const shelfParams = await db.query(`
        SELECT DISTINCT parameter_polling_settings.id as configured_parameters_id,
        activity, parameters.name as parameter,
        parameter_types.description as parameters_type,
        serial_num as shelf_serial_num, plants.name as plants
        FROM parameter_settings_ranges
        INNER JOIN parameter_polling_settings
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
        WHERE shelves.id = ${shelfId}
        ORDER BY parameter_polling_settings.id
      `);

      // Check if any parameters were found for the shelf.
      if (shelfParams && shelfParams[0] && shelfParams[0].length > 0) {
        // Process each parameter individually
        for (let i = 0; i < shelfParams[0].length; i++) {
          const currentParam = shelfParams[0][i];

          if (type === "activeRealtimeShelf") {
            // Fetch the last value for the current parameter.
            const paramLastValue = await db.query(`
              SELECT id, value
              FROM value_configured_parameters
              WHERE "parameterPollingSettingId" = ${currentParam.configured_parameters_id}
              ORDER BY id DESC
              LIMIT 1
            `);

            // Ensure the query returned a result before trying to access it.
            // This prevents a potential TypeError if no value is found.
            if (
              paramLastValue &&
              paramLastValue[0] &&
              paramLastValue[0].length > 0
            ) {
              currentParam.lastValue = paramLastValue[0][0].value;
            } else {
              currentParam.lastValue = null; // Set to null if no value is found.
            }

            if (currentParam.activity) {
              msg2 += `Получение значений параметра ${currentParam.configured_parameters_id} в реальном времени активировано\n`;
              worker.send({
                type: type,
                id: currentParam.configured_parameters_id,
              });
            } else {
              msg2 += `Параметр ${currentParam.configured_parameters_id} неактивен\n`;
            }
          } else {
            if (currentParam.activity) {
              msg2 += `Получение значений параметра ${currentParam.configured_parameters_id} в реальном времени прекращено\n`;
              worker.send({
                type: type,
                id: currentParam.configured_parameters_id,
              });
            } else {
              msg2 += `Параметр ${currentParam.configured_parameters_id} неактивен\n`;
            }
          }
        }

        // Return success response with processed data
        return res.json({
          msg: "success",
          msg2: msg2,
          shelf_params: shelfParams[0],
          type: type,
          id: shelfId,
        });
      } else {
        // Handle case where no parameters are found
        return res.status(404).json({
          msg: `Параметров для полки ${shelfId} не найдено`,
          id: shelfId,
        });
      }
    } catch (error) {
      // Centralized error handling for the entire method
      console.error(`Error in shelf method for shelf ID ${shelfId}:`, error);
      return res.status(500).json({
        msg: "An internal server error occurred.",
        error: error.message,
      });
    }
  }
}

module.exports = new ShelfController();
