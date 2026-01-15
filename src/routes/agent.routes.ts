/**
 * Agent Routes
 *
 * API endpoints for agent status, health checks, and management
 */

import { Router, Request, Response } from 'express';
import { agentRegistry } from '../agents/registry';
import { messageBus } from '../agents/message-bus';

const router = Router();

/**
 * GET /agents
 * Get list of all registered agents with their info
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const agentInfo = agentRegistry.getAgentInfo();

    res.json({
      success: true,
      agents: agentInfo,
      count: agentInfo.length,
    });
  } catch (error) {
    console.error('Error getting agent info:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /agents/health
 * Get health status of all agents
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const healthSummary = await agentRegistry.getHealthSummary();

    res.json({
      success: true,
      ...healthSummary,
    });
  } catch (error) {
    console.error('Error checking agent health:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /agents/health/:agentType
 * Get health status of a specific agent
 */
router.get('/health/:agentType', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const agent = agentRegistry.get(agentType as any);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent ${agentType} not found`,
      });
    }

    const health = await agent.healthCheck();

    res.json({
      success: true,
      agentType,
      health,
    });
  } catch (error) {
    console.error('Error checking agent health:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /agents/messages
 * Get message bus activity log
 */
router.get('/messages', async (_req: Request, res: Response) => {
  try {
    const messages = messageBus.getMessageLog();
    const stats = messageBus.getStats();

    res.json({
      success: true,
      messages,
      stats,
    });
  } catch (error) {
    console.error('Error getting message log:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /agents/messages/:agentType
 * Get messages for a specific agent
 */
router.get('/messages/:agentType', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const messages = messageBus.getMessagesForAgent(agentType as any);

    res.json({
      success: true,
      agentType,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error('Error getting agent messages:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /agents/messages/clear
 * Clear message bus log (for testing)
 */
router.post('/messages/clear', async (_req: Request, res: Response) => {
  try {
    messageBus.clearMessageLog();

    res.json({
      success: true,
      message: 'Message log cleared',
    });
  } catch (error) {
    console.error('Error clearing message log:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /agents/status
 * Get comprehensive system status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const healthSummary = await agentRegistry.getHealthSummary();
    const messageStats = messageBus.getStats();
    const isInitialized = agentRegistry.isInitialized();

    res.json({
      success: true,
      initialized: isInitialized,
      health: healthSummary,
      messaging: messageStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
