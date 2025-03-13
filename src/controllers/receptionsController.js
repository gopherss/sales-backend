const prisma = require("../configs/prisma");

// Obtener todas las recepciones con paginación y búsqueda
exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, searchTerm = "" } = req.query;
        const skip = (page - 1) * limit;

        // Normalización del término de búsqueda para insensibilidad a acentos
        const normalizedSearchTerm = searchTerm.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        // Consulta SQL cruda para búsqueda insensible a acentos
        const query = `
            SELECT pr.*, 
                   p.id_product, p.name AS product_name, p.price,
                   s.id_supplier, s.name AS supplier_name,
                   u.id_user, u.name AS user_name
            FROM "ProductReceptions" pr
            LEFT JOIN "Products" p ON pr.id_product = p.id_product
            LEFT JOIN "Suppliers" s ON pr.id_supplier = s.id_supplier
            LEFT JOIN "Users" u ON pr.id_user = u.id_user
            WHERE 
                LOWER(p.name) ILIKE LOWER($1) OR
                LOWER(s.name) ILIKE LOWER($1) OR
                LOWER(u.name) ILIKE LOWER($1)
            ORDER BY pr."createdAt" DESC
            LIMIT $2 OFFSET $3
        `;

        // Ejecutar la consulta SQL cruda
        const receptions = await prisma.$queryRawUnsafe(
            query,
            `%${normalizedSearchTerm}%`,
            parseInt(limit),
            parseInt(skip)
        );

        // Contar total de recepciones que coinciden con el término de búsqueda
        const countQuery = `
            SELECT COUNT(*) as total FROM "ProductReceptions" pr
            LEFT JOIN "Products" p ON pr.id_product = p.id_product
            LEFT JOIN "Suppliers" s ON pr.id_supplier = s.id_supplier
            LEFT JOIN "Users" u ON pr.id_user = u.id_user
            WHERE 
                LOWER(p.name) ILIKE LOWER($1) OR
                LOWER(s.name) ILIKE LOWER($1) OR
                LOWER(u.name) ILIKE LOWER($1)
        `;
        const totalResult = await prisma.$queryRawUnsafe(countQuery, `%${normalizedSearchTerm}%`);
        const total = parseInt(totalResult[0].total);

        res.json({
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data: receptions
        });
    } catch (error) {
        console.error("Error en getAll:", error.message);
        res.status(500).json({ error: "Error al obtener las recepciones" });
    }
};


// Crear una nueva recepción
exports.create = async (req, res) => {
    try {
        const { id_product, quantity, purchase_price, id_supplier, id_user, date } = req.body;

        // Validar que los datos requeridos estén presentes
        if (!id_product || !quantity || !purchase_price || !id_supplier || !id_user) {
            return res.status(400).json({ error: "Faltan datos requeridos" });
        }

        // Si se proporciona un date, validarlo, de lo contrario usar la fecha actual
        const receptionDate = date ? new Date(date) : new Date();
        if (isNaN(receptionDate.getTime())) {
            return res.status(400).json({ error: "Fecha inválida" });
        }

        // Validar existencia de id_product, id_supplier, y id_user
        const validateExistence = async (model, id, errorMessage) => {
            const record = await prisma[model].findUnique({ where: { [id]: req.body[id] } });
            if (!record) {
                throw new Error(errorMessage);
            }
            return record;
        };

        await validateExistence('products', 'id_product', "El producto no existe");
        await validateExistence('suppliers', 'id_supplier', "El proveedor no existe");
        await validateExistence('users', 'id_user', "El usuario no existe");

        // Crear la recepción con la fecha proporcionada
        const newReception = await prisma.productReceptions.create({
            data: { id_product, quantity, purchase_price, id_supplier, id_user, date: receptionDate }
        });

        // Registrar el movimiento de stock
        await prisma.stockMovements.create({
            data: {
                id_product,
                quantity,
                movement_type: "IN",
                reference_id: newReception.id_reception
            }
        });

        res.status(201).json(newReception);
    } catch (error) {
        console.error("Error en create:", error.message);
        res.status(500).json({ error: error.message || "Error al crear la recepción" });
    }
};


// Actualizar una recepción
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_product, quantity, purchase_price, id_supplier, id_user } = req.body;

        const reception = await prisma.productReceptions.findUnique({ where: { id_reception: parseInt(id) } });

        if (!reception) return res.status(404).json({ error: "Recepción no encontrada" });

        // Funciones de validación
        const validateExistence = async (model, id, errorMessage) => {
            const record = await prisma[model].findUnique({ where: { [id]: req.body[id] } });
            if (!record) {
                throw new Error(errorMessage);
            }
            return record;
        };

        // Validar existencia de id_product, id_supplier, y id_user si se proporcionan
        if (id_product) await validateExistence('products', 'id_product', "El producto no existe");
        if (id_supplier) await validateExistence('suppliers', 'id_supplier', "El proveedor no existe");
        if (id_user) await validateExistence('users', 'id_user', "El usuario no existe");

        const updatedReception = await prisma.productReceptions.update({
            where: { id_reception: parseInt(id) },
            data: { id_product, quantity, purchase_price, id_supplier, id_user }
        });

        res.json(updatedReception);
    } catch (error) {
        console.error("Error en update:", error.message);
        res.status(500).json({ error: error.message || "Error al actualizar la recepción" });
    }
};
