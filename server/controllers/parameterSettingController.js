const { ParameterSetting } = require("../models/models");
const db = require("../db");

class ParameterSettingController {
  async getAll(req, res) {
    try {
      const settings = await ParameterSetting.findAll({
        offset: req.query.offset * 12,
        limit: 12,
      });
      if (settings.length !== 0) return res.json(settings);
      else return res.status(404).json("Настройки не найдены");
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async getOne(req, res) {
    try {
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async count(req, res) {
    try {
      const quant = await ParameterSetting.count();
      if (0 !== quant) return res.json(quant);
      else return res.status(404).json("Отсутствуют настройки");
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async filter(req, res) {
    let filterQuery = ``;
    let num = 0;
    let limit, offset, loop;
    let minValueFilter = 0;
    let maxValueFilter = 0;

    if (req.body.hasOwnProperty("type")) {
      limit = ``;
      offset = ``;
      loop = 2;
    } else {
      limit = `LIMIT 12`;
      offset = `OFFSET ${req.body.offset * 12}`;
      loop = 1;
    }

    if (req.body.hasOwnProperty("filter")) {
      filterQuery += `WHERE `;
      if (req.body.filter.hasOwnProperty("room")) {
        filterQuery += `rooms.name = '${req.body.filter.room}' `;
        num = 1;
      }
      if (req.body.filter.hasOwnProperty("shelving")) {
        if (num != 0)
          filterQuery += `AND shelvings.name = '${req.body.filter.shelving}' `;
        else filterQuery += `shelvings.name = '${req.body.filter.shelving}' `;
        num = 1;
      }
      if (req.body.filter.hasOwnProperty("shelf")) {
        if (num != 0)
          filterQuery += `AND serial_num = ${req.body.filter.shelf} `;
        else filterQuery += `serial_num = ${req.body.filter.shelf} `;
        num = 1;
      }
      if (req.body.filter.hasOwnProperty("parameter")) {
        if (num != 0)
          filterQuery += `AND parameters.name = '${req.body.filter.parameter}' `;
        else filterQuery += `parameters.name = '${req.body.filter.parameter}' `;
      }
      if (req.body.filter.hasOwnProperty("shelving_id")) {
        filterQuery += `shelvings.id = ${req.body.filter.shelving_id} `;
      }
      if (req.body.filter.hasOwnProperty("shelf_id")) {
        filterQuery += `shelves.id = ${req.body.filter.shelf_id} `;
      }
      if (req.body.filter.hasOwnProperty("min_value")) {
        minValueFilter = 1;
        limit = ``;
        offset = ``;
        loop = 2;
      }
      if (req.body.filter.hasOwnProperty("max_value")) {
        maxValueFilter = 1;
        limit = ``;
        offset = ``;
        loop = 2;
      }
    }

    let filterParams = [];
    for (let i = 0; i < loop; i++) {
      if (i == 1) {
        limit = `LIMIT 12`;
        offset = `OFFSET ${req.body.offset * 12}`;
      }
      filterParams[i] = await db.query(`
        SELECT DISTINCT visit_num,
        parameter_polling_settings.id as configured_parameters_id, 
        activity, parameters.name as parameters_name,
        parameter_types.description as parameters_type,
        shelves.id as shelf_id, serial_num as shelfs_serial_num,
        plants.name as plants, shelvings.id as shelving_id,
        shelvings.name as shelving, rooms.name as room
        FROM parameter_polling_settings
        INNER JOIN parameter_settings_ranges
        ON parameter_settings_ranges."parameterPollingSettingId"
        = parameter_polling_settings.id
        INNER JOIN parameter_settings_ratings
        ON parameter_settings_ratings."parameterPollingSettingId"
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
        INNER JOIN rooms
        ON shelvings."roomId"
        = rooms.id
        ${filterQuery}
        ORDER BY visit_num DESC, parameter_polling_settings.id
        ${limit}
        ${offset}`);
    }

    let allResParams = [];
    let resParams = [];

    if (minValueFilter || maxValueFilter) {
      if (filterParams[0][0].length != 0) {
        let k = 0;
        for (let i = 0; i < filterParams[0][0].length; i++) {
          const paramLastValue = await db.query(`
              SELECT id, value
              FROM value_configured_parameters
              WHERE "parameterPollingSettingId" = ${filterParams[0][0][i].configured_parameters_id}
              ORDER BY id DESC
              LIMIT 1
          `);
          if (minValueFilter && maxValueFilter) {
            if (
              paramLastValue[0][0].value > req.body.filter.min_value &&
              paramLastValue[0][0].value < req.body.filter.max_value
            ) {
              filterParams[0][0][i].last_value = paramLastValue[0][0].value;
              allResParams[k] = JSON.parse(
                JSON.stringify(filterParams[0][0][i])
              );
              k++;
            }
          } else if (minValueFilter) {
            if (paramLastValue[0][0].value > req.body.filter.min_value) {
              filterParams[0][0][i].last_value = paramLastValue[0][0].value;
              allResParams[k] = JSON.parse(
                JSON.stringify(filterParams[0][0][i])
              );
              k++;
            }
          } else {
            if (paramLastValue[0][0].value < req.body.filter.max_value) {
              filterParams[0][0][i].last_value = paramLastValue[0][0].value;
              allResParams[k] = JSON.parse(
                JSON.stringify(filterParams[0][0][i])
              );
              k++;
            }
          }
        }
        k = 0;
        let length;
        if (allResParams.length < req.body.offset * 12 + 12)
          length = allResParams.length;
        else length = req.body.offset * 12 + 12;

        for (let i = req.body.offset * 12; i < length; i++) {
          resParams[k] = JSON.parse(JSON.stringify(allResParams[i]));
          k++;
        }
      }
    } else {
      if (loop == 1) {
        resParams = JSON.parse(JSON.stringify(filterParams[0][0]));
      } else {
        allResParams = JSON.parse(JSON.stringify(filterParams[0][0]));
        resParams = JSON.parse(JSON.stringify(filterParams[1][0]));
      }
    }

    if (loop == 1) {
      if (filterParams[0][0].length != 0) {
        return res.json({ msg: "success", filter_params: resParams });
      } else return res.json({ msg: `Параметров не найдено` });
    } else {
      if (filterParams[0][0].length != 0) {
        return res.json({
          msg: "success",
          all_filter_params: allResParams,
          filter_params: resParams,
        });
      } else return res.json({ msg: `Параметров не найдено` });
    }
  }
}

module.exports = new ParameterSettingController();
