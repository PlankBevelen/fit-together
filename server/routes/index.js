const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const planRoutes = require('./planRoutes');

const router = express.Router();

// 挂载各个模块的路由
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/plan', planRoutes);
router.use('/api/v1/users', userRoutes); // 保留旧版 API 路径以防前端有遗留请求

// 基础健康检查接口
router.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is running' });
});

module.exports = router;
