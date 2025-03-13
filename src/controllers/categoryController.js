const prisma = require("../configs/prisma");

// Obtener todas las categorías
exports.getAll = async (req, res) => {
    try {
        const categories = await prisma.categories.findMany();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener categorías" });
    }
};

// Crear una categoría
exports.create = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({ error: "El nombre de la categoría es requerido" });
        }

        // Verificar si la categoría ya existe
        const existingCategory = await prisma.categories.findUnique({
            where: { name: name.trim() },
        });

        if (existingCategory) {
            return res.status(400).json({ error: "La categoría ya existe" });
        }

        const newCategory = await prisma.categories.create({
            data: { name: name.trim() },
        });

        res.status(201).json(newCategory);
    } catch (error) {
        console.error("Error al crear categoría:", error);
        res.status(400).json({ error: "Error al crear categoría" });
    }
};


// Actualizar una categoría
exports.update = async (req, res) => {
    try {
        const { name } = req.body;
        const { id } = req.params;
        const categoryId = parseInt(id, 10);

        if (!name || name.trim() === "") {
            return res.status(400).json({ error: "El nombre de la categoría es requerido" });
        }

        // Verificar si la categoría existe
        const category = await prisma.categories.findUnique({
            where: { id_category: categoryId }
        });

        if (!category) {
            return res.status(404).json({ error: "Categoría no encontrada" });
        }

        const updatedCategory = await prisma.categories.update({
            where: { id_category: categoryId },
            data: { name: name.trim() },
        });

        res.json(updatedCategory);
    } catch (error) {
        console.error("Error en update:", error);
        res.status(400).json({ error: "Error al actualizar categoría" });
    }
};



