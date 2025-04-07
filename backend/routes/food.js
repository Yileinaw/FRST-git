const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth'); // Adjust path

const prisma = new PrismaClient();

// --- Food Routes ---

// GET /api/food (Public, basic pagination)
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // Future: Add search, category filtering parameters
    const skip = (page - 1) * limit;

    try {
        const foodItems = await prisma.foodItem.findMany({
            skip: skip,
            take: limit,
            orderBy: {
                name: 'asc' // Default sort by name
            }
            // Future: Add where clause for search/filtering
        });

        const totalFoodItems = await prisma.foodItem.count();

        res.json({
            data: foodItems,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(totalFoodItems / limit),
                totalItems: totalFoodItems
            }
        });

    } catch (error) {
        console.error('Get food items error:', error);
        res.status(500).json({ message: 'Internal server error fetching food items.' });
    }
});

// GET /api/food/:foodId (Public)
router.get('/:foodId', async (req, res) => {
    const foodId = parseInt(req.params.foodId, 10);

    if (isNaN(foodId)) {
        return res.status(400).json({ message: 'Invalid food ID format.' });
    }

    try {
        const foodItem = await prisma.foodItem.findUnique({
            where: { id: foodId },
            // Future: Include related reviews, average rating calculation?
        });

        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found.' });
        }

        res.json(foodItem);

    } catch (error) {
        console.error('Get food item by ID error:', error);
        res.status(500).json({ message: 'Internal server error fetching food item.' });
    }
});

// --- Review Routes (Nested under Food) ---

// GET /api/food/:foodId/reviews (Public, with Pagination)
router.get('/:foodId/reviews', async (req, res) => {
    const foodId = parseInt(req.params.foodId, 10);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (isNaN(foodId)) {
        return res.status(400).json({ message: 'Invalid food ID format.' });
    }

    try {
        // Check if food item exists
        const foodExists = await prisma.foodItem.count({ where: { id: foodId } });
        if (foodExists === 0) {
            return res.status(404).json({ message: 'Food item not found.' });
        }

        const reviews = await prisma.review.findMany({
            where: { foodItemId: foodId },
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

        const totalReviews = await prisma.review.count({ where: { foodItemId: foodId } });

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
        console.error('Get food reviews error:', error);
        res.status(500).json({ message: 'Internal server error fetching food reviews.' });
    }
});

// POST /api/food/:foodId/reviews (Requires Authentication)
router.post('/:foodId/reviews', authenticateToken, async (req, res) => {
    const foodId = parseInt(req.params.foodId, 10);
    const authorId = req.user.id;
    const { rating, comment } = req.body;

    if (isNaN(foodId)) {
        return res.status(400).json({ message: 'Invalid food ID format.' });
    }

    if (rating === undefined || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating is required and must be a number between 1 and 5.' });
    }

    try {
        // Check if food item exists
        const foodExists = await prisma.foodItem.count({ where: { id: foodId } });
        if (foodExists === 0) {
            return res.status(404).json({ message: 'Food item not found.' });
        }

        // Optional: Check if user has already reviewed this item (prevent multiple reviews)
        const existingReview = await prisma.review.findFirst({
            where: { foodItemId: foodId, authorId: authorId }
        });
        if (existingReview) {
            return res.status(409).json({ message: 'You have already reviewed this item.' });
        }

        const newReview = await prisma.review.create({
            data: {
                rating,
                comment: comment || null,
                foodItemId: foodId,
                authorId: authorId
            },
            include: {
                author: {
                    select: { id: true, username: true }
                }
            }
        });

        // Optional: Could trigger an update of the FoodItem's averageRating here

        res.status(201).json(newReview);

    } catch (error) {
        console.error('Create food review error:', error);
        res.status(500).json({ message: 'Internal server error creating food review.' });
    }
});

module.exports = router; 