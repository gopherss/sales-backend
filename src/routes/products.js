const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');


router.get("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    productController.getAll);
router.post("/",
    authMiddleware,
    roleMiddleware([ROOT, ADMIN,]),
    productController.create);
router.put("/:id", authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    productController.update);

module.exports = router;
