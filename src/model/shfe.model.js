// models/shfe.model.js
const mongoose = require('mongoose');

const shfeSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Name of the metal, required
    latestPrice: { type: Number, required: true }, // Latest price as a number
    riseFall: { type: Number, required: true }, // Rise or fall as a number
    risefall: { type: String, required: true }, // Percentage rise or fall as a string (e.g., "-2.11%")
    highest: { type: Number, required: true }, // Highest price as a number
    lowest: { type: Number, required: true }, // Lowest price as a number
    yesterdayHarvest: { type: Number, required: true }, // Yesterday's closing price as a number
    updateTime: { type: String, }, // Update time as a Date
},
{ timestamps: true } 
);
const Shfe = mongoose.model('Shfe', shfeSchema);
module.exports = Shfe;
