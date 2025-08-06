const Router = require("express");
const router = new Router();

const dynamicRangeController = require("../controllers/dynamicRangeController");

router.get("/", dynamicRangeController.getAll);

module.exports = router;
