import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import boardRoutes from './routes/boardRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import engagementRoutes from './routes/engagementRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import demoRoutes from './routes/demoRoutes.js';

// Resolve directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config();

// Connect to MongoDB
await connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploads folder static assets (Fallback mode storage)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/demo', demoRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SmartReach Server is running' });
});

// Root route
app.get('/', (req, res) => {
  res.send('SmartReach API running.');
});

// Custom Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
