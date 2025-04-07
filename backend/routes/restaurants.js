const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth'); // Adjust path

const prisma = new PrismaClient();

// --- Restaurant Routes ---

// GET /api/restaurants (Public, basic pagination)
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // Future: Add search, location filtering parameters
    const skip = (page - 1) * limit;

    try {
        const restaurants = await prisma.restaurant.findMany({
            skip: skip,
            take: limit,
            orderBy: {
                name: 'asc' // Default sort by name
            }
            // Future: Add where clause for search/filtering
        });

        const totalRestaurants = await prisma.restaurant.count();

        res.json({
            data: restaurants,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(totalRestaurants / limit),
                totalItems: totalRestaurants
            }
        });

    } catch (error) {
        console.error('Get restaurants error:', error);
        res.status(500).json({ message: 'Internal server error fetching restaurants.' });
    }
});

// GET /api/restaurants/:restaurantId (Public)
router.get('/:restaurantId', async (req, res) => {
    const restaurantId = parseInt(req.params.restaurantId, 10);

    if (isNaN(restaurantId)) {
        return res.status(400).json({ message: 'Invalid restaurant ID format.' });
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            // Future: Include related reviews, average rating calculation, menu items?
        });

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        res.json(restaurant);

    } catch (error) {
        console.error('Get restaurant by ID error:', error);
        res.status(500).json({ message: 'Internal server error fetching restaurant.' });
    }
});

// --- Review Routes (Nested under Restaurants) ---

// GET /api/restaurants/:restaurantId/reviews (Public, with Pagination)
router.get('/:restaurantId/reviews', async (req, res) => {
    const restaurantId = parseInt(req.params.restaurantId, 10);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (isNaN(restaurantId)) {
        return res.status(400).json({ message: 'Invalid restaurant ID format.' });
    }

    try {
        // Check if restaurant exists
        const restaurantExists = await prisma.restaurant.count({ where: { id: restaurantId } });
        if (restaurantExists === 0) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        const reviews = await prisma.review.findMany({
            where: { restaurantId: restaurantId },
            skip: skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                author: {
                    select: { id: true, username: true }
                }
            }
        });

        const totalReviews = await prisma.review.count({ where: { restaurantId: restaurantId } });

        res.json({
            data: reviews,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(totalReviews / limit),
                totalItems: totalReviews
            }
        });

    } catch (error) {
        console.error('Get restaurant reviews error:', error);
        res.status(500).json({ message: 'Internal server error fetching restaurant reviews.' });
    }
});

// POST /api/restaurants/:restaurantId/reviews (Requires Authentication)
router.post('/:restaurantId/reviews', authenticateToken, async (req, res) => {
    const restaurantId = parseInt(req.params.restaurantId, 10);
    const authorId = req.user.id;
    const { rating, comment } = req.body;

    if (isNaN(restaurantId)) {
        return res.status(400).json({ message: 'Invalid restaurant ID format.' });
    }

    if (rating === undefined || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating is required and must be a number between 1 and 5.' });
    }

    try {
        // Check if restaurant exists
        const restaurantExists = await prisma.restaurant.count({ where: { id: restaurantId } });
        if (restaurantExists === 0) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        // Optional: Check if user has already reviewed this item
        const existingReview = await prisma.review.findFirst({
            where: { restaurantId: restaurantId, authorId: authorId }
        });
        if (existingReview) {
            return res.status(409).json({ message: 'You have already reviewed this restaurant.' });
        }

        const newReview = await prisma.review.create({
            data: {
                rating,
                comment: comment || null,
                restaurantId: restaurantId,
                authorId: authorId
            },
            include: {
                author: {
                    select: { id: true, username: true }
                }
            }
        });

        // Optional: Could trigger an update of the Restaurant's averageRating here

        res.status(201).json(newReview);

    } catch (error) {
        console.error('Create restaurant review error:', error);
        res.status(500).json({ message: 'Internal server error creating restaurant review.' });
    }
});

module.exports = router; 