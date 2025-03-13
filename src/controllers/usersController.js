const prisma = require("../configs/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
const SECRET_KEY = process.env.JWT_SECRET;

// Inicio de sesión
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.users.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password)) || !user.status) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        const accessToken = jwt.sign({ id: user.id_user, role: user.role }, SECRET_KEY, { expiresIn: "15m" });
        const refreshToken = uuidv4();
        const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Expira en 7 días

        await prisma.users.update({
            where: { id_user: user.id_user },
            data: { refreshToken, refreshTokenExpiresAt }
        });

        res.json({ accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ error: "Error en el login" });
    }
};

//renovar el Access Token
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ error: "No se proporcionó un refreshToken" });
        }

        const user = await prisma.users.findUnique({ where: { refreshToken } });

        if (!user) {
            return res.status(403).json({ error: "Refresh token inválido" });
        }

        // Verificar si el token ha expirado
        if (!user.refreshTokenExpiresAt || new Date() > user.refreshTokenExpiresAt) {
            return res.status(403).json({ error: "Refresh token expirado" });
        }

        // Generar nuevo Access Token y Refresh Token
        const newAccessToken = jwt.sign({ id: user.id_user, role: user.role }, SECRET_KEY, { expiresIn: "15m" });
        const newRefreshToken = uuidv4();
        const newRefreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Guardar el nuevo refreshToken en la BD
        await prisma.users.update({
            where: { id_user: user.id_user },
            data: { refreshToken: newRefreshToken, refreshTokenExpiresAt: newRefreshTokenExpiresAt }
        });

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });

    } catch (error) {
        res.status(500).json({ error: "Error al refrescar el token", details: error.message });
    }
};


//cerrar sesión y revocar el Refresh Token
exports.logout = async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.users.update({
            where: { id_user: userId },
            data: { refreshToken: null, refreshTokenExpiresAt: null }
        });

        res.json({ message: "Sesión cerrada con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al cerrar sesión" });
    }
};


// Registro de usuario
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: "Todos los campos son obligatorios." });
        }
        const existingUser = await prisma.users.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "El email ya está en uso. Elige otro." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.users.create({
            data: { name, email, password: hashedPassword, role }
        });
        res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (error) {
        res.status(400).json({ error: "Error al registrar usuario" });
    }
};
// Obtener perfil del usuario logueado
exports.getProfile = async (req, res) => {
    try {
        const user = await prisma.users.findUnique({
            where: { id_user: req.user.id },
            select: { id_user: true, name: true, email: true, role: true, status: true, createdAt: true }
        });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el perfil del usuario" });
    }
};

// Obtener todos los usuarios con páginación y busqueda
exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, searchTerm = "" } = req.query;
        const skip = (page - 1) * limit;
        const where = searchTerm
            ? {
                OR: [
                    { name: { contains: searchTerm, mode: "insensitive" } },
                    { email: { contains: searchTerm, mode: "insensitive" } }
                ]
            }
            : {};

        const totalUsers = await prisma.users.count({ where });

        const users = await prisma.users.findMany({
            where,
            ...(searchTerm ? {}
                : { skip: parseInt(skip), take: parseInt(limit) }),
            select: {
                id_user: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true
            }
        });

        res.json({
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
            data: users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
};

// Actualizar usuario (solo ADMIN y ROOT pueden modificar usuarios)
exports.update = async (req, res) => {
    try {
        const { name, email, password, role, status } = req.body;
        const updatedData = {};
        if (name) updatedData.name = name;
        if (email) updatedData.email = email;
        if (role) updatedData.role = role;
        if (status !== undefined) updatedData.status = status;
        if (password && password.trim() !== "") {
            updatedData.password = await bcrypt.hash(password, 10);
        }
        const updatedUser = await prisma.users.update({
            where: { id_user: parseInt(req.params.id) },
            data: updatedData,
            select: { id_user: true, name: true, email: true, role: true, status: true, updatedAt: true }
        });
        res.json(updatedUser);
    } catch (error) {
        console.error("Error en update:", error);
        res.status(400).json({ error: "Error al actualizar usuario" });
    }
};