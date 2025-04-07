const express = require('express');
const router = express.Router();
const { PrismaClient, CollectionType } = require('@prisma/client');
const authenticateToken = require('../middleware/auth'); // Adjust path

const prisma = new PrismaClient();

// GET /api/collections (Requires Authentication)
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const itemTypeQuery = req.query.type?.toUpperCase(); // e.g., FOOD, RESTAURANT, POST
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let whereClause = { userId: userId };

    // Apply type filter if provided and valid
    if (itemTypeQuery && Object.values(CollectionType).includes(itemTypeQuery)) {
        whereClause.itemType = itemTypeQuery;
    }

    try {
        const collectionItems = await prisma.collectionItem.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            // Include details of the collected item based on its type
            include: {
                post: { // Include if itemType is POST
                    select: {
                        id: true,
                        title: true,
                        imageUrls: true, // Assuming you want the first image
                        author: { select: { username: true } } // Example: Get author username
                    }
                },
                foodItem: { // Include if itemType is FOOD
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        category: true
                    }
                },
                restaurant: { // Include if itemType is RESTAURANT
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        address: true
                    }
                }
                // Note: Prisma will only include the relation corresponding
                // to the non-null foreign key (postId, foodItemId, restaurantId)
                // for each collectionItem record.
            }
        });

        const totalItems = await prisma.collectionItem.count({ where: whereClause });

        res.json({
            data: collectionItems,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems
            }
        });

    } catch (error) {
        console.error('Get collections error:', error);
        res.status(500).json({ message: 'Internal server error fetching collections.' });
    }
});


// POST /api/collections (Requires Authentication)
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { itemType, itemId } = req.body;
    const itemTypeEnum = itemType?.toUpperCase();

    console.log(`[POST /collections] Received request: userId=${userId}, itemType=${itemType}, itemId=${itemId}`); // Log input

    // Validate input
    if (!itemTypeEnum || !itemId || !Object.values(CollectionType).includes(itemTypeEnum)) {
        console.error(`[POST /collections] Invalid input: itemType=${itemTypeEnum}, itemId=${itemId}`);
        return res.status(400).json({ message: 'Valid itemType (FOOD, RESTAURANT, POST) and itemId are required.' });
    }

    const parsedItemId = parseInt(itemId, 10);
    if (isNaN(parsedItemId)) {
        console.error(`[POST /collections] Invalid itemId format: ${itemId}`);
        return res.status(400).json({ message: 'Invalid itemId format.' });
    }

    console.log(`[POST /collections] Parsed itemId: ${parsedItemId}, Validated itemType: ${itemTypeEnum}`);

    try {
        // Optional: Check if the item being collected actually exists in its respective table
        let itemExists = false;
        console.log(`[POST /collections] Checking existence for ${itemTypeEnum} ID ${parsedItemId}...`);
        if (itemTypeEnum === CollectionType.FOOD) {
            itemExists = await prisma.foodItem.count({ where: { id: parsedItemId } }) > 0;
        } else if (itemTypeEnum === CollectionType.RESTAURANT) {
            itemExists = await prisma.restaurant.count({ where: { id: parsedItemId } }) > 0;
        } else if (itemTypeEnum === CollectionType.POST) {
            itemExists = await prisma.post.count({ where: { id: parsedItemId } }) > 0;
        }
        console.log(`[POST /collections] Item exists check result: ${itemExists}`);
        if (!itemExists) {
            console.warn(`[POST /collections] Item not found: ${itemTypeEnum} ID ${parsedItemId}`);
            return res.status(404).json({ message: `${itemType} with ID ${parsedItemId} not found.` });
        }

        // --- Correctly prepare data for Prisma create ---
        const dataToCreate = {
            userId: userId,
            itemType: itemTypeEnum,
        };

        // Assign the correct foreign key based on type
        if (itemTypeEnum === CollectionType.POST) {
            dataToCreate.postId = parsedItemId;
        } else if (itemTypeEnum === CollectionType.FOOD) {
            dataToCreate.foodItemId = parsedItemId;
        } else if (itemTypeEnum === CollectionType.RESTAURANT) {
            dataToCreate.restaurantId = parsedItemId;
        }
        console.log('[POST /collections] Prepared data for create:', dataToCreate);
        // -----------------------------------------------

        // Attempt to create the collection item
        console.log('[POST /collections] Attempting prisma.collectionItem.create...');
        const newCollectionItem = await prisma.collectionItem.create({
            data: dataToCreate
        });
        console.log('[POST /collections] Create successful:', newCollectionItem);

        res.status(201).json(newCollectionItem);

    } catch (error) {
        console.error('[POST /collections] Error occurred:', error);
        if (error.code === 'P2002') { // Handle unique constraint violation (already collected)
            console.warn('[POST /collections] Unique constraint violation (P2002). Item already in collection.');
            // Fetch the existing item to return it or just return conflict
            const existingItem = await prisma.collectionItem.findFirst({
                where: {
                    userId: userId,
                    itemType: itemTypeEnum,
                    // Add specific ID condition based on type
                    OR: [
                        { postId: itemTypeEnum === CollectionType.POST ? parsedItemId : undefined },
                        { foodItemId: itemTypeEnum === CollectionType.FOOD ? parsedItemId : undefined },
                        { restaurantId: itemTypeEnum === CollectionType.RESTAURANT ? parsedItemId : undefined },
                    ]
                },
            });
            return res.status(409).json({ message: 'Item already in collection.', item: existingItem });
        } else if (error.code === 'P2003') { // Foreign key constraint failed
            console.error(`[POST /collections] Foreign key constraint failed (P2003). User ID ${userId} or Item ID ${parsedItemId} might not exist.`);
            return res.status(400).json({ message: 'Invalid user or item ID.' });
        }
        // Log the full error object for detailed diagnosis
        console.error('[POST /collections] Full error object:', JSON.stringify(error, null, 2));
        res.status(500).json({ message: 'Internal server error adding to collection.' });
    }
});

// DELETE /api/collections (Requires Authentication)
router.delete('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { itemType, itemId } = req.query; // Using query parameters
    const itemTypeEnum = itemType?.toUpperCase();

    // Validate input
    if (!itemTypeEnum || !itemId || !Object.values(CollectionType).includes(itemTypeEnum)) {
        return res.status(400).json({ message: 'Valid query parameters itemType (FOOD, RESTAURANT, POST) and itemId are required.' });
    }
    const parsedItemId = parseInt(itemId, 10);
    if (isNaN(parsedItemId)) {
        return res.status(400).json({ message: 'Invalid itemId format.' });
    }

    console.log(`[DELETE /collections] Attempting delete: userId=${userId}, itemType=${itemTypeEnum}, itemId=${parsedItemId}`);

    try {
        // Construct the where clause based on the unique constraints
        let whereClause = {
            userId: userId,
            itemType: itemTypeEnum,
            // Only include the relevant foreign key based on itemType
            // This assumes your unique constraints are correctly set up on (userId, specific_fk)
        };
        if (itemTypeEnum === CollectionType.POST) {
            whereClause.postId = parsedItemId;
        } else if (itemTypeEnum === CollectionType.FOOD) {
            whereClause.foodItemId = parsedItemId;
        } else if (itemTypeEnum === CollectionType.RESTAURANT) {
            whereClause.restaurantId = parsedItemId;
        } else {
            // Should not happen due to initial validation, but as a safeguard:
            console.error(`[DELETE /collections] Invalid itemTypeEnum in whereClause construction: ${itemTypeEnum}`);
            return res.status(400).json({ message: 'Internal error: Invalid item type for deletion.' });
        }

        // Attempt to delete using the precise unique combination
        console.log('[DELETE /collections] Using where clause:', whereClause);
        const deleteResult = await prisma.collectionItem.deleteMany({
            where: whereClause
        });

        console.log('[DELETE /collections] Delete result count:', deleteResult.count);

        if (deleteResult.count === 0) {
            // If count is 0, the item wasn't found matching the unique criteria
            console.warn('[DELETE /collections] Item not found for deletion criteria.');
            return res.status(404).json({ message: 'Item not found in collection.' });
        }

        res.status(204).send(); // No Content

    } catch (error) {
        console.error('[DELETE /collections] Remove from collection error:', error);
        res.status(500).json({ message: 'Internal server error removing from collection.' });
    }
});

module.exports = router; 