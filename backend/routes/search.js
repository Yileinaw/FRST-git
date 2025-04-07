const express = require('express');
const router = express.Router();
const { PrismaClient, CollectionType } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/search (Public)
router.get('/', async (req, res) => {
    const query = req.query.query;
    const limit = parseInt(req.query.limit) || 5; // Limit results per type

    if (!query) {
        return res.status(400).json({ message: 'Search query parameter is required.' });
    }

    try {
        // Search Posts (title or content)
        const posts = await prisma.post.findMany({
            where: {
                OR: [
                    { title: { contains: query /*, mode: 'insensitive' */ } }, // mode: 'insensitive' is for PostgreSQL
                    { content: { contains: query /*, mode: 'insensitive' */ } }
                ]
            },
            take: limit,
            select: { id: true, title: true, content: true, author: { select: { username: true } } } // Select relevant fields
        });

        // Search Food Items (name or description)
        const foodItems = await prisma.foodItem.findMany({
            where: {
                OR: [
                    { name: { contains: query /*, mode: 'insensitive' */ } },
                    { description: { contains: query /*, mode: 'insensitive' */ } }
                ]
            },
            take: limit,
            select: { id: true, name: true, description: true, category: true } // Select relevant fields
        });

        // Search Restaurants (name or description)
        const restaurants = await prisma.restaurant.findMany({
            where: {
                OR: [
                    { name: { contains: query /*, mode: 'insensitive' */ } },
                    { description: { contains: query /*, mode: 'insensitive' */ } }
                ]
            },
            take: limit,
            select: { id: true, name: true, description: true, address: true } // Select relevant fields
        });

        // Combine results with type information
        const results = [
            ...posts.map(item => ({ type: 'POST', ...item })),
            ...foodItems.map(item => ({ type: 'FOOD', ...item })),
            ...restaurants.map(item => ({ type: 'RESTAURANT', ...item }))
        ];

        // Simple relevance sort (optional - more complex ranking is possible)
        // results.sort((a, b) => { /* a simple relevance logic */ });

        res.json({ data: results });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Internal server error during search.' });
    }
});

module.exports = router; 