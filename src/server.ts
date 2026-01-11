/**
 * TripOptimizer Express Server
 *
 * Main entry point for the API server.
 */

import express, { Application } from 'express';
import tripRoutes from './routes/trip.routes';
import interactionRoutes from './routes/interaction.routes';
import parsingRoutes from './routes/parsing.routes';
import { errorHandler } from './middleware/validation';

// Create Express app
const app: Application = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json());

// Routes
app.use('/trip', tripRoutes);
app.use('/interaction', interactionRoutes);
app.use('/parse', parsingRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'TripOptimizer API',
    version: '1.0.0',
    endpoints: {
      'POST /trip/generate': 'Generate trip options',
      'GET /trip/health': 'Health check',
      'POST /interaction/track': 'Track user interaction',
      'POST /interaction/user': 'Create anonymous user',
      'GET /interaction/user/:id': 'Get user info',
      'POST /parse/booking': 'Parse booking content (AI extraction)',
      'GET /parse/health': 'Parsing service health check',
    },
  });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                  TripOptimizer API                        ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                 ║
║                                                           ║
║  Endpoints:                                               ║
║    POST /trip/generate       - Generate trip options      ║
║    GET  /trip/health         - Health check               ║
║    POST /interaction/track   - Track user interaction     ║
║    POST /interaction/user    - Create anonymous user      ║
║    POST /parse/booking       - Parse booking content      ║
║    GET  /parse/health        - Parsing health check       ║
║                                                           ║
║  Environment:                                             ║
║    MOCK_CLAUDE: ${process.env.MOCK_CLAUDE === 'true' ? 'true (using mock responses)' : 'false (using real API)'}
║    ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'set' : 'not set'}
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
