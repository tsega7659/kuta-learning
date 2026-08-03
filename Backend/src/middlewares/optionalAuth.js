import jwt from "jsonwebtoken";

export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return next();

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) return next();
        req.user = { id: payload.userId, role: payload.role };
        next();
    });
};

