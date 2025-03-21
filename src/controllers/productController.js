const prisma = require("../configs/prisma");
// Obtener todos los productos con paginación y búsqueda
exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, searchTerm = "" } = req.query;
        const skip = (page - 1) * limit;

        let products = [];
        let totalProducts = 0;

        if (searchTerm) {
            // Use raw SQL for accent-insensitive search
            const normalizedSearchTerm = searchTerm.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

            // Raw SQL query for PostgreSQL (adjust for your database)
            const query = `
                SELECT * FROM "Products"
                WHERE 
                    LOWER(name) ILIKE LOWER($1) OR
                    LOWER(description) ILIKE LOWER($1)
                ORDER BY id_product
                LIMIT $2 OFFSET $3
            `;

            // Execute the raw query
            products = await prisma.$queryRawUnsafe(
                query,
                `%${normalizedSearchTerm}%`,
                parseInt(limit),
                parseInt(skip)
            );

            // Count total products matching the search term
            const countQuery = `
                SELECT COUNT(*) as total FROM "Products"
                WHERE 
                    LOWER(name) ILIKE LOWER($1) OR
                    LOWER(description) ILIKE LOWER($1)
            `;
            const totalResult = await prisma.$queryRawUnsafe(countQuery, `%${normalizedSearchTerm}%`);
            totalProducts = parseInt(totalResult[0].total);
        } else {
            // If no search term, use Prisma's built-in methods
            totalProducts = await prisma.products.count();
            products = await prisma.products.findMany({
                skip: parseInt(skip),
                take: parseInt(limit),
                select: {
                    id_product: true,
                    name: true,
                    description: true,
                    sku: true,
                    price: true,
                    unit_type: true,
                    status: true,
                    createdAt: true,
                    id_category: true,
                }
            });
        }

        res.json({
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            data: products
        });
    } catch (error) {
        console.error("Error en getAll:", error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
};

// Crear un producto
exports.create = async (req, res) => {
    try {
        const { name, description, price, unit_type, id_category } = req.body;

        if (!name || !price || !unit_type || !id_category) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        const newProduct = await prisma.products.create({
            data: {
                name: name.trim(),
                description: description?.trim(),
                price: parseFloat(price),
                unit_type,
                id_category: parseInt(id_category, 10)
            },
        });
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ error: "Error al crear producto" });
    }
};

// Actualizar un producto
exports.update = async (req, res) => {
    try {
        const { name, description, sku, price, unit_type, id_category, status } = req.body;
        const id = parseInt(req.params.id, 10);

        // Verificar si el producto existe
        const product = await prisma.products.findUnique({ where: { id_product: id } });

        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        if (product.sku !== sku) {
            const existingSku = await prisma.products.findUnique({ where: { sku } });

            if (existingSku) {
                return res.status(400).json({ message: "El SKU ya está en uso. Elige otro." });
            }
        }

        const updatedProduct = await prisma.products.update({
            where: { id_product: id },
            data: {
                name: name?.trim(),
                description: description?.trim(),
                sku,
                price: parseFloat(price),
                unit_type,
                id_category: parseInt(id_category, 10),
                status: Boolean(status)
            },
        });

        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ error: "Error al actualizar producto" });
    }
};
