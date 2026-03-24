const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/code2session', authController.wxLogin);

module.exports = router;
