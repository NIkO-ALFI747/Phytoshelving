const Router = require("express");
const router = new Router();

const parameterSettingRatingController = require("../controllers/parameterSettingRatingController");

router.get("/", parameterSettingRatingController.getAll);
router.post("/ranking", parameterSettingRatingController.ranking);

module.exports = router;
