const Router = require("express");
const router = new Router();

const parameterTypeController = require("../controllers/parameterTypeController");

router.get("/", parameterTypeController.getAll);

module.exports = router;
