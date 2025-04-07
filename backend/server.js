require('dotenv').config();

// --- Global Error Handlers ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
    process.exit(1); // Exit process on unhandled rejection
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception thrown:', error);
    // Application specific logging, throwing an error, or other logic here
    process.exit(1); // Exit process on uncaught exception
});
// --- End Global Error Handlers ---

const express = require('express');
const { PrismaClient } = require('@prisma/client');
// const authenticateToken = require('./middleware/auth'); // Middleware is now used within routes
const cors = require('cors'); // Import cors
const path = require('path');

// Import route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts'); // <<< Restore this require
// console.log('[DEBUG] Imported postRoutes: typeof=', typeof postRoutes, '| keys=', postRoutes ? Object.keys(postRoutes) : 'null');
const foodRoutes = require('./routes/food');
const restaurantRoutes = require('./routes/restaurants');
const collectionRoutes = require('./routes/collections');
const searchRoutes = require('./routes/search');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

// --- Global Middleware ---
// Enable CORS for all origins (adjust for production)
app.use(cors());

// Increase payload size limits for JSON and URL-encoded data
app.use(express.json({ limit: '10mb' })); // Increase JSON limit for things like Data URLs
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Increase URL-encoded limit as well

// Basic logging middleware (optional but helpful)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- Restore mounting API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes); // <<< Restore this mount
app.use('/api/food', foodRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/search', searchRoutes);
// -----------------------------------

// --- Basic Root Route (Optional) ---
app.get('/', (req, res) => {
    res.send('FRS Backend API is running!');
});

// --- Centralized Error Handling --- 
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.stack);
    res.status(500).send('Something broke!');
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    console.log('Prisma Client disconnected. Server shutting down.');
    process.exit(0);
});