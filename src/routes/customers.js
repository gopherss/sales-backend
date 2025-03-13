const express = require("express");
const router = express.Router();
const customersController = require("../controllers/customersController");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');

router.get("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    customersController.getAll);
router.post("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    customersController.create);
router.put("/:id", authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    customersController.update);

router.get("/search", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    customersController.searchByDni);

module.exports = router;
