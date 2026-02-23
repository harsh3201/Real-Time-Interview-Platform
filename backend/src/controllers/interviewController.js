const pool = require('../config/database');


const getAllInterviews = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        i.id, i.title, i.scheduled_time, i.status, i.created_by,
        u.name AS creator_name,
        COUNT(b.id) AS booking_count
      FROM interviews i
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN bookings b ON b.interview_id = i.id
      GROUP BY i.id, u.name
      ORDER BY i.scheduled_time ASC
    `);

        res.status(200).json({ interviews: result.rows });
    } catch (err) {
        console.error('Get interviews error:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};


const getInterviewById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
      SELECT 
        i.id, i.title, i.scheduled_time, i.status, i.created_by,
        u.name AS creator_name
      FROM interviews i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Interview not found.' });
        }

        
        const bookings = await pool.query(`
      SELECT b.id, b.user_id, u.name AS candidate_name, u.email AS candidate_email
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.interview_id = $1
    `, [id]);

        res.status(200).json({
            interview: result.rows[0],
            bookings: bookings.rows,
        });
    } catch (err) {
        console.error('Get interview error:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};


const createInterview = async (req, res) => {
    try {
        const { title, scheduled_time } = req.body;

        if (!title || !scheduled_time) {
            return res.status(400).json({ message: 'Title and scheduled_time are required.' });
        }

        const result = await pool.query(
            'INSERT INTO interviews (title, scheduled_time, created_by, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, scheduled_time, req.user.id, 'scheduled']
        );

        res.status(201).json({
            message: 'Interview created successfully.',
            interview: result.rows[0],
        });
    } catch (err) {
        console.error('Create interview error:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};


const updateInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, scheduled_time, status } = req.body;

        const existing = await pool.query('SELECT * FROM interviews WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Interview not found.' });
        }

        const interview = existing.rows[0];
        const updatedTitle = title || interview.title;
        const updatedTime = scheduled_time || interview.scheduled_time;
        const updatedStatus = status || interview.status;

        const validStatuses = ['scheduled', 'active', 'completed', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status.' });
        }

        const result = await pool.query(
            'UPDATE interviews SET title = $1, scheduled_time = $2, status = $3 WHERE id = $4 RETURNING *',
            [updatedTitle, updatedTime, updatedStatus, id]
        );

        res.status(200).json({
            message: 'Interview updated successfully.',
            interview: result.rows[0],
        });
    } catch (err) {
        console.error('Update interview error:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};


const deleteInterview = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await pool.query('SELECT id FROM interviews WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Interview not found.' });
        }

        
        await pool.query('DELETE FROM bookings WHERE interview_id = $1', [id]);
        await pool.query('DELETE FROM interviews WHERE id = $1', [id]);

        res.status(200).json({ message: 'Interview deleted successfully.' });
    } catch (err) {
        console.error('Delete interview error:', err);
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};

module.exports = {
    getAllInterviews,
    getInterviewById,
    createInterview,
    updateInterview,
    deleteInterview,
};
