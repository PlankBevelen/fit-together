const axios = require('axios');
const AppError = require('../utils/appError');
const Plan = require('../models/Plan');

exports.getPlans = async (req, res, next) => {
  try {
    const plans = await Plan.find({ user: req.user._id }).sort('-createdAt');
    const user = await require('../models/User').findById(req.user._id);

    res.status(200).json({
      status: 'success',
      data: {
        plans,
        calendar: user.calendar || {}
      }
    });
  } catch (error) {
    next(new AppError('获取计划列表失败', 500));
  }
};

exports.updateCalendar = async (req, res, next) => {
  try {
    const { date, planId } = req.body;
    const user = await require('../models/User').findById(req.user._id);
    
    if (!user.calendar) {
      user.calendar = new Map();
    }

    if (planId) {
      user.calendar.set(date, planId);
    } else {
      // 当显式清除排餐时，存入空字符串而不是删除该键，这样前端才能区分"未操作"和"显式留空"
      user.calendar.set(date, "");
    }
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        calendar: user.calendar
      }
    });
  } catch (error) {
    next(new AppError('更新日历失败', 500));
  }
};

exports.savePlan = async (req, res, next) => {
  try {
    const { name, meals, isActive } = req.body;
    
    // 如果设置为 active，则将其他计划设置为 inactive
    if (isActive) {
      await Plan.updateMany({ user: req.user._id }, { isActive: false });
    }

    const plan = await Plan.create({
      user: req.user._id,
      name: name || '自定义计划',
      meals,
      isActive: isActive || false
    });

    res.status(201).json({
      status: 'success',
      data: {
        plan
      }
    });
  } catch (error) {
    next(new AppError('保存计划失败', 500));
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    if (req.body.isActive) {
      // 如果设置为 active，则将其他计划设置为 inactive
      await Plan.updateMany({ user: req.user._id, _id: { $ne: req.params.id } }, { isActive: false });
    }

    const plan = await Plan.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return next(new AppError('找不到该计划', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
  } catch (error) {
    next(new AppError('更新计划失败', 500));
  }
};

exports.deletePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    
    if (!plan) {
      return next(new AppError('找不到该计划', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(new AppError('删除计划失败', 500));
  }
};

exports.generatePlan = async (req, res, next) => {
  try {
    const user = req.user;

    const currentYear = new Date().getFullYear();
    const age = user.birthYear ? currentYear - parseInt(user.birthYear) : '未知';
    const genderMap = { male: '男', female: '女' };
    const goalMap = { cut: '减脂', bulk: '增肌', maintain: '保持' };

    const prompt = `你是一个专业的营养师和健身教练。请根据以下用户信息生成一份一日三餐加餐的健康饮食计划：
性别: ${genderMap[user.gender] || '未知'}
年龄: ${age}
身高: ${user.heightCm ? user.heightCm + 'cm' : '未知'}
当前体重: ${user.weightKg ? user.weightKg + 'kg' : '未知'}
目标体重: ${user.targetWeightKg ? user.targetWeightKg + 'kg' : '未知'}
目标: ${goalMap[user.goal] || '未知'}

请返回严格的JSON格式数据，不要返回任何多余的说明文本，不需要markdown标记（如 \`\`\`json ），直接返回可解析的JSON对象。
JSON结构必须符合以下格式：
{
  "id": "随机生成一个唯一id字符串",
  "name": "简短的方案名称，比如'个性化减脂方案'",
  "meals": {
    "早餐": {
      "name": "早餐",
      "items": [
        { "food": "食物名称", "grams": "带单位的重量，例如100g", "kcal": "带kcal单位的热量，例如150kcal" }
      ]
    },
    "午餐": {
      "name": "午餐",
      "items": []
    },
    "晚餐": {
      "name": "晚餐",
      "items": []
    },
    "加餐": {
      "name": "加餐",
      "items": []
    }
  }
}
每个时段（早餐、午餐、晚餐、加餐）必须存在。`;

    const response = await axios.post(
      'https://ark.cn-beijing.volces.com/api/v3/responses',
      {
        model: "deepseek-v3-2-251201",
        stream: false,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.ARK_API_KEY || '9d3f4f80-154a-490a-8f49-f3c011a92e86'}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // DeepSeek might take a bit longer
      }
    );

    let resultText = '';
    if (response.data?.output?.text) {
      resultText = response.data.output.text;
    } else if (response.data?.choices?.[0]?.message?.content) {
      resultText = response.data.choices[0].message.content;
    } else if (Array.isArray(response.data?.output) && response.data.output[0]?.content?.[0]?.text) {
      resultText = response.data.output[0].content[0].text;
    } else {
      // 尝试在复杂对象中查找文本
      const output = response.data?.output;
      if (output && !Array.isArray(output) && output.content && output.content[0] && output.content[0].text) {
        resultText = output.content[0].text;
      } else {
        resultText = JSON.stringify(response.data);
      }
    }

    // Try to parse the text as JSON
    let parsedPlan;
    try {
      // Clean up markdown block if the model ignores the prompt instruction
      const jsonStr = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedPlan = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", resultText);
      // Let's search inside the text for {...}
      const match = resultText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedPlan = JSON.parse(match[0]);
        } catch (e) {
          return next(new AppError('生成计划失败，AI 返回格式异常', 500));
        }
      } else {
        return next(new AppError('生成计划失败，AI 返回格式异常', 500));
      }
    }

    // Normalize keys in case AI adds spaces like " 加餐"
    if (parsedPlan && parsedPlan.meals) {
      const normalizedMeals = {};
      for (const key in parsedPlan.meals) {
        const cleanKey = key.trim();
        normalizedMeals[cleanKey] = parsedPlan.meals[key];
      }
      parsedPlan.meals = normalizedMeals;
    }

    res.status(200).json({
      status: 'success',
      data: {
        plan: parsedPlan
      }
    });

  } catch (error) {
    console.error('Error generating plan:', error.response?.data || error.message);
    next(new AppError('生成饮食计划失败', 500));
  }
};
