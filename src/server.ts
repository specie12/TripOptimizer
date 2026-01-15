/**
 * TripOptimizer Express Server
 *
 * Main entry point for the API server.
 */

import express, { Application } from 'express';
import tripRoutes from './routes/trip.routes';
import interactionRoutes from './routes/interaction.routes';
import parsingRoutes from './routes/parsing.routes';
import verificationRoutes from './routes/verification.routes';
import agentRoutes from './routes/agent.routes';
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
