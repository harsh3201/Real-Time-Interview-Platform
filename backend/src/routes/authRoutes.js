const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {
    register,
    login,
    getProfile,
    getFullProfile,
    saveFullProfile,
    requestLoginOTP,
    verifyLoginOTP,
    updateProfile,
    getAllUsers,
    getCandidateDetail,
    updateHiringStage,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const passport = require('passport');

router.post('/register', register);
router.post('/login', login);
router.post('/otp/request', requestLoginOTP);
router.post('/otp/verify', verifyLoginOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), (req, res) => {
    const token = jwt.sign(
        { id: req.user.id, email: req.user.email, role: req.user.role, name: req.user.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    res.redirect(`${process.env.CLIENT_URL}/login?token=${token}`);
});

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/full-profile', authenticate, getFullProfile);
router.put('/full-profile', authenticate, saveFullProfile);
router.get('/users', authenticate, authorizeAdmin, getAllUsers);
router.get('/candidates/:id', authenticate, authorizeAdmin, getCandidateDetail);
router.put('/candidates/:id/stage', authenticate, authorizeAdmin, updateHiringStage);

module.exports = router;

