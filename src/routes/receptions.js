const express = require("express");
const router = express.Router();
const receptionsController = require("../controllers/receptionsController");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');

// Endpoints protegidos
router.get("/",
    authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]), receptionsController.getAll);
router.post("/",
    authMiddleware,
    roleMiddleware([ROOT, ADMIN]), receptionsController.create);
router.put("/:id",
    authMiddleware,
    roleMiddleware([ROOT, ADMIN]), receptionsController.update);

module.exports = router;
