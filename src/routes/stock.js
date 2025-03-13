const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');

// Rutas protegidas para stock
router.get("/", authMiddleware, roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    stockController.getAllStock);

module.exports = router;
