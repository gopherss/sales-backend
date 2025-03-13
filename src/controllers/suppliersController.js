const prisma = require("../configs/prisma");

// Obtener todos los proveedores con paginación y búsqueda
exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, searchTerm = "" } = req.query;
        const skip = (page - 1) * limit;

        let suppliers = [];
        let totalSuppliers = 0;

        if (searchTerm) {
            // Normalización del término de búsqueda para insensibilidad a acentos
            const normalizedSearchTerm = searchTerm.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

            // Consulta SQL cruda para búsqueda insensible a acentos
            const query = `
                SELECT * FROM "Suppliers"
                WHERE 
                    LOWER(name) ILIKE LOWER($1) OR
                    LOWER(ruc) ILIKE LOWER($1) OR
                    LOWER(contact) ILIKE LOWER($1)
                ORDER BY "createdAt" DESC
                LIMIT $2 OFFSET $3
            `;

            // Ejecutar la consulta SQL cruda
            suppliers = await prisma.$queryRawUnsafe(
                query,
                `%${normalizedSearchTerm}%`,
                parseInt(limit),
                parseInt(skip)
            );

            // Contar total de proveedores que coinciden con el término de búsqueda
            const countQuery = `
                SELECT COUNT(*) as total FROM "Suppliers"
                WHERE 
                    LOWER(name) ILIKE LOWER($1) OR
                    LOWER(ruc) ILIKE LOWER($1) OR
                    LOWER(contact) ILIKE LOWER($1)
            `;
            const totalResult = await prisma.$queryRawUnsafe(countQuery, `%${normalizedSearchTerm}%`);
            totalSuppliers = parseInt(totalResult[0].total);
        } else {
            // Si no hay término de búsqueda, usar métodos integrados de Prisma
            totalSuppliers = await prisma.suppliers.count();
            suppliers = await prisma.suppliers.findMany({
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { createdAt: "desc" },
            });
        }

        res.json({
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalSuppliers,
            totalPages: Math.ceil(totalSuppliers / limit),
            data: suppliers,
        });
    } catch (error) {
        console.error("Error en getAll:", error);
        res.status(500).json({ error: "Error al obtener proveedores" });
    }
};


// Crear un proveedor
exports.create = async (req, res) => {
    try {
        const { name, ruc, contact, phone, address } = req.body;

        if (!name || !ruc) {
            return res.status(400).json({ error: "El nombre y el RUC son obligatorios" });
        }

        const newSupplier = await prisma.suppliers.create({
            data: { name, ruc, contact, phone, address },
        });

        res.status(201).json(newSupplier);
    } catch (error) {
        res.status(400).json({ error: "Error al crear proveedor" });
    }
};

// Actualizar un proveedor
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, ruc, contact, phone, address } = req.body;

        const existingSupplier = await prisma.suppliers.findUnique({ where: { id_supplier: parseInt(id) } });

        if (!existingSupplier) return res.status(404).json({ error: "Proveedor no encontrado" });

        const updatedSupplier = await prisma.suppliers.update({
            where: { id_supplier: parseInt(id) },
            data: { name, ruc, contact, phone, address },
        });

        res.json(updatedSupplier);
    } catch (error) {
        res.status(400).json({ error: "Error al actualizar proveedor" });
    }
};

