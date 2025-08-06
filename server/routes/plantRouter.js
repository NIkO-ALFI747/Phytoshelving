const Router = require("express");
const router = new Router();

const plantController = require("../controllers/plantController");

router.get("/", plantController.getAll);
router.get("/one-by-shelf", plantController.getOne);

module.exports = router;
