const { Range, ParameterValue, ParameterSetting } = require("../models/models");

const db = require("../db");
const fs = require("fs");
const path = require("path");
const { getWorker } = require("../utils/workerManager");

class RangeController {
  async getAll(req, res) {
    const ranges = await Range.findAll();
    return res.json(ranges);
  }

  async realtimeGraph(req, res) {
    try {
      const worker = getWorker();
      const realtimeParam = await ParameterSetting.findOne({
        where: {
          id: req.body.id,
          activity: true,
        },
      });
      if (null !== realtimeParam) {
        const paramValues = await db.query(`
          SELECT id, value, fixate_time, fixate_serial_num
          FROM value_configured_parameters
          WHERE "parameterPollingSettingId" = ${req.body.id}
          ORDER BY id
        `);

        worker.send({ type: req.body.type, id: req.body.id });
        return res.json({
          msg: "success",
          type: req.body.type,
          id: req.body.id,
          paramValues: paramValues[0],
        });
      } else
        return res.json({
          msg: "Выбранный параметр не активен на данный момент",
          id: req.body.id,
        });
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async graph(req, res) {
    try {
      const paramValues = await db.query(`
        SELECT id, value, fixate_time, fixate_serial_num
        FROM value_configured_parameters
        WHERE "parameterPollingSettingId" = ${req.body.id}
        ORDER BY id
      `);
      if (paramValues[0].length != 0) {
        return res.json({
          msg: "success",
          id: req.body.id,
          paramValues: paramValues[0],
        });
      } else
        return res.json({
          msg: `Значений для параметра ${req.body.id} не найдено`,
          id: req.body.id,
        });
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async activateParameter(req, res) {
    const activityOne = async (id, activity) => {
      const parameter = await ParameterSetting.findOne({
        where: {
          id: id,
        },
      });
      parameter.activity = activity;
      await parameter.save({ fields: ["activity"] });
      return parameter.id;
    };

    try {
      const worker = getWorker();
      let search, currentActivity, ans, ansActivity, type;
      if (req.body.activity) {
        currentActivity = false;
        ansActivity = `Активация`;
        type = `active`;
      } else {
        currentActivity = true;
        ansActivity = `Деактивация`;
        type = `deactive`;
      }

      if (req.body.type == "all") {
        search = ``;
      } else {
        search = `AND (parameter_polling_settings.id = ${req.body.id})`;
      }

      if (req.body.type != "auto") {
        const param = await db.query(`
          SELECT parameter_polling_settings.id, activity
          FROM parameter_polling_settings
          JOIN parameter_settings_ranges
          ON parameter_settings_ranges."parameterPollingSettingId"
          = parameter_polling_settings.id
          WHERE (activity = ${currentActivity}) ${search}
          GROUP BY parameter_polling_settings.id
          ORDER BY parameter_polling_settings.id
        `);
        if (param[0].length != 0) {
          let paramId;
          if (req.body.type == "all") {
            paramId = [];
            ans = `${ansActivity} параметров`;
            for (let i = 0; i < param[0].length; i++) {
              paramId[i] = await activityOne(param[0][i].id, req.body.activity);
              ans += ` ${paramId[i]}`;
            }
            ans += ` прошла успешно`;
            type += `All`;
            worker.send({ type: type, id: paramId });
          } else {
            paramId = await activityOne(param[0][0].id, req.body.activity);
            ans = `${ansActivity} параметра ${paramId} прошла успешно`;
            type += `One`;
            worker.send({ type: type, id: paramId });
          }
          return res.json(ans);
        } else return res.json("Параметр(ы) не найден(ы)");
      } else {
        worker.send({ type: req.body.type, activity: req.body.activity });
        if (req.body.activity) ans = `Автоматическая активация включена`;
        else ans = `Автоматическая активация отключена`;
        return res.json(ans);
      }
    } catch (e) {
      return res.status(500).json(e.message);
    }
  }

  async createSurvey() {
    const result = await db.query(`
      SELECT name, parameter_types.description, activity, "parameterPollingSettingId", ranges.id, type
      FROM parameter_settings_ranges
      INNER JOIN parameter_polling_settings
      ON parameter_settings_ranges."parameterPollingSettingId"
      = parameter_polling_settings.id
      INNER JOIN ranges
      ON parameter_settings_ranges."rangeId"
      = ranges.id
      INNER JOIN parameters
      ON parameter_polling_settings."parameterId"
      = parameters.id
      INNER JOIN parameter_types
      ON parameters."parameterTypeId"
      = parameter_types.id
      ORDER BY "parameterPollingSettingId"
    `);
    const stationarySequence = await db.query(`
      SELECT ranges.id, type, num_values, value
      FROM stationary_sequences
      INNER JOIN range_values
      ON stationary_sequences."rangeValueId"
      = range_values.id
      INNER JOIN ranges
      ON range_values."rangeId"
      = ranges.id
      WHERE 
      (type = 'Стационарный диапазон опроса' OR
      type = 'Стационарный диапазон работы до простоя' OR
      type = 'Стационарный диапазон простоя')
      ORDER BY ranges.id
    `);
    const dynamicSequence = await db.query(`
      SELECT ranges.id, type, serial_num, value, num_values
      FROM dynamic_range_elements
      INNER JOIN range_values
      ON dynamic_range_elements."rangeValueId"=range_values.id
      INNER JOIN ranges
      ON range_values."rangeId" = ranges.id
      LEFT JOIN stationary_sequences
      ON range_values.id = stationary_sequences."rangeValueId"
      WHERE
      (type = 'Динамический диапазон опроса' OR
      type = 'Динамический диапазон работы до простоя' OR
      type = 'Динамический диапазон простоя')
      ORDER BY ranges.id, serial_num
    `);
    // console.log(result[0]);
    // console.log(stationarySequence[0]);
    // console.log(dynamicSequence[0]);

    let configured_parameters = [];
    let step = 1;
    let k = 0;
    for (let i = 0; i < result[0].length; i = i + step) {
      configured_parameters[k] = {
        counters: [],
        activity: 0,
        name: ``,
        id: result[0][i].parameterPollingSettingId,
      };
      configured_parameters[k].activity = result[0][i].activity;
      configured_parameters[k].name = result[0][i].name;
      if (
        i < result[0].length - 1 &&
        result[0][i].parameterPollingSettingId ==
          result[0][i + 1].parameterPollingSettingId
      ) {
        let survey, work, downtime;
        if (
          result[0][i].type == `Стационарный диапазон опроса` ||
          result[0][i].type == `Динамический диапазон опроса`
        ) {
          survey = result[0][i];
        } else if (
          result[0][i + 1].type == `Стационарный диапазон опроса` ||
          result[0][i + 1].type == `Динамический диапазон опроса`
        ) {
          survey = result[0][i + 1];
        } else {
          survey = result[0][i + 2];
        }

        if (
          result[0][i].type == `Стационарный диапазон работы до простоя` ||
          result[0][i].type == `Динамический диапазон работы до простоя`
        ) {
          work = result[0][i];
        } else if (
          result[0][i + 1].type == `Стационарный диапазон работы до простоя` ||
          result[0][i + 1].type == `Динамический диапазон работы до простоя`
        ) {
          work = result[0][i + 1];
        } else {
          work = result[0][i + 2];
        }

        if (
          result[0][i].type == `Стационарный диапазон простоя` ||
          result[0][i].type == `Динамический диапазон простоя`
        ) {
          downtime = result[0][i];
        } else if (
          result[0][i + 1].type == `Стационарный диапазон простоя` ||
          result[0][i + 1].type == `Динамический диапазон простоя`
        ) {
          downtime = result[0][i + 1];
        } else {
          downtime = result[0][i + 2];
        }

        configured_parameters[k].counters[0] = {
          counter: 0,
          type: `${survey.type}`,
          typeId: `${survey.id}`,
        };
        configured_parameters[k].counters[1] = {
          counter: 0,
          type: `${work.type}`,
          typeId: `${work.id}`,
        };
        configured_parameters[k].counters[2] = {
          counter: 0,
          type: `${downtime.type}`,
          typeId: `${downtime.id}`,
        };
        step = 3;
      } else {
        configured_parameters[k].counters[0] = {
          counter: 0,
          type: `${result[0][i].type}`,
          typeId: `${result[0][i].id}`,
        };
        step = 1;
      }
      // console.log(configured_parameters[k].counters);
      k++;
    }

    const activityOne = async (id, activity) => {
      const parameter = await ParameterSetting.findOne({
        where: {
          id: id,
        },
      });
      parameter.activity = activity;
      await parameter.save({ fields: ["activity"] });
      return parameter.id;
    };
    const getRandomArbitrary = (min, max) => {
      return Math.random() * (max - min) + min;
    };
    const getRandValue = (i) => {
      let randValue, text;
      // %
      if (configured_parameters[i].name == `Влажность`) {
        randValue = getRandomArbitrary(10, 80);
        text = `Влажность %:`;
      }
      // %
      if (configured_parameters[i].name == `Освещенность`) {
        randValue = getRandomArbitrary(5, 95);
        text = `Освещенность %:`;
      }
      // mm^3
      if (configured_parameters[i].name == `Полив`) {
        randValue = getRandomArbitrary(0.5, 10000000);
        text = `Полив mm^3:`;
      }
      // C
      if (configured_parameters[i].name == `Температура`) {
        randValue = getRandomArbitrary(0, 60);
        text = `Температура C:`;
      }
      return { randValue, text };
    };

    const getCurrentTime = () => {
      let now = new Date();
      let year, month, date, hours, minutes, seconds, milliseconds, timezone;

      year = now.getFullYear();
      month = now.getMonth() + 1;
      date = now.getDate();
      hours = now.getHours();
      minutes = now.getMinutes();
      seconds = now.getSeconds();
      milliseconds = now.getMilliseconds();
      timezone = now.getTimezoneOffset() / 60;

      month = month < 10 ? "0" + month : month;
      date = date < 10 ? "0" + date : date;
      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;
      hours = hours < 10 ? "0" + hours : hours;
      if (timezone < 10 && timezone > 0) timezone = `-0${timezone}`;
      if (timezone > -10 && timezone < 0) timezone = `+0${-timezone}`;

      return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}.${milliseconds}${timezone}`;
    };

    const insertValueConfigParam = async (
      val,
      serialNum,
      parameterPollingSettingId,
      fixateTime
    ) => {
      await ParameterValue.create({
        value: val,
        fixate_serial_num: serialNum,
        parameterPollingSettingId: parameterPollingSettingId,
        fixate_time: fixateTime,
      })
        .then((res) => {
          // console.log(`Запись добавлена`);
          /*fs.appendFile(
            path.join(__dirname,'..','valueConfiguredParameters_inserts.txt'), 
            `INSERT INTO public.value_configured_parameters ` +
            `(value, fixate_serial_num, "parameterPollingSettingId", fixate_time) ` +
            `VALUES (${val},${serialNum},${parameterPollingSettingId},'${fixateTime}');\n`,
            (err)=>{
              if (err) console.log(err)
              else console.log(`Запись добавлена`)
            }
          )*/
        })
        .catch((err) => console.log(err));
    };

    const surveyFunc = (i) => {
      // Stationary survey
      let currentNumValues = [];
      let value = [];
      let pollingRange = -1;
      let downtimeRange = -1;
      let workRange = -1;
      for (let j = 0; j < stationarySequence[0].length; j++) {
        for (let k = 0; k < configured_parameters[i].counters.length; k++) {
          if (
            configured_parameters[i].counters[k].typeId ==
            stationarySequence[0][j].id
          ) {
            currentNumValues[j] = stationarySequence[0][j].num_values;
            value[j] = stationarySequence[0][j].value;
            if (stationarySequence[0][j].type == `Стационарный диапазон опроса`)
              pollingRange = j;
            if (
              stationarySequence[0][j].type ==
              `Стационарный диапазон работы до простоя`
            )
              workRange = j;
            if (
              stationarySequence[0][j].type == `Стационарный диапазон простоя`
            )
              downtimeRange = j;
          }
        }
      }

      // Dynamic survey
      let dynCurrentNumValues = [];
      let dynValue = [];
      let dynPollingRange = [];
      let dynWorkRange = [];
      let dynDowntimeRange = [];
      let counterPollingRange = 0;
      let counterWorkRange = 0;
      let counterDowntimeRange = 0;
      dynPollingRange[0] = -1;
      dynWorkRange[0] = -1;
      dynDowntimeRange[0] = -1;
      for (let j = 0; j < dynamicSequence[0].length; j++) {
        for (let k = 0; k < configured_parameters[i].counters.length; k++) {
          if (
            configured_parameters[i].counters[k].typeId ==
            dynamicSequence[0][j].id
          ) {
            if (dynamicSequence[0][j].num_values !== null)
              dynCurrentNumValues[j] = dynamicSequence[0][j].num_values;
            else dynCurrentNumValues[j] = -1;

            dynValue[j] = dynamicSequence[0][j].value;

            if (dynamicSequence[0][j].type == `Динамический диапазон опроса`) {
              dynPollingRange[counterPollingRange] = j;
              counterPollingRange++;
            }
            if (
              dynamicSequence[0][j].type ==
              `Динамический диапазон работы до простоя`
            ) {
              dynWorkRange[counterWorkRange] = j;
              counterWorkRange++;
            }
            if (dynamicSequence[0][j].type == `Динамический диапазон простоя`) {
              dynDowntimeRange[counterDowntimeRange] = j;
              counterDowntimeRange++;
            }
          }
        }
      }

      counterPollingRange = 0;
      counterWorkRange = 0;
      counterDowntimeRange = 0;
      let rand;
      let fixateSerialNum = 1;
      let fixateTime;

      let downtimeFlag = 0;
      const surveyId = setInterval(async () => {
        if (deactive[i]) {
          clearInterval(surveyId);
          const activityRes = await activityOne(
            configured_parameters[i].id,
            false
          );
          // console.log(`Survey ${activityRes} Deactive`);
          configured_parameters[i].activity = false;
        }
        if (!downtimeFlag) {
          configured_parameters[i].counters[0].counter += 1;
          if (1 in configured_parameters[i].counters) {
            configured_parameters[i].counters[1].counter += 1;
          }
        } else {
          configured_parameters[i].counters[2].counter += 1;
        }

        if (pollingRange != -1) {
          if (
            configured_parameters[i].counters[0].counter >= value[pollingRange]
          ) {
            configured_parameters[i].counters[0].counter = 0;

            rand = getRandValue(i);
            fixateTime = getCurrentTime();
            /*console.log(
              `Survey${i}: ${value[pollingRange]}, CurrentTime: ${fixateTime}, SerialNum: ${fixateSerialNum}, ${rand.text} ${rand.randValue}`
            );*/
            insertValueConfigParam(
              rand.randValue,
              fixateSerialNum,
              configured_parameters[i].id,
              fixateTime
            );
            if (realTime[i]) {
              process.send({
                value: `${rand.randValue}`,
                fixateSerialNum: fixateSerialNum,
                configured_parameters_id: configured_parameters[i].id,
                fixateTime: fixateTime,
                type: realtimeType,
              });
            }
            fixateSerialNum++;

            currentNumValues[pollingRange] -= 1;
            if (currentNumValues[pollingRange] == 0) {
              if (autoActivity) {
                clearInterval(surveyId);
                /*console.log(
                  `Survey ${configured_parameters[i].id} Done, activate`
                );*/
                surveyFunc(i);
              } else {
                clearInterval(surveyId);
                const activityRes = await activityOne(
                  configured_parameters[i].id,
                  false
                );
                // console.log(`Survey ${activityRes} Done`);
                configured_parameters[i].activity = false;
              }
            }
          }
        }
        if (dynPollingRange[0] != -1) {
          if (
            configured_parameters[i].counters[0].counter >=
            dynValue[dynPollingRange[counterPollingRange]]
          ) {
            configured_parameters[i].counters[0].counter = 0;

            rand = getRandValue(i);
            fixateTime = getCurrentTime();
            /*console.log(
              `Survey${i}: ${dynValue[dynPollingRange[counterPollingRange]]}, 
              CurrentTime: ${fixateTime}, 
              SerialNum: ${fixateSerialNum}, 
              ${rand.text} ${rand.randValue}`
            );*/
            insertValueConfigParam(
              rand.randValue,
              fixateSerialNum,
              configured_parameters[i].id,
              fixateTime
            );
            if (realTime[i]) {
              process.send({
                value: `${rand.randValue}`,
                fixateSerialNum: fixateSerialNum,
                configured_parameters_id: configured_parameters[i].id,
                fixateTime: fixateTime,
                type: realtimeType,
              });
            }
            fixateSerialNum++;

            if (
              dynCurrentNumValues[dynPollingRange[counterPollingRange]] != -1 &&
              dynCurrentNumValues[dynPollingRange[counterPollingRange]] != 0
            ) {
              dynCurrentNumValues[dynPollingRange[counterPollingRange]] -= 1;
            } else {
              counterPollingRange++;
            }

            if (dynPollingRange.length <= counterPollingRange) {
              if (autoActivity) {
                clearInterval(surveyId);
                /*console.log(
                  `Survey ${configured_parameters[i].id} Done, activate`
                );*/
                surveyFunc(i);
              } else {
                clearInterval(surveyId);
                const activityRes = await activityOne(
                  configured_parameters[i].id,
                  false
                );
                //console.log(`Survey ${activityRes} Done`);
                configured_parameters[i].activity = false;
              }
            }
          }
        }

        if ((1 || 2) in configured_parameters[i].counters) {
          if (workRange != -1) {
            if (
              configured_parameters[i].counters[1].counter >= value[workRange]
            ) {
              configured_parameters[i].counters[1].counter = 0;
              downtimeFlag = 1;
              // console.log(`Work (left border)${i}: ${value[workRange]}`);

              currentNumValues[workRange] -= 1;
              if (currentNumValues[workRange] == 0) {
                // console.log(`Work${i} Done`);
              }
            }
          }
          if (dynWorkRange[0] != -1) {
            if (
              configured_parameters[i].counters[1].counter >=
              dynValue[dynWorkRange[counterWorkRange]]
            ) {
              configured_parameters[i].counters[1].counter = 0;
              downtimeFlag = 1;
              /*console.log(
                `Work (left border)${i}: ${
                  dynValue[dynWorkRange[counterWorkRange]]
                }`
              );*/

              if (
                dynCurrentNumValues[dynWorkRange[counterWorkRange]] != -1 &&
                dynCurrentNumValues[dynWorkRange[counterWorkRange]] != 0
              ) {
                dynCurrentNumValues[dynWorkRange[counterWorkRange]] -= 1;
              } else {
                counterWorkRange++;
              }

              if (dynWorkRange.length <= counterWorkRange) {
                // console.log(`Work${i} Done`);
              }
            }
          }

          if (downtimeRange != -1) {
            if (
              configured_parameters[i].counters[2].counter >=
              value[downtimeRange]
            ) {
              configured_parameters[i].counters[2].counter = 0;
              downtimeFlag = 0;
              /*console.log(
                `Downtime (right border)${i}: ${value[downtimeRange]}`
              );*/

              currentNumValues[downtimeRange] -= 1;
              if (currentNumValues[downtimeRange] == 0) {
                // console.log(`Downtime${i} Done`);
              }
            }
          }
          if (dynDowntimeRange[0] != -1) {
            if (
              configured_parameters[i].counters[2].counter >=
              dynValue[dynDowntimeRange[counterDowntimeRange]]
            ) {
              configured_parameters[i].counters[2].counter = 0;
              downtimeFlag = 0;
              /*console.log(
                `Downtime (right border)${i}: ${
                  dynValue[dynDowntimeRange[counterDowntimeRange]]
                }`
              );*/

              if (
                dynCurrentNumValues[dynDowntimeRange[counterDowntimeRange]] !=
                  -1 &&
                dynCurrentNumValues[dynDowntimeRange[counterDowntimeRange]] != 0
              ) {
                dynCurrentNumValues[
                  dynDowntimeRange[counterDowntimeRange]
                ] -= 1;
              } else {
                counterDowntimeRange++;
              }

              if (dynDowntimeRange.length <= counterDowntimeRange) {
                // console.log(`Downtime${i} Done`);
              }
            }
          }
        }
      }, 1000);
    };

    let realTime = [];
    let realtimeType;
    let deactive = [];
    let autoActivity = 0;
    process.on("message", (msg) => {
      // console.log("Type: " + msg.type);
      if (msg.type == "activeRealtimeGraph") {
        realtimeType = `graph`;
        for (let i = 0; i < configured_parameters.length; i++) {
          if (configured_parameters[i].id == msg.id) realTime[i] = 1;
        }
      }
      if (msg.type == "stopRealtimeGraph") {
        for (let i = 0; i < configured_parameters.length; i++) {
          if (configured_parameters[i].id == msg.id) realTime[i] = 0;
        }
      }
      if (msg.type == "activeRealtimeShelving") {
        realtimeType = `shelving`;
        for (let i = 0; i < configured_parameters.length; i++) {
          if (configured_parameters[i].id == msg.id) realTime[i] = 1;
        }
      }
      if (msg.type == "activeRealtimeShelf") {
        realtimeType = `shelf`;
        for (let i = 0; i < configured_parameters.length; i++) {
          if (configured_parameters[i].id == msg.id) realTime[i] = 1;
        }
      }
      if (msg.type == "activeOne") {
        for (let i = 0; i < configured_parameters.length; i++) {
          if (configured_parameters[i].id == msg.id) {
            deactive[i] = 0;
            surveyFunc(i);
            configured_parameters[i].activity = true;
          }
        }
      }
      if (msg.type == "deactiveOne") {
        for (let i = 0; i < configured_parameters.length; i++) {
          if (configured_parameters[i].id == msg.id) deactive[i] = 1;
        }
      }
      if (msg.type == "activeAll") {
        let j = 0;
        for (let i = 0; i < configured_parameters.length; i++) {
          if (configured_parameters[i].id == msg.id[j]) {
            deactive[i] = 0;
            surveyFunc(i);
            configured_parameters[i].activity = true;
            j++;
          }
        }
      }
      if (msg.type == "deactiveAll") {
        let j = 0;
        for (let i = 0; i < configured_parameters.length; i++) {
          if (configured_parameters[i].id == msg.id[j]) {
            deactive[i] = 1;
            j++;
          }
        }
      }
      if (msg.type == "auto") {
        if (msg.activity) autoActivity = 1;
        else autoActivity = 0;
      }
    });

    let timerCounter = 0;
    const timerId = setInterval(() => {
      // console.log(`${timerCounter}`);
      timerCounter += 1;
      if (timerCounter === 500) {
        // console.log("Time Done");
        clearInterval(timerId);
      }
    }, 1000);

    for (let i = 0; i < configured_parameters.length; i++) {
      realTime[i] = 0;
      deactive[i] = 0;
      if (configured_parameters[i].activity) {
        surveyFunc(i);
      }
    }
  }
}

module.exports = new RangeController();