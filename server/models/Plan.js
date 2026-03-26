const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  food: { type: String, required: true },
  grams: { type: String, required: true },
  kcal: { type: String, required: true }
}, { _id: false });

const mealSectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  items: [mealItemSchema]
}, { _id: false });

const planSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    meals: {
      早餐: mealSectionSchema,
      午餐: mealSectionSchema,
      晚餐: mealSectionSchema,
      加餐: mealSectionSchema,
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

// Format returned JSON
planSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;