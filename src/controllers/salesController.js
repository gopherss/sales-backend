const prisma = require("../configs/prisma");

// Obtener todas las ventas con paginación y búsqueda
exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, date } = req.query;

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
        const skip = Math.max(0, (pageNumber - 1) * limitNumber);

        let sales = [];
        let total = 0;

        if (search?.trim()) {
            const normalizedSearch = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

            const query = `
                SELECT s.*, c.name AS customer_name
                FROM "Sales" s
                LEFT JOIN "Customers" c ON s.id_customer = c.id_customer
                WHERE 
                    LOWER(c.name) ILIKE LOWER($1) OR
                    LOWER(s.payment_method) ILIKE LOWER($1)
                ORDER BY s.createdAt DESC
                LIMIT $2 OFFSET $3
            `;

            sales = await prisma.$queryRawUnsafe(query, `%${normalizedSearch}%`, limitNumber, skip);

            const countQuery = `
                SELECT COUNT(*) AS total
                FROM "Sales" s
                LEFT JOIN "Customers" c ON s.id_customer = c.id_customer
                WHERE 
                    LOWER(c.name) ILIKE LOWER($1) OR
                    LOWER(s.payment_method) ILIKE LOWER($1)
            `;
            const totalResult = await prisma.$queryRawUnsafe(countQuery, `%${normalizedSearch}%`);
            total = totalResult.length > 0 ? parseInt(totalResult[0].total) : 0;
        } else {
            total = await prisma.sales.count();
            sales = await prisma.sales.findMany({
                skip,
                take: limitNumber,
                orderBy: { createdAt: "desc" },
                include: {
                    customer: { select: { name: true } },
                    details: { include: { product: true } }
                }
            });
        }

        res.json({
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
            data: sales
        });
    } catch (error) {
        console.error("Error en getAll:", error);
        res.status(500).json({ error: "Error al obtener ventas" });
    }
};

// Crear una venta con validación de claves foráneas
exports.create = async (req, res) => {
    try {
        const { id_user, id_customer, payment_method, details } = req.body;

        if (!id_user || !id_customer || !payment_method || !details || details.length === 0) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }
        const userExists = await prisma.users.findUnique({ where: { id_user } });
        if (!userExists) {
            return res.status(404).json({ error: "El usuario no existe" });
        }
        const customerExists = await prisma.customers.findUnique({ where: { id_customer } });
        if (!customerExists) {
            return res.status(404).json({ error: "El cliente no existe" });
        }
        const productIds = details.map(d => d.id_product);
        const existingProducts = await prisma.products.findMany({
            where: { id_product: { in: productIds } },
            select: { id_product: true }
        });

        const existingProductIds = existingProducts.map(p => p.id_product);
        const missingProducts = productIds.filter(id => !existingProductIds.includes(id));

        if (missingProducts.length > 0) {
            return res.status(400).json({ error: `Los siguientes productos no existen: ${missingProducts.join(", ")}` });
        }

        for (const item of details) {
            const stock = await prisma.stockMovements.aggregate({
                _sum: { quantity: true },
                where: { id_product: item.id_product }
            });

            const stockActual = stock._sum.quantity || 0;
            if (stockActual < item.quantity) {
                return res.status(400).json({ error: `Stock insuficiente para el producto ID: ${item.id_product}` });
            }
        }
        const total = details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);

        const sale = await prisma.$transaction(async (prisma) => {
            const newSale = await prisma.sales.create({
                data: {
                    id_user,
                    id_customer,
                    payment_method,
                    total,
                    details: {
                        create: details.map(d => ({
                            id_product: d.id_product,
                            quantity: d.quantity,
                            unit_price: d.unit_price
                        }))
                    }
                },
                include: { details: true }
            });

            await prisma.stockMovements.createMany({
                data: details.map(d => ({
                    id_product: d.id_product,
                    quantity: -Math.abs(d.quantity),
                    movement_type: "OUT",
                    reference_id: newSale.id_sale
                }))
            });

            return newSale;
        });

        res.status(201).json(sale);
    } catch (error) {
        console.error("Error en create:", error);
        res.status(500).json({ error: "Error al registrar venta" });
    }
};


// Actualizar una venta y corregir stock
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_customer, payment_method, details } = req.body;

        // 1️⃣ Verificar si la venta existe
        const existingSale = await prisma.sales.findUnique({
            where: { id_sale: parseInt(id) },
            include: { details: true } // Trae los detalles actuales de la venta
        });

        if (!existingSale) {
            return res.status(404).json({ error: "Venta no encontrada" });
        }

        // 2️⃣ Restaurar el stock de los productos anteriores
        for (const detail of existingSale.details) {
            await prisma.stockMovements.create({
                data: {
                    id_product: detail.id_product,
                    quantity: detail.quantity,
                    movement_type: "IN", // Devuelve el stock
                    reference_id: parseInt(id)
                }
            });
        }

        // 3️⃣ Calcular el nuevo total de la venta
        let total = existingSale.total;
        if (details && details.length > 0) {
            total = details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);
        }

        // 4️⃣ Actualizar la venta y los detalles
        const updatedSale = await prisma.sales.update({
            where: { id_sale: parseInt(id) },
            data: {
                id_customer,
                payment_method,
                total,
                details: {
                    deleteMany: {}, // Eliminar detalles previos
                    create: details.map(d => ({
                        id_product: d.id_product,
                        quantity: d.quantity,
                        unit_price: d.unit_price
                    }))
                }
            },
            include: { details: true }
        });

        // 5️⃣ Registrar el nuevo movimiento de stock (descontar)
        for (const detail of details) {
            await prisma.stockMovements.create({
                data: {
                    id_product: detail.id_product,
                    quantity: detail.quantity,
                    movement_type: "OUT", // Descuenta del stock
                    reference_id: parseInt(id)
                }
            });
        }

        res.json(updatedSale);
    } catch (error) {
        console.error("Error en update:", error);
        res.status(400).json({ error: "Error al actualizar venta" });
    }
};
