const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, cancelBooking, getAllBookings } = require('../controllers/bookingController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');




router.post('/', authenticate, createBooking);


router.get('/me', authenticate, getMyBookings);


router.get('/all', authenticate, authorizeAdmin, getAllBookings);


router.delete('/:id', authenticate, cancelBooking);

module.exports = router;
