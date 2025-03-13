const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');

// Rutas protegidas para categorías
router.get("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    categoryController.getAll);
router.post("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    categoryController.create);
router.put("/:id", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    categoryController.update);

module.exports = router;
