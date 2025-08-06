const Router = require("express");
const router = new Router();

const databaseController = require("../controllers/databaseController");

router.delete("/reset", databaseController.deleteAllData);
router.post("/seed", databaseController.fillInitialData);

module.exports = router;
