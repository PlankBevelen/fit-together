const express = require('express');
const planController = require('../controllers/planController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(planController.getPlans)
  .post(planController.savePlan);

router.post('/generate', planController.generatePlan);
router.post('/calendar', planController.updateCalendar);

router.route('/:id')
  .put(planController.updatePlan)
  .delete(planController.deletePlan);

module.exports = router;
