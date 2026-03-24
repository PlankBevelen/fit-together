require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const AppError = require('./utils/appError');
const errorHandler = require('./middlewares/errorHandler');

// Route imports
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Use integrated routes
app.use('/', routes);

// 404 路由处理
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// 错误处理中间件
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
