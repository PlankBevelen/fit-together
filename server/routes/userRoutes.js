const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/wx-login', authController.wxLogin);

// Protect all routes after this middleware
router.use(protect);

router.get('/profile', authController.getProfile);
router.patch('/profile', authController.updateProfile);

module.exports = router;
