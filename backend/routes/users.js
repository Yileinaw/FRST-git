const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const authenticateToken = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/users/me (Requires Authentication)
router.get('/me', authenticateToken, (req, res) => {
    // The authenticateToken middleware has already verified the token 
    // and attached the user information (without password) to req.user
    res.json(req.user);
});

// PUT /api/users/me (Requires Authentication)
router.put('/me', authenticateToken, async (req, res) => {
    const userId = req.user.id; // Get user ID from authenticated user
    const { username, email } = req.body;

    // Validate input: at least one field must be provided
    if (!username && !email) {
        return res.status(400).json({ message: 'No update data provided (username or email).' });
    }

    const dataToUpdate = {};
    if (username) dataToUpdate.username = username;
    if (email) dataToUpdate.email = email;

    try {
        // Check for potential conflicts if username or email is being updated
        if (username || email) {
            const conflictCheckConditions = [];
            if (username) conflictCheckConditions.push({ username: username });
            if (email) conflictCheckConditions.push({ email: email });

            const existingUser = await prisma.user.findFirst({
                where: {
                    AND: [
                        { id: { not: userId } }, // Exclude the current user
                        { OR: conflictCheckConditions }
                    ]
                }
            });

            if (existingUser) {
                let conflictField = 'Username';
                if (email && existingUser.email === email) {
                    conflictField = 'Email';
                }
                return res.status(409).json({ message: `${conflictField} already exists.` });
            }
        }

        // Perform the update
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate,
            select: { // Explicitly select fields to return (exclude password_hash)
                id: true,
                username: true,
                email: true,
                created_at: true,
                updated_at: true
            }
        });

        res.json(updatedUser);

    } catch (error) {
        // Handle potential Prisma errors (e.g., unique constraint violation if checks fail unexpectedly)
        if (error.code === 'P2002') { // Prisma unique constraint violation code
            return res.status(409).json({ message: 'Username or email already exists.' });
        }
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Internal server error during user update.' });
    }
});

// PUT /api/users/me/password (Requires Authentication)
router.put('/me/password', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) { // Example: Basic password length check
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    try {
        // Get current user's password hash
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password_hash: true }
        });

        if (!user) {
            // Should not happen if authenticateToken works correctly, but good practice to check
            return res.sendStatus(404);
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        // Hash the new password
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update the password in the database
        await prisma.user.update({
            where: { id: userId },
            data: { password_hash: newPasswordHash }
        });

        res.status(200).json({ message: 'Password updated successfully.' }); // Or use 204 No Content

    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ message: 'Internal server error during password update.' });
    }
});

// PUT /api/users/me/avatar (Requires Authentication) - Saves Data URL
router.put('/me/avatar', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { avatarDataUrl } = req.body;

    // Basic validation for Data URL
    if (!avatarDataUrl || typeof avatarDataUrl !== 'string' || !avatarDataUrl.startsWith('data:image')) {
        return res.status(400).json({ message: 'Valid avatarDataUrl (starting with \'data:image\') is required.' });
    }

    // Log the type and length of the received Data URL
    console.log(`[INFO] Received avatar update request for user ${userId}.`);
    console.log(`[INFO] Type of avatarDataUrl: ${typeof avatarDataUrl}`);
    console.log(`[INFO] Length of avatarDataUrl: ${avatarDataUrl.length}`);

    try {
        // Restore saving the actual Data URL
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarDataUrl }, // Save the real Data URL
            select: { avatar: true }
        });

        console.log(`[INFO] Successfully updated avatar for user ${userId}.`);
        res.json({ message: 'Avatar updated successfully.', avatar: updatedUser.avatar });

    } catch (error) {
        console.error('Update avatar error:', error);
        // Add length info to error log
        console.error(`[ERROR] Failed while trying to save avatar for user ${userId}. Data URL length was: ${avatarDataUrl?.length}`);
        res.status(500).json({ message: 'Internal server error updating avatar.' });
    }
});

// GET /api/users/:userId (Public)
router.get('/:userId', async (req, res) => { // Note: Path is now relative to /api/users
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { // Select only public information
                id: true,
                username: true,
                created_at: true,
                // Optionally count posts or include some public activity summary later
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(user);

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ message: 'Internal server error fetching user.' });
    }
});

module.exports = router; 