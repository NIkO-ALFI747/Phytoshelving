const Router = require("express");
const path = require("path");

const router = new Router();

router.get("", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "..", "client", "auxiliary", "index.html")
  );
});

module.exports = router;
