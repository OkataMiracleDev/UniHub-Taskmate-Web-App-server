// Import necessary modules
const serverless = require('serverless-http'); // NEW
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

// Import route files
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize the Express application
const app = express();

// Middleware to handle large file uploads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Connect to MongoDB using the URI from environment variables
// Note: This connection logic will run once per cold start of the function.
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err)); // Changed to console.error for better visibility

// --- Code to automatically handle the index error on server start ---
// This listener runs only after a successful MongoDB connection is established.
mongoose.connection.on('connected', async () => {
    try {
        console.log("Successfully connected to MongoDB. Checking for problematic index...");
        
        // Target the 'users' collection within the 'test' database
        const usersCollection = mongoose.connection.db.collection('users');

        // Check if the problematic index exists by listing all indexes
        const indexes = await usersCollection.listIndexes().toArray();
        const hasTeamCodeIndex = indexes.some(index => index.name === 'teamCode_1');

        if (hasTeamCodeIndex) {
            console.log("Found 'teamCode_1' index. Attempting to drop it...");
            // Drop the index to allow new users with the same teamCode
            await usersCollection.dropIndex('teamCode_1');
            console.log("Successfully dropped 'teamCode_1' index.");
        } else {
            console.log("The 'teamCode_1' index was not found. All good!");
        }

    } catch (error) {
        // Log any errors that occur during the index management process
        console.error("An error occurred while managing the index:", error);
    }
});
// -------------------- End of Index Fix Code --------------------

// Set up API routes
// IMPORTANT: For Netlify Functions, you must add a base path
// This is the router for all your API endpoints
const router = express.Router();
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);

// Mount the router on the Netlify Functions path
app.use('/.netlify/functions/api', router); // NEW

// Remove the local server listener as it is not needed for Netlify Functions
// We are no longer using app.listen()
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export the Express app wrapped in the serverless-http library
// This is what Netlify Functions will execute
module.exports.handler = serverless(app); // NEW
