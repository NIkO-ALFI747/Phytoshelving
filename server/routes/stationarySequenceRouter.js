const Router = require("express");
const router = new Router();

const stationarySequenceController = require("../controllers/stationarySequenceController");

router.get("/", stationarySequenceController.getAll);

module.exports = router;
