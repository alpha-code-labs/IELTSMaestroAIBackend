console.log('Starting server application...');
console.log('Environment variables check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
console.log('Anthropic key exists:', !!process.env.ANTHROPIC_API_KEY);


console.log("I am about to express")
const express = require('express');
console.log("I finished express")
console.log("I am about to cors")
const cors = require('cors');
console.log("I finished cors")
console.log("I am about to dotenv")
const dotenv = require('dotenv');
console.log("I finished dotenv")


// Handle uncaught exceptions to prevent crashes
// In your index.js file
console.log("I am about to uncaught")
process.on('uncaughtException', (error) => {
  if (error.message && error.message.includes('pathToRegexpError')) {
    console.error('Path-to-regexp error:', error.message);
    console.error('Stack trace:', error.stack);
    // Don't exit the process so Azure can restart it
  } else {
    console.error('Uncaught Exception:', error);
    // Don't exit the process
  }
});
console.log("I finished uncaught")

console.log("I am about to unhandle")
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process
});
console.log("I finished unhandle")


// Load environment variables
console.log("I am about to dotenv")
dotenv.config();
console.log("I finished dotenv")


// Import database connection
console.log("I am about to configdb")
const connectDB = require('./config/db');
console.log("I finished configdb")


// Initialize Express app
console.log("I am about to actual express")
const app = express();
console.log("I finished actual express")


// Basic middleware
console.log("I am about to express and json")
app.use(express.json());
console.log("I finished express and json")


// Add request logging middleware
// Enable CORS preflight for all routes
console.log("I am about to options cors")
app.options('*', cors());
console.log("I finished options cors")


// CORS configuration
console.log("I am about to use cors")
app.use(cors({
  origin: [
    'https://www.ieltsmaestroai.com',
    'https://icy-plant-066ddc000.6.azurestaticapps.net',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
console.log("I finished use cors")


// Fallback manual CORS handler in case the cors package isn't working
console.log("I am about to allowedorigins")
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://www.ieltsmaestroai.com',
    'https://icy-plant-066ddc000.6.azurestaticapps.net',
    'http://localhost:3000'
  ];
  console.log("I finished allowedorigins")


  console.log("I am about to headers origin")
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
});
console.log("I finished headers origin")


// Health check route - always available even if DB is down
console.log("I am about to get")
app.get('/', (req, res) => {
  res.send('IELTS Maestro API is running');
});
console.log("I finished get")

console.log("I am about to health")
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});
console.log("I finished health")


// Import routes
console.log("I am about to import routes")
const sessionRoutes = require('./routes/session');
const writingRoutes = require('./routes/writing');
const readingRoutes = require('./routes/reading');
const listeningRoutes = require('./routes/listening');
const subscriptionRoutes = require('./routes/subscription');
console.log("I finished import routes")


// Register routes - do this before DB connection so routes are available even if DB fails
console.log("I am about to register routes")
app.use('/api', sessionRoutes);
app.use('/api', writingRoutes);
app.use('/api', readingRoutes);
app.use('/api', listeningRoutes);
app.use('/api', subscriptionRoutes);
console.log("I finished register routes")

console.log("I am about to log middleware")
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
console.log("I finished log middleware")


// Error handling middleware
console.log("I am about to handle error middleware")
app.use((err, req, res, next) => {
  console.error('Express error handler:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});
console.log("I am about to handle error middleware")


// Define the port from .env or use 8080 as fallback
const PORT = process.env.PORT || 8080;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Connect to MongoDB after server starts
  // This way, the server is up even if DB connection fails
  connectDB()
    .then(() => {
      console.log('MongoDB connected successfully');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      // Server continues running even if DB connection fails
    });
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
