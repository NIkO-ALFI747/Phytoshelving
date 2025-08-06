const Router = require("express");
const router = new Router();

const parameterController = require("../controllers/parameterController");

router.get("/", parameterController.getAll);

module.exports = router;
