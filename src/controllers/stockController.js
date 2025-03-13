const prisma = require("../configs/prisma");

// Obtener stock de productos con detalles
exports.getAllStock = async (req, res) => {
    try {
        const { page = 1, limit = 10, searchTerm = "" } = req.query;
        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
        const skip = Math.max(0, (pageNumber - 1) * limitNumber);

        let stock = [];
        let totalProducts = 0;

        if (searchTerm.trim()) {
            const normalizedSearchTerm = searchTerm.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

            const query = `
                SELECT p.id_product, p.name, p.sku, p.price, p.unit_type, 
                    COALESCE(c.name, 'Sin categoría') AS category,
                    COALESCE(
                        SUM(sm.quantity), 0
                    ) AS stock
                FROM "Products" p
                LEFT JOIN "Categories" c ON p.id_category = c.id_category
                LEFT JOIN "StockMovements" sm ON sm.id_product = p.id_product
                WHERE 
                    LOWER(p.name) ILIKE LOWER($1) OR
                    LOWER(p.sku) ILIKE LOWER($1)
                GROUP BY p.id_product, c.name
                ORDER BY p.id_product
                LIMIT $2 OFFSET $3;
            `;

            stock = await prisma.$queryRawUnsafe(query, `%${normalizedSearchTerm}%`, limitNumber, skip);

            const countQuery = `
                SELECT COUNT(DISTINCT p.id_product) AS total
                FROM "Products" p
                WHERE 
                    LOWER(p.name) ILIKE LOWER($1) OR
                    LOWER(p.sku) ILIKE LOWER($1);
            `;
            const totalResult = await prisma.$queryRawUnsafe(countQuery, `%${normalizedSearchTerm}%`);
            totalProducts = totalResult.length > 0 ? parseInt(totalResult[0].total) : 0;
        } else {
            totalProducts = await prisma.products.count();
            const products = await prisma.products.findMany({
                skip,
                take: limitNumber,
                include: {
                    category: {
                        select: { name: true }
                    },
                    StockMovements: {
                        select: {
                            quantity: true
                        }
                    }
                }
            });

            stock = products.map(product => {
                const totalStock = (product.StockMovements || []).reduce((total, mov) => total + mov.quantity, 0);

                return {
                    id_product: product.id_product,
                    name: product.name,
                    sku: product.sku,
                    price: product.price,
                    unit_type: product.unit_type,
                    category: product.category?.name || "Sin categoría",
                    stock: totalStock
                };
            });
        }

        res.json({
            page: pageNumber,
            limit: limitNumber,
            total: totalProducts,
            totalPages: Math.ceil(totalProducts / limitNumber),
            data: stock
        });
    } catch (error) {
        console.error("Error en getAllStock:", error);
        res.status(500).json({ error: "Error al obtener stock" });
    }
};
