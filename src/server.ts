/**
 * TripOptimizer Express Server
 *
 * Main entry point for the API server.
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import tripRoutes from './routes/trip.routes';
import interactionRoutes from './routes/interaction.routes';
import parsingRoutes from './routes/parsing.routes';
import verificationRoutes from './routes/verification.routes';
import agentRoutes from './routes/agent.routes';
import { lockdownRouter } from './routes/lockdown.routes';
import { budgetRouter } from './routes/budget.routes'; // Phase 5: Budget tracking
import { optimizationRouter } from './routes/optimization.routes'; // Phase 6: Optimization
import bookingRoutes from './routes/booking.routes'; // Phase 2: Booking orchestration
import itineraryRoutes from './routes/itinerary.routes'; // Phase 3: Itinerary export
import { errorHandler } from './middleware/validation';

// Import agent system
import { agentRegistry } from './agents/registry';
import { OrchestratorAgent } from './agents/orchestrator.agent';
import { BudgetAgent } from './agents/budget.agent';
import { OptimizationAgent } from './agents/optimization.agent';
import { BookingAgent } from './agents/booking.agent';
import { MonitoringAgent } from './agents/monitoring.agent';
import { ExceptionAgent } from './agents/exception.agent';

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
app.use('/verify', verificationRoutes);
app.use('/agents', agentRoutes);
app.use('/lockdown', lockdownRouter); // Phase 2: Lock-down mechanism
app.use('/budget', budgetRouter); // Phase 5: Budget & spend tracking
app.use('/optimization', optimizationRouter); // Phase 6: Continuous optimization
app.use('/booking', bookingRoutes); // Phase 2: Booking orchestration
app.use('/itinerary', itineraryRoutes); // Phase 3: Itinerary export

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
      'POST /verify/entity': 'Verify entity existence (AI verification)',
      'GET /verify/health': 'Verification service health check',
      'GET /agents': 'List all registered agents',
      'GET /agents/health': 'Agent health summary',
      'GET /agents/status': 'System status (agents + messaging)',
      'GET /agents/messages': 'Message bus activity log',
      'POST /lockdown/lock': 'Lock a trip option/flight/hotel (Phase 2)',
      'POST /lockdown/unlock': 'Unlock a trip option/flight/hotel (Phase 2)',
      'GET /lockdown/status/:id': 'Get lock status for trip option (Phase 2)',
      'GET /lockdown/trip/:id': 'Get all locked items for trip (Phase 2)',
      'GET /lockdown/health': 'Lock-down service health check',
      'POST /booking/book': 'Book a complete trip (Phase 2)',
      'POST /booking/cancel': 'Cancel a booking (Phase 2)',
      'GET /booking/:id': 'Get booking details (Phase 2)',
      'GET /itinerary/:tripOptionId/download': 'Download PDF itinerary (Phase 3)',
      'GET /itinerary/:tripOptionId/preview': 'Preview itinerary as JSON (Phase 3)',
    },
  });
});

// Error handling
app.use(errorHandler);

// ============================================
// AGENT INITIALIZATION
// ============================================

/**
 * Initialize all agents in the system
 */
async function initializeAgents() {
  console.log('\n🤖 Initializing multi-agent system...\n');

  // Register all agents
  agentRegistry.register(new OrchestratorAgent());
  agentRegistry.register(new BudgetAgent());
  agentRegistry.register(new OptimizationAgent());
  agentRegistry.register(new BookingAgent());
  agentRegistry.register(new MonitoringAgent());
  agentRegistry.register(new ExceptionAgent());

  // Initialize all agents with shared context
  await agentRegistry.initializeAll({
    // Shared context available to all agents
    metadata: {
      environment: process.env.NODE_ENV || 'development',
    },
  });

  console.log('\n✅ Multi-agent system ready\n');
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log('\n🛑 Shutting down...');
  await agentRegistry.shutdownAll();
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize agents first
    await initializeAgents();

    // Start Express server
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
║    POST /verify/entity       - Verify entity existence    ║
║    GET  /verify/health       - Verification health check  ║
║    GET  /agents              - List all agents            ║
║    GET  /agents/health       - Agent health summary       ║
║    GET  /agents/status       - System status              ║
║                                                           ║
║  Multi-Agent System:                                      ║
║    ✓ Orchestrator Agent      - Central coordinator        ║
║    ✓ Budget Agent            - Financial management       ║
║    ✓ Optimization Agent      - Value optimization         ║
║    ✓ Booking Agent           - Booking execution          ║
║    ✓ Monitoring Agent        - Change detection           ║
║    ✓ Exception Agent         - Error handling             ║
║                                                           ║
║  Environment:                                             ║
║    MOCK_CLAUDE: ${process.env.MOCK_CLAUDE === 'true' ? 'true (using mock responses)' : 'false (using real API)'}
║    ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'set' : 'not set'}
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
