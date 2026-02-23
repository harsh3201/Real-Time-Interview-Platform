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




router.get('/', authenticate, getAllInterviews);


router.get('/:id', authenticate, getInterviewById);


router.post('/', authenticate, authorizeAdmin, createInterview);


router.put('/:id', authenticate, authorizeAdmin, updateInterview);


router.delete('/:id', authenticate, authorizeAdmin, deleteInterview);

module.exports = router;
