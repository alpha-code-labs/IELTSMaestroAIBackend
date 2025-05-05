console.log('Starting server application...');
console.log('Environment variables check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
console.log('Anthropic key exists:', !!process.env.ANTHROPIC_API_KEY);


const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Handle uncaught exceptions to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process so Azure can restart it
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process
});

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Initialize Express app
const app = express();

// Basic middleware
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Enable CORS preflight for all routes
app.options('*', cors());

// CORS configuration
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

// Fallback manual CORS handler in case the cors package isn't working
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://www.ieltsmaestroai.com',
    'https://icy-plant-066ddc000.6.azurestaticapps.net',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
});

// Health check route - always available even if DB is down
app.get('/', (req, res) => {
  res.send('IELTS Maestro API is running');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Import routes
const sessionRoutes = require('./routes/session');
const writingRoutes = require('./routes/writing');
const readingRoutes = require('./routes/reading');
const listeningRoutes = require('./routes/listening');
const subscriptionRoutes = require('./routes/subscription');

// Register routes - do this before DB connection so routes are available even if DB fails
app.use('/api', sessionRoutes);
app.use('/api', writingRoutes);
app.use('/api', readingRoutes);
app.use('/api', listeningRoutes);
app.use('/api', subscriptionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error handler:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

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
