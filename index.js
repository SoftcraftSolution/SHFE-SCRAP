const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./src/route/shfe');

const app = express();
const PORT = process.env.PORT || 3002;

// Set timeout to 2 minutes (120000 ms)
app.use((req, res, next) => {
    req.setTimeout(120000);  // Request timeout
    res.setTimeout(120000);  // Response timeout
    next();
});

// MongoDB connection
mongoose.connect('mongodb+srv://Rahul:myuser@rahul.fack9.mongodb.net/SHFESCRAP?authSource=admin&replicaSet=atlas-117kuv-shard-0&w=majority&readPreference=primary&retryWrites=true&ssl=true', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(error => {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    });

// Test route
app.get('/test', (req, res) => {
    res.send('✅ Server is working!');
});

// API routes
app.use('/api', userRoutes);

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// Set server timeout to 2 minutes
server.timeout = 120000;
