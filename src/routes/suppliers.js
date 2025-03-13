const express = require("express");
const router = express.Router();
const suppliersController = require("../controllers/suppliersController");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');

router.get("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    suppliersController.getAll);
router.post("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN]), suppliersController.create);
router.put("/:id", authMiddleware,
    roleMiddleware([ROOT, ADMIN]), suppliersController.update);

module.exports = router;
