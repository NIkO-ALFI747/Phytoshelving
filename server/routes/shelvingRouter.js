const Router = require("express");
const router = new Router();

const shelvingController = require("../controllers/shelvingController");

router.get("/", shelvingController.getAll);
router.get("/count", shelvingController.count);
router.get("/one", shelvingController.getOne);
router.get("/shelving-by-room", shelvingController.getAllByRoom);
router.post("/shelving", shelvingController.shelving);

module.exports = router;
