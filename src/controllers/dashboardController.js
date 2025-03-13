const prisma = require("../configs/prisma");

exports.getSalesSummary = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const [salesToday, salesWeek, salesMonth, salesYear] = await Promise.all([
            prisma.sales.aggregate({
                _sum: { total: true },
                where: { date: { gte: startOfDay } }
            }),
            prisma.sales.aggregate({
                _sum: { total: true },
                where: { date: { gte: startOfWeek } }
            }),
            prisma.sales.aggregate({
                _sum: { total: true },
                where: { date: { gte: startOfMonth } }
            }),
            prisma.sales.aggregate({
                _sum: { total: true },
                where: { date: { gte: startOfYear } }
            })
        ]);

        res.json({
            salesToday: salesToday._sum.total || 0,
            salesWeek: salesWeek._sum.total || 0,
            salesMonth: salesMonth._sum.total || 0,
            salesYear: salesYear._sum.total || 0
        });
    } catch (error) {
        console.error("Error en getSalesSummary:", error);
        res.status(500).json({ error: "Error al obtener resumen de ventas" });
    }
};

exports.getPaymentMethods = async (req, res) => {
    try {
        const paymentMethods = await prisma.sales.groupBy({
            by: ["payment_method"],
            _count: { payment_method: true },
            orderBy: { _count: { payment_method: "desc" } }
        });

        res.json(paymentMethods.map(pm => ({
            method: pm.payment_method,
            count: pm._count.payment_method
        })));
    } catch (error) {
        console.error("Error en getPaymentMethods:", error);
        res.status(500).json({ error: "Error al obtener los métodos de pago más utilizados" });
    }
};

exports.getTopProducts = async (req, res) => {
    try {
        const topProducts = await prisma.saleDetails.groupBy({
            by: ["id_product"],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: "desc" } },
            take: 5 // Obtener los 5 productos más vendidos
        });

        // Obtener detalles de los productos
        const products = await prisma.products.findMany({
            where: { id_product: { in: topProducts.map(p => p.id_product) } },
            select: { id_product: true, name: true, sku: true }
        });

        // Unir datos
        const response = topProducts.map(p => {
            const product = products.find(prod => prod.id_product === p.id_product);
            return {
                id_product: p.id_product,
                name: product?.name || "Desconocido",
                sku: product?.sku || "N/A",
                total_sold: p._sum.quantity
            };
        });

        res.json(response);
    } catch (error) {
        console.error("Error en getTopProducts:", error);
        res.status(500).json({ error: "Error al obtener los productos más vendidos" });
    }
};

exports.getTopUsers = async (req, res) => {
    try {
        const topUsers = await prisma.sales.groupBy({
            by: ["id_user"],
            _count: { id_sale: true },
            _sum: { total: true },
            orderBy: { _sum: { total: "desc" } },
            take: 5 // Obtener los 5 usuarios con más ventas
        });

        // Obtener detalles de los usuarios
        const users = await prisma.users.findMany({
            where: { id_user: { in: topUsers.map(u => u.id_user) } },
            select: { id_user: true, name: true, role: true }
        });

        // Unir datos
        const response = topUsers.map(u => {
            const user = users.find(user => user.id_user === u.id_user);
            return {
                id_user: u.id_user,
                name: user?.name || "Desconocido",
                role: user?.role || "N/A",
                total_sales: u._count.id_sale,
                total_sold: u._sum.total
            };
        });

        res.json(response);
    } catch (error) {
        console.error("Error en getTopUsers:", error);
        res.status(500).json({ error: "Error al obtener los usuarios con más ventas" });
    }
};

exports.getTopCustomers = async (req, res) => {
    try {
        const topCustomers = await prisma.sales.groupBy({
            by: ["id_customer"],
            _count: { id_sale: true },
            _sum: { total: true },
            orderBy: { _sum: { total: "desc" } },
            take: 5 // Obtener los 5 clientes con más compras
        });

        // Obtener detalles de los clientes
        const customers = await prisma.customers.findMany({
            where: { id_customer: { in: topCustomers.map(c => c.id_customer) } },
            select: { id_customer: true, name: true, first_surname: true, second_surname: true }
        });

        // Unir datos
        const response = topCustomers.map(c => {
            const customer = customers.find(customer => customer.id_customer === c.id_customer);
            return {
                id_customer: c.id_customer,
                name: customer ? `${customer.name} ${customer.first_surname} ${customer.second_surname}` : "Desconocido",
                total_purchases: c._count.id_sale,
                total_spent: c._sum.total
            };
        });

        res.json(response);
    } catch (error) {
        console.error("Error en getTopCustomers:", error);
        res.status(500).json({ error: "Error al obtener los clientes con más compras" });
    }
};
