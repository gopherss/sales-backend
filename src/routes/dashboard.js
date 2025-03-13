const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');

// Rutas protegidas para dashboard
router.get("/sales-summary", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getSalesSummary);
router.get("/payment-methods", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getPaymentMethods);
router.get("/top-products", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getTopProducts);
router.get("/top-users", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getTopUsers);

router.get("/top-customers", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getTopCustomers);

module.exports = router;
