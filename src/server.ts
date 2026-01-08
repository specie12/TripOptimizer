/**
 * TripOptimizer Express Server
 *
 * Main entry point for the API server.
 */

import express, { Application } from 'express';
import tripRoutes from './routes/trip.routes';
import { errorHandler } from './middleware/validation';

// Create Express app
const app: Application = express();

// Middleware
app.use(express.json());

// Routes
app.use('/trip', tripRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'TripOptimizer API',
    version: '1.0.0',
    endpoints: {
      'POST /trip/generate': 'Generate trip options',
      'GET /trip/health': 'Health check',
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
║    POST /trip/generate  - Generate trip options           ║
║    GET  /trip/health    - Health check                    ║
║                                                           ║
║  Environment:                                             ║
║    MOCK_CLAUDE: ${process.env.MOCK_CLAUDE === 'true' ? 'true (using mock responses)' : 'false (using real API)'}
║    ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'set' : 'not set'}
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
