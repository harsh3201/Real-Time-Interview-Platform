const express = require('express');
const router = express.Router();
const { analyzeProfile } = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

router.get('/analyze-profile', authenticate, analyzeProfile);

module.exports = router;
