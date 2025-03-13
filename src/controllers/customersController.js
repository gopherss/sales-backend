const prisma = require("../configs/prisma");

// Obtener todos los clientes con paginación y búsqueda
exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, searchTerm = "" } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let customers = [];
        let totalCustomers = 0;

        if (searchTerm) {
            // Normalización del término de búsqueda para insensibilidad a acentos
            const normalizedSearchTerm = searchTerm.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

            // Consulta SQL cruda para búsqueda insensible a acentos
            const query = `
                SELECT * FROM "Customers"
                WHERE 
                    LOWER(name) ILIKE LOWER($1) OR
                    LOWER(first_surname) ILIKE LOWER($1) OR
                    LOWER(second_surname) ILIKE LOWER($1) OR
                    LOWER(dni) ILIKE LOWER($1)
                ORDER BY "createdAt" DESC
                LIMIT $2 OFFSET $3
            `;

            // Ejecutar la consulta SQL cruda
            customers = await prisma.$queryRawUnsafe(
                query,
                `%${normalizedSearchTerm}%`,
                parseInt(limit),
                parseInt(skip)
            );

            // Contar total de clientes que coinciden con el término de búsqueda
            const countQuery = `
                SELECT COUNT(*) as total FROM "Customers"
                WHERE 
                    LOWER(name) ILIKE LOWER($1) OR
                    LOWER(first_surname) ILIKE LOWER($1) OR
                    LOWER(second_surname) ILIKE LOWER($1) OR
                    LOWER(dni) ILIKE LOWER($1)
            `;
            const totalResult = await prisma.$queryRawUnsafe(countQuery, `%${normalizedSearchTerm}%`);
            totalCustomers = parseInt(totalResult[0].total);
        } else {
            // Si no hay término de búsqueda, usar métodos integrados de Prisma
            totalCustomers = await prisma.customers.count();
            customers = await prisma.customers.findMany({
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { createdAt: "desc" },
            });
        }

        res.json({
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCustomers,
            totalPages: Math.ceil(totalCustomers / limit),
            data: customers,
        });
    } catch (error) {
        console.error("Error en getAll:", error);
        res.status(500).json({ error: "Error al obtener clientes" });
    }
};

// Crear un cliente
exports.create = async (req, res) => {
    try {
        const { name, first_surname, second_surname, dni } = req.body;

        // Validación de campos obligatorios
        if (!name || !first_surname || !second_surname) {
            return res.status(400).json({ error: "Nombre y apellido son obligatorios" });
        }

        // Validación de DNI
        if (!dni || !/^\d{8}$/.test(dni)) {
            return res.status(400).json({ error: "El DNI debe tener exactamente 8 dígitos" });
        }

        const existingCustomer = await prisma.customers.findUnique({ where: { dni } });
        if (existingCustomer) {
            return res.status(400).json({ error: "El DNI ya está registrado" });
        }


        const newCustomer = await prisma.customers.create({
            data: { name, first_surname, second_surname, dni }
        });

        res.status(201).json(newCustomer);
    } catch (error) {
        console.error("Error en create:", error);
        res.status(400).json({ error: "Error al crear cliente" });
    }
};

// Actualizar un cliente
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, first_surname, second_surname, dni } = req.body;

        if (!name && !first_surname && !second_surname && !dni) {
            return res.status(400).json({ error: "Debe proporcionar al menos un campo para actualizar" });
        }

        const customer = await prisma.customers.findUnique({
            where: { id_customer: parseInt(id) }
        });

        if (!customer) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        const updatedCustomer = await prisma.customers.update({
            where: { id_customer: parseInt(id) },
            data: { name, first_surname, second_surname, dni }
        });

        res.json(updatedCustomer);
    } catch (error) {
        console.error("Error en update:", error);
        res.status(400).json({ error: "Error al actualizar cliente" });
    }
};

// Función para consultar la API externa
const fetchExternalCustomer = async (dni) => {
    try {
        const apiUrl = process.env.URL_API_PERU;
        const apiToken = process.env.TOKEN_API_PERU;

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiToken}`
            },
            body: JSON.stringify({ dni })
        });

        if (!response.ok) {
            console.error("Error en API externa:", response.status, response.statusText);
            return null;
        }

        const apiData = await response.json();

        if (apiData.success && apiData.data?.nombres) {
            return {
                dni,
                name: apiData.data.nombres,
                first_surname: apiData.data.apellido_paterno,
                second_surname: apiData.data.apellido_materno
            };
        }
        return null;
    } catch (error) {
        console.error("Error al conectar con la API externa:", error);
        return null;
    }
};

// Buscar un cliente por DNI
exports.searchByDni = async (req, res) => {
    try {
        const { dni } = req.query;
        if (!dni || !/^\d{8}$/.test(dni)) {
            return res.status(400).json({ error: "El DNI debe tener exactamente 8 dígitos" });
        }

        // 1. Buscar en la base de datos local
        let customer = await prisma.customers.findUnique({ where: { dni } });

        if (customer) {
            return res.json({ found: true, source: "local", data: customer });
        }

        // 2. Consultar en la API externa
        const externalCustomer = await fetchExternalCustomer(dni);

        if (externalCustomer) {
            // 3. Si se encuentra en la API externa, registrar en la base de datos local
            customer = await prisma.customers.create({
                data: externalCustomer
            });

            return res.json({ found: true, source: "external", data: customer });
        }

        // 4. Si no se encuentra en ninguna fuente, devolver mensaje
        return res.json({ found: false, message: "Datos no encontrados, registrar manualmente" });

    } catch (error) {
        console.error("Error en searchByDni:", error);
        return res.status(500).json({ error: "Error al buscar cliente por DNI" });
    }
};
