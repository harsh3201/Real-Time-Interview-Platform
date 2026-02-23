const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, cancelBooking, getAllBookings } = require('../controllers/bookingController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Interview booking endpoints
 */

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Book an interview slot
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [interview_id]
 *             properties:
 *               interview_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Validation error or interview unavailable
 *       409:
 *         description: Already booked
 */
router.post('/', authenticate, createBooking);

/**
 * @swagger
 * /api/bookings/me:
 *   get:
 *     summary: Get current user's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's bookings
 */
router.get('/me', authenticate, getMyBookings);

/**
 * @swagger
 * /api/bookings/all:
 *   get:
 *     summary: Get all bookings (admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All bookings with user and interview details
 *       403:
 *         description: Admin role required
 */
router.get('/all', authenticate, authorizeAdmin, getAllBookings);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Cancel a booking
 *     tags: [Bookings]
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
 *         description: Booking cancelled successfully
 *       404:
 *         description: Booking not found
 */
router.delete('/:id', authenticate, cancelBooking);

module.exports = router;
