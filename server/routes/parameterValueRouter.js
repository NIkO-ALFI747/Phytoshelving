const Router = require("express");
const router = new Router();

const parameterValueController = require("../controllers/parameterValueController");

router.get("/", parameterValueController.getAll);
router.get("/dates-range", parameterValueController.getWithDates);
router.delete("/clear", parameterValueController.clearAll);

module.exports = router;
