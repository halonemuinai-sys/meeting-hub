require('dotenv').config();
const express = require('express');
const cors = require('cors');

const roomsRoutes = require('../routes/rooms');
const bookingsRoutes = require('../routes/bookings');
const companiesRoutes = require('../routes/companies');
const analyticsRoutes = require('../routes/analytics');
const amenitiesRoutes = require('../routes/amenities');
const attendeesRoutes = require('../routes/attendees');
const usersRoutes = require('../routes/users');
const authRoutes = require('../routes/auth');

const app = express();
const PORT = process.env.PORT || 5007;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger in Development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MRA Meeting Room Booking API',
    version: '1.2.0'
  });
});

// API Routes
app.use('/api/rooms', roomsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/amenities', amenitiesRoutes);
app.use('/api/attendees', attendeesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/auth', authRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 MRA Booking Meeting Room API running on port: ${PORT}`);
    console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
