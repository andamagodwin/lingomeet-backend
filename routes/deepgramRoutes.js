const express = require("express");
const router = express.Router();
const deepgramController = require("../controllers/deepgramController");

// Serve static files from public directory
router.use(express.static("public/"));

// Routes

router.get("/key", deepgramController.getKey);

module.exports = router;