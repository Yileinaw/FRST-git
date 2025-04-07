const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Optional Authentication Middleware:
 * Tries to verify JWT token from Authorization header.
 * If successful, attaches user info to req.user.
 * If token is missing or invalid, it proceeds without setting req.user and without error.
 */
const authenticateOptionally = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        // No token provided, proceed without authentication
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Verify user exists in DB (optional but good practice)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, email: true } // Select necessary fields
        });

        if (!user) {
            // User associated with token not found, proceed without auth
            console.warn(`[AuthOptional] User ID ${userId} from token not found in DB.`);
            return next();
        }

        // Token is valid and user exists, attach user to request
        req.user = user;
        console.log(`[AuthOptional] Authenticated user: ${user.username} (ID: ${user.id})`);
        next();

    } catch (err) {
        // Token is invalid (expired, wrong signature, etc.), proceed without auth
        if (err instanceof jwt.TokenExpiredError) {
            console.log('[AuthOptional] Token expired, proceeding unauthenticated.');
        } else if (err instanceof jwt.JsonWebTokenError) {
            console.warn('[AuthOptional] Invalid token, proceeding unauthenticated:', err.message);
        } else {
            console.error('[AuthOptional] Error during optional token verification:', err);
        }
        // Proceed to the next middleware/route handler without authenticated user
        next();
    }
};

module.exports = { authenticateOptionally }; 