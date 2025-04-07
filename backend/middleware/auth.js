const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

    if (token == null) {
        return res.sendStatus(401); // No token provided
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('JWT_SECRET is not defined in .env file.');
        return res.status(500).json({ message: 'Internal server error: JWT configuration missing.' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);

        // Optional: Check if user still exists in DB (more secure but adds DB call)
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, username: true, email: true } // Select only necessary fields
        });

        if (!user) {
            return res.sendStatus(403); // User associated with token not found
        }

        req.user = user; // Attach user information (without password hash) to the request
        next(); // Proceed to the next middleware or route handler

    } catch (err) {
        console.error('JWT Verification Error:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }
        return res.sendStatus(403); // Invalid token (Forbidden)
    }
};

module.exports = authenticateToken; 