const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const AppError = require('../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.wxLogin = async (req, res, next) => {
  const { code } = req.body;

  if (!code) {
    return next(new AppError('Please provide code from wx.login()', 400));
  }

  // 1) Exchange code for openid
  const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WX_APP_ID}&secret=${process.env.WX_APP_SECRET}&js_code=${code}&grant_type=authorization_code`;
  
  // Note: For dev environment without real appid/secret, you might want to mock this
  let openid;
  let session_key = 'mock_session_key';
  
  try {
    const response = await axios.get(wxUrl);
    if (response.data.errcode) {
      return next(new AppError(response.data.errmsg, 400));
    }
    openid = response.data.openid;
    session_key = response.data.session_key;
  } catch (error) {
    return next(new AppError('Failed to verify with WeChat server', 500));
  }

  // 2) Find or create user
  let user = await User.findOne({ openid });
  
  if (!user) {
    user = await User.create({ openid });
  }

  // 3) Generate JWT token
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
    openid,
    session_key,
    data: {
      user,
    },
  });
};

exports.getProfile = async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
};

exports.updateProfile = async (req, res, next) => {
  // Only allow updating specific fields
  const allowedFields = ['name', 'avatarUrl', 'gender', 'birthYear', 'heightCm', 'weightKg', 'targetWeightKg', 'goal'];
  const updateData = {};
  
  Object.keys(req.body).forEach(el => {
    if (allowedFields.includes(el)) {
      updateData[el] = req.body[el];
    }
  });

  // Check if profile is complete
  const requiredFields = ['heightCm', 'weightKg', 'targetWeightKg', 'goal'];
  let profileComplete = true;
  
  // Merge current user data with updates to check completeness
  const checkData = { ...req.user.toObject(), ...updateData };
  for (const field of requiredFields) {
    if (!checkData[field]) {
      profileComplete = false;
      break;
    }
  }
  
  updateData.profileComplete = profileComplete;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
};
