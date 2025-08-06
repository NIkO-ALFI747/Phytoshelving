const Router = require("express");
const router = new Router();

const rangeController = require("../controllers/rangeController");

router.get("/", rangeController.getAll);
router.post("/realtimeGraph", rangeController.realtimeGraph);
router.post("/graph", rangeController.graph);
router.post("/activateParameter", rangeController.activateParameter);

module.exports = router;
