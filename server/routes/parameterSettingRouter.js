const Router = require("express");
const router = new Router();

const parameterSettingController = require("../controllers/parameterSettingController");

router.get("/", parameterSettingController.getAll);
router.get("/one", parameterSettingController.getOne);
router.get("/count", parameterSettingController.count);
router.post("/filter", parameterSettingController.filter);

module.exports = router;
