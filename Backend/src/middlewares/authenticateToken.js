import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) return res.status(401).json({ message: "Missing token" });

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        // payload contains { userId, role }
        req.user = { id: payload.userId, role: payload.role };
        next();
    });
};
