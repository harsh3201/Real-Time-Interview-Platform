const pool = require('../config/database');

const createBooking = async (req, res) => {
    try {
        const { interview_id } = req.body;
        const user_id = req.user.id;

        if (!interview_id) {
            return res.status(400).json({ message: 'interview_id is required.' });
        }

        const interview = await pool.query(
            'SELECT id, status, title, scheduled_time FROM interviews WHERE id = $1',
            [interview_id]
        );

        if (interview.rows.length === 0) {
            return res.status(404).json({ message: 'Interview not found.' });
        }

        if (interview.rows[0].status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot book a cancelled interview.' });
        }

        if (interview.rows[0].status === 'completed') {
            return res.status(400).json({ message: 'Cannot book a completed interview.' });
        }

        const existingBooking = await pool.query(
            'SELECT id FROM bookings WHERE user_id = $1 AND interview_id = $2',
            [user_id, interview_id]
        );

        if (existingBooking.rows.length > 0) {
            return res.status(409).json({ message: 'You have already booked this interview.' });
        }

        const result = await pool.query(
            'INSERT INTO bookings (user_id, interview_id) VALUES ($1, $2) RETURNING *',
            [user_id, interview_id]
        );

        res.status(201).json({
            message: 'Interview booked successfully.',
            booking: result.rows[0],
            interview: interview.rows[0],
        });
    } catch (err) {
        console.error('Create booking error:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};

const getMyBookings = async (req, res) => {
    try {
        const user_id = req.user.id;

        const result = await pool.query(`
      SELECT
        b.id AS booking_id,
        b.interview_id,
        i.title,
        i.scheduled_time,
        i.status,
        b.created_at AS booked_at
      FROM bookings b
      JOIN interviews i ON b.interview_id = i.id
      WHERE b.user_id = $1
      ORDER BY i.scheduled_time ASC
    `, [user_id]);

        res.status(200).json({ bookings: result.rows });
    } catch (err) {
        console.error('Get bookings error:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const booking = await pool.query(
            'SELECT id FROM bookings WHERE id = $1 AND user_id = $2',
            [id, user_id]
        );

        if (booking.rows.length === 0) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        await pool.query('DELETE FROM bookings WHERE id = $1', [id]);

        res.status(200).json({ message: 'Booking cancelled successfully.' });
    } catch (err) {
        console.error('Cancel booking error:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};

const getAllBookings = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        b.id AS booking_id,
        b.user_id,
        u.name AS candidate_name,
        u.email AS candidate_email,
        b.interview_id,
        i.title AS interview_title,
        i.scheduled_time,
        i.status AS interview_status,
        b.created_at AS booked_at
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN interviews i ON b.interview_id = i.id
      ORDER BY i.scheduled_time ASC
    `);

        res.status(200).json({ bookings: result.rows });
    } catch (err) {
        console.error('Get all bookings error:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};

module.exports = { createBooking, getMyBookings, cancelBooking, getAllBookings };
