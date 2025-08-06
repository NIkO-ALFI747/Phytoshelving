const Router = require("express");
const router = new Router();

const shelfController = require("../controllers/shelfController");

router.get("/", shelfController.getAll);
router.get("/one", shelfController.getOne);
router.get("/count", shelfController.count);
router.get("/shelf-by-shelving", shelfController.getAllByShelving);
router.post("/shelf", shelfController.shelf);

module.exports = router;
