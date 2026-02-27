const express = require('express');
const router = express.Router();
const { executeCode, analyzeCandidate } = require('../controllers/codeController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.post('/execute', authenticate, executeCode);
router.post('/analyze-candidate', authenticate, authorizeAdmin, analyzeCandidate);

module.exports = router;
