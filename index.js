const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const sessionRoutes = require('./routes/session');
const writingRoutes = require('./routes/writing');
const readingRoutes = require('./routes/reading');
const listeningRoutes = require('./routes/listening');
const subscriptionRoutes = require('./routes/subscription');


// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'https://www.ieltsmaestroai.com',
    'https://icy-plant-066ddc000.6.azurestaticapps.net',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS'],
  credentials: true
}));

// Connect to MongoDB
connectDB();

// Register routes
app.use('/api', sessionRoutes);
app.use('/api', writingRoutes);
app.use('/api', readingRoutes);
app.use('/api', listeningRoutes);
app.use('/api', subscriptionRoutes);

// Basic route to verify server is running
app.get('/', (req, res) => {
  res.send('IELTS Maestro API is running');
});

// Define the port from .env or use 8080 as fallback
const PORT = process.env.PORT || 8080;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
