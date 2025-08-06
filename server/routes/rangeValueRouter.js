const Router = require("express");
const router = new Router();

const rangeValueController = require("../controllers/rangeValueController");

router.get("/", rangeValueController.getAll);

module.exports = router;
