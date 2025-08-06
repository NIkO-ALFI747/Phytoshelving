const Router = require("express");
const router = new Router();

const roomController = require("../controllers/roomController");

router.get("/", roomController.getAll);
router.get("/count", roomController.count);
router.get("/:name", roomController.getOne);

module.exports = router;
