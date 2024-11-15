// models/shfe.model.js
const mongoose = require('mongoose');

const shfeSchema = new mongoose.Schema({
    description: { type: String, required: true,  },
    price: String,
    open: String,
    high: String,
    low: String,
    volume: String,
    change: String,
}, { timestamps: true });

const Shfe = mongoose.model('Shfe', shfeSchema);
module.exports = Shfe;
