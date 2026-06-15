/**
 * api/index.js
 * Vercel serverless function — wraps the entire Express app
 */

// Load env vars
require('dotenv').config();

const app = require('../backend/server');
module.exports = app;
