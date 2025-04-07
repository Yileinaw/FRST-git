const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    console.log('[POST /register] Received request'); // Log start
    const { username, email, password } = req.body;
    console.log('[POST /register] Payload:', { username, email, password: '[REDACTED]' }); // Log payload (hide password)

    // Basic validation
    if (!username || !email || !password) {
        console.log('[POST /register] Validation failed: Missing fields');
        return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    try {
        console.log('[POST /register] Checking for existing user...');
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: email }
                ]
            }
        });
        console.log('[POST /register] Existing user check result:', existingUser ? `Found user ${existingUser.id}` : 'Not found');

        if (existingUser) {
            console.log('[POST /register] Conflict: Username or email already exists.');
            return res.status(409).json({ message: 'Username or email already exists.' }); // 409 Conflict
        }

        console.log('[POST /register] Hashing password...');
        // Hash password
        const saltRounds = 10; // Standard practice
        const password_hash = await bcrypt.hash(password, saltRounds);
        console.log('[POST /register] Password hashed successfully.');

        console.log('[POST /register] Creating user in database...');
        // Create user
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password_hash
            }
        });
        console.log(`[POST /register] User created successfully with ID: ${newUser.id}`);

        // Respond with the created user (excluding password hash)
        const userResponse = { ...newUser };
        delete userResponse.password_hash;
        res.status(201).json(userResponse); // 201 Created
        console.log('[POST /register] Response sent successfully.');

    } catch (error) {
        console.error('[POST /register] Error during registration:', error); // Log the full error
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
        return res.status(400).json({ message: 'Email/Username and password are required.' });
    }

    try {
        // Find user by email or username
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: emailOrUsername },
                    { username: emailOrUsername }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // User not found
        }

        // Compare password with stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // Password incorrect
        }

        // Generate JWT
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET is not defined in .env file.');
            return res.status(500).json({ message: 'Internal server error: JWT configuration missing.' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username }, // Payload
            jwtSecret,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // Respond with token and user info (excluding password hash)
        const userResponse = { ...user };
        delete userResponse.password_hash;

        res.json({
            message: 'Login successful',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
});


module.exports = router; 