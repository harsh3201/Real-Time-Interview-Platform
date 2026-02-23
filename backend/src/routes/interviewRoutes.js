const express = require('express');
const router = express.Router();
const {
    getAllInterviews,
    getInterviewById,
    createInterview,
    updateInterview,
    deleteInterview,
} = require('../controllers/interviewController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Interviews
 *   description: Interview management endpoints
 */

/**
 * @swagger
 * /api/interviews:
 *   get:
 *     summary: Get all interviews
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all interviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 interviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Interview'
 */
router.get('/', authenticate, getAllInterviews);

/**
 * @swagger
 * /api/interviews/{id}:
 *   get:
 *     summary: Get interview by ID
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Interview details with bookings
 *       404:
 *         description: Interview not found
 */
router.get('/:id', authenticate, getInterviewById);

/**
 * @swagger
 * /api/interviews:
 *   post:
 *     summary: Create a new interview (admin only)
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, scheduled_time]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Senior React Developer Interview
 *               scheduled_time:
 *                 type: string
 *                 format: date-time
 *                 example: '2025-06-15T10:00:00Z'
 *     responses:
 *       201:
 *         description: Interview created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin role required
 */
router.post('/', authenticate, authorizeAdmin, createInterview);

/**
 * @swagger
 * /api/interviews/{id}:
 *   put:
 *     summary: Update an interview (admin only)
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               scheduled_time:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [scheduled, active, completed, cancelled]
 *     responses:
 *       200:
 *         description: Interview updated successfully
 *       404:
 *         description: Interview not found
 */
router.put('/:id', authenticate, authorizeAdmin, updateInterview);

/**
 * @swagger
 * /api/interviews/{id}:
 *   delete:
 *     summary: Delete an interview (admin only)
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Interview deleted successfully
 *       404:
 *         description: Interview not found
 */
router.delete('/:id', authenticate, authorizeAdmin, deleteInterview);

module.exports = router;
