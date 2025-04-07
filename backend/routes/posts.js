const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client'); // Removed CollectionType as it wasn't used
const authenticateToken = require('../middleware/auth'); // Adjust path as needed
const { authenticateOptionally } = require('../middleware/authOptional'); // Assume an optional auth middleware exists

const prisma = new PrismaClient();

// --- Post Routes ---

// GET /api/posts (Now uses optional auth)
router.get('/', authenticateOptionally, async (req, res) => { // Apply optional auth
    console.log('[DEBUG] Inside the single GET /api/posts handler');
    const userId = req.user?.id; // Get user ID if available
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * limit;

    try {
        let posts = await prisma.post.findMany({
            skip: skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            include: {
                author: { select: { id: true, username: true, avatar: true } },
                _count: { select: { likes: true, comments: true } },
            }
        });

        // If user is logged in, check like status for each post
        if (userId && posts.length > 0) {
            const postIds = posts.map(p => p.id);
            const userLikes = await prisma.like.findMany({
                where: {
                    userId: userId,
                    postId: { in: postIds }
                },
                select: {
                    postId: true // Select only postId for efficient check
                }
            });
            const likedPostIds = new Set(userLikes.map(like => like.postId));
            // Add isLiked field to each post
            posts = posts.map(post => ({
                ...post,
                isLiked: likedPostIds.has(post.id)
            }));
        } else {
            // If user is not logged in, add isLiked: false
            posts = posts.map(post => ({
                ...post,
                isLiked: false
            }));
        }

        const totalPosts = await prisma.post.count();
        const totalPages = Math.ceil(totalPosts / limit);

        res.json({
            posts,
            currentPage: page,
            totalPages,
            totalPosts
        });

    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "获取帖子列表失败" });
    }
});

// POST /api/posts (Requires Authentication)
router.post('/', authenticateToken, async (req, res) => {
    const authorId = req.user.id;
    const { title, content, imageUrls } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: "标题和内容不能为空" });
    }

    try {
        const newPost = await prisma.post.create({
            data: {
                title,
                content,
                imageUrls: imageUrls || null,
                authorId: authorId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                }
            }
        });
        console.log(`[POST /posts] Post created successfully with ID: ${newPost.id}`);

        // --- Add UserAction Tracking (from Code 2) ---
        try {
            await prisma.userAction.create({
                data: {
                    userId: authorId,
                    actionType: 'CREATE_POST',
                    details: { postId: newPost.id, title: newPost.title } // Store post ID and title
                }
            });
            console.log(`[UserAction] Logged CREATE_POST for user ${authorId}, post ${newPost.id}`);
        } catch (actionError) {
            console.error(`[UserAction] Failed to log CREATE_POST for user ${authorId}:`, actionError);
            // Non-critical error, don't fail the main request
        }
        // --- End UserAction Tracking ---

        res.status(201).json(newPost);

    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: "创建帖子失败" });
    }
});

// GET /api/posts/:postId (Now uses optional authentication)
router.get('/:postId', authenticateOptionally, async (req, res) => { // Apply optional auth middleware
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user?.id; // Get user ID if authenticated, otherwise undefined

    if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID format.' });
    }

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: { id: true, username: true, avatar: true }
                },
                _count: {
                    select: { comments: true, likes: true },
                },
            }
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        // Check if the current user (if authenticated) liked this post
        let isLiked = false;
        if (userId) {
            const likeCount = await prisma.like.count({
                where: { userId: userId, postId: postId }
            });
            isLiked = likeCount > 0;
        }

        // Return the post along with the like status
        res.json({
            ...post,
            isLiked // Add the field to the response
        });

    } catch (error) {
        console.error('Get post by ID error:', error);
        res.status(500).json({ message: 'Internal server error fetching post.' });
    }
});

// PUT /api/posts/:postId (Requires Authentication & Ownership)
router.put('/:postId', authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user.id;
    const { title, content, imageUrls } = req.body;

    if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID format.' });
    }

    if (!title && !content && !imageUrls) {
        return res.status(400).json({ message: 'No update data provided (title, content, or imageUrls).' });
    }

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (post.authorId !== userId) {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to update this post.' });
        }

        const dataToUpdate = {};
        if (title) dataToUpdate.title = title;
        if (content) dataToUpdate.content = content;
        if (imageUrls !== undefined) dataToUpdate.imageUrls = imageUrls;

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: dataToUpdate,
            include: {
                author: {
                    select: { id: true, username: true }
                }
            }
        });

        // Optionally add UserAction Tracking for UPDATE_POST here

        res.json(updatedPost);

    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ message: 'Internal server error updating post.' });
    }
});

// DELETE /api/posts/:postId (Requires Authentication & Ownership)
router.delete('/:postId', authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user.id;

    if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID format.' });
    }

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (post.authorId !== userId) {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to delete this post.' });
        }

        // Perform the delete (related records handled by schema cascade)
        await prisma.post.delete({
            where: { id: postId }
        });

        // Optionally add UserAction Tracking for DELETE_POST here, before sending response

        res.status(204).send();

    } catch (error) {
        console.error('Delete post error:', error);
        // Consider specific error handling, e.g., if delete fails due to constraints
        res.status(500).json({ message: 'Internal server error deleting post.' });
    }
});

// --- Comment Routes (Nested under Posts) ---

// GET /api/posts/:postId/comments (Public, with Pagination)
router.get('/:postId/comments', async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID format.' });
    }

    try {
        const postExists = await prisma.post.count({ where: { id: postId } });
        if (postExists === 0) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const comments = await prisma.comment.findMany({
            where: { postId: postId },
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

        const totalComments = await prisma.comment.count({ where: { postId: postId } });

        res.json({
            data: comments,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(totalComments / limit),
                totalItems: totalComments
            }
        });

    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Internal server error fetching comments.' });
    }
});

// POST /api/posts/:postId/comments (Requires Authentication)
router.post('/:postId/comments', authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const authorId = req.user.id;
    const { content } = req.body;

    if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID format.' });
    }

    if (!content) {
        return res.status(400).json({ message: 'Comment content is required.' });
    }

    try {
        const postExists = await prisma.post.count({ where: { id: postId } });
        if (postExists === 0) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const newComment = await prisma.comment.create({
            data: {
                content,
                postId,
                authorId
            },
            include: {
                author: {
                    select: { id: true, username: true }
                }
            }
        });
        console.log(`[POST /comments] Comment created successfully with ID: ${newComment.id} for post ${postId}`);

        // --- Add UserAction Tracking (from Code 3) ---
        try {
            await prisma.userAction.create({
                data: {
                    userId: authorId,
                    actionType: 'CREATE_COMMENT',
                    details: { postId: postId, commentId: newComment.id } // Store post and comment ID
                }
            });
            console.log(`[UserAction] Logged CREATE_COMMENT for user ${authorId}, comment ${newComment.id}`);
        } catch (actionError) {
            console.error(`[UserAction] Failed to log CREATE_COMMENT for user ${authorId}:`, actionError);
            // Non-critical error
        }
        // --- End UserAction Tracking ---

        res.status(201).json(newComment);

    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ message: 'Internal server error creating comment.' });
    }
});

// PUT /api/posts/:postId/comments/:commentId (Requires Authentication & Ownership)
router.put('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const userId = req.user.id;
    const { content } = req.body;

    if (isNaN(commentId) || isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid Post or Comment ID format.' });
    }

    if (!content) {
        return res.status(400).json({ message: 'Comment content is required for update.' });
    }

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        // Optional: Check if comment.postId matches the postId from the URL for extra safety
        // if (comment.postId !== postId) {
        //     return res.status(400).json({ message: 'Comment does not belong to the specified post.' });
        // }

        if (comment.authorId !== userId) {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to update this comment.' });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content: content },
            include: {
                author: {
                    select: { id: true, username: true }
                }
            }
        });

        // Optionally add UserAction Tracking for UPDATE_COMMENT here

        res.json(updatedComment);

    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ message: 'Internal server error updating comment.' });
    }
});

// DELETE /api/posts/:postId/comments/:commentId (Requires Authentication & Ownership)
router.delete('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const userId = req.user.id;

    if (isNaN(commentId) || isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid Post or Comment ID format.' });
    }

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        // Optional: Check if comment.postId matches the postId from the URL
        // if (comment.postId !== postId) {
        //     return res.status(400).json({ message: 'Comment does not belong to the specified post.' });
        // }

        if (comment.authorId !== userId) {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to delete this comment.' });
        }

        await prisma.comment.delete({
            where: { id: commentId }
        });

        // Optionally add UserAction Tracking for DELETE_COMMENT here

        res.status(204).send();

    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Internal server error deleting comment.' });
    }
});

// --- Like Routes (Nested under Posts) ---

// POST /api/posts/:postId/like (Requires Authentication)
router.post('/:postId/like', authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user.id;

    if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID.' });
    }

    try {
        // Check if the post exists
        const postExists = await prisma.post.count({ where: { id: postId } });
        if (postExists === 0) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        // Check if the user already liked the post
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: { userId, postId } // Use compound unique key
            }
        });

        let isLiked = false;
        if (existingLike) {
            // User already liked, so unlike it
            await prisma.like.delete({
                where: { userId_postId: { userId, postId } }
            });
            isLiked = false;
            console.log(`User ${userId} unliked post ${postId}`);
        } else {
            // User hasn't liked yet, so like it
            await prisma.like.create({
                data: { userId, postId }
            });
            isLiked = true;
            console.log(`User ${userId} liked post ${postId}`);
        }

        // Get the updated like count
        const updatedLikeCount = await prisma.like.count({
            where: { postId: postId }
        });

        // Return the new like state and count
        res.status(200).json({
            likes: updatedLikeCount,
            isLiked: isLiked
        });

    } catch (error) {
        console.error(`Error toggling like for post ${postId} by user ${userId}:`, error);
        res.status(500).json({ message: 'Internal server error toggling like.' });
    }
});

module.exports = router;