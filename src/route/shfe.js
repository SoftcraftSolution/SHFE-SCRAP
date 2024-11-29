const express = require('express');
const router = express.Router();
const shfeController = require('../controller/shfe.controller');

// Define the route to get SHFE prices
router.get('/shfe-prices', shfeController.getShfeContinuousData );

module.exports = router;
