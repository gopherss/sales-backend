const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;

// Middleware para verificar autenticación
exports.authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No autorizado" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
};

// Middleware para verificar roles
exports.roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Acceso denegado role no permitodo" });
        }
        next();
    };
};
