const prisma = require("../configs/prisma");
// Obtener todos los productos con paginación y búsqueda
exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, searchTerm = "" } = req.query;
        const skip = (page - 1) * limit;

        let products = [];
        let totalProducts = 0;

        if (searchTerm.trim()) {
            const normalizedSearchTerm = searchTerm
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();

            const query = `
        SELECT * FROM "Products"
        WHERE 
          LOWER(name) ILIKE LOWER($1) OR
          LOWER(description) ILIKE LOWER($1)
        ORDER BY id_product
        LIMIT $2 OFFSET $3
      `;

            products = await prisma.$queryRawUnsafe(
                query,
                `%${normalizedSearchTerm}%`,
                parseInt(limit),
                parseInt(skip)
            );

            const countQuery = `
        SELECT COUNT(*) as total FROM "Products"
        WHERE 
          LOWER(name) ILIKE LOWER($1) OR
          LOWER(description) ILIKE LOWER($1)
      `;
            const totalResult = await prisma.$queryRawUnsafe(
                countQuery,
                `%${normalizedSearchTerm}%`
            );
            totalProducts = parseInt(totalResult[0].total);
        } else {
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
                    fecha_vencimiento: true,
                },
            });
        }

        // 🔄 Agregar el stock a cada producto (para ambos casos)
        const productIds = products.map((p) => p.id_product);

        const stockData = await Promise.all(
            productIds.map(async (id_product) => {
                const result = await prisma.stockMovements.aggregate({
                    where: { id_product },
                    _sum: { quantity: true },
                });
                return {
                    id_product,
                    stock: result._sum.quantity || 0,
                };
            })
        );

        // Mezclar el stock con los productos
        products = products.map((product) => {
            const stockInfo = stockData.find(
                (s) => s.id_product === product.id_product
            );
            return {
                ...product,
                stock: stockInfo?.stock || 0,
            };
        });

        res.json({
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            data: products,
        });
    } catch (error) {
        console.error("Error en getAll:", error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
};

// Crear un producto
exports.create = async (req, res) => {
    try {
        const { name, description, price, unit_type, id_category, fecha_vencimiento } = req.body;

        if (!name || !price || !unit_type || !id_category) {
            return res.status(400).json({ error: "Los campos nombre, precio, tipo de unidad y categoría son obligatorios" });
        }

        const dataToCreate = {
            name: name.trim(),
            price: parseFloat(price),
            unit_type,
            id_category: parseInt(id_category, 10),
            description: description?.trim(),
        };

        if (fecha_vencimiento) {
            dataToCreate.fecha_vencimiento = new Date(fecha_vencimiento);
        }

        const newProduct = await prisma.products.create({
            data: dataToCreate,
        });
        res.status(201).json(newProduct);
    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(400).json({ error: "Error al crear producto" });
    }
};

// Actualizar un producto
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, unit_type, id_category, status, sku, fecha_vencimiento } = req.body;

        const productId = parseInt(id, 10);
        if (isNaN(productId)) {
            return res.status(400).json({ error: "El ID del producto no es válido" });
        }

        const existingProduct = await prisma.products.findUnique({
            where: { id_product: productId },
        });

        if (!existingProduct) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        const dataToUpdate = {
            name: name?.trim(),
            description: description?.trim(),
            price: price !== undefined ? parseFloat(price) : undefined,
            unit_type,
            id_category: id_category !== undefined ? parseInt(id_category, 10) : undefined,
            status,
            sku: sku?.trim(),
        };

        if (fecha_vencimiento !== undefined) {
            dataToUpdate.fecha_vencimiento = fecha_vencimiento ? new Date(fecha_vencimiento) : null;
        }

        const updatedProduct = await prisma.products.update({
            where: { id_product: productId },
            data: dataToUpdate,
        });

        res.json(updatedProduct);
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ error: "Error al actualizar producto" });
    }
};