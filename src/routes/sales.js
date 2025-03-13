const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');

router.get("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    salesController.getAll);
router.post("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    salesController.create);
router.put("/:id", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    salesController.update);

module.exports = router;
