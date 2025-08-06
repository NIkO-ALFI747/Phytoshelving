const Router = require("express");
const router = new Router();

const parameterSettingRangeController = require("../controllers/parameterSettingRangeController");

router.get("/", parameterSettingRangeController.getAll);

module.exports = router;
