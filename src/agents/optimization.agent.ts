/**
 * Optimization Agent
 *
 * Continuously finds better options within constraints:
 * - Monitors prices for unlocked items
 * - Identifies savings opportunities
 * - Generates alternative recommendations
 * - Ranks options by value
 */

import { Agent } from './base.agent';
import type {
  AgentMessage,
  AgentCapability,
  OptimizationRequest,
  OptimizationResponse,
} from './types';

export class OptimizationAgent extends Agent {
  readonly type = 'OPTIMIZATION' as const;
  readonly capabilities: AgentCapability[] = [
    {
      name: 'candidate-ranking',
      description: 'Rank trip options by value within budget constraints',
    },
    {
      name: 'alternative-finding',
      description: 'Find better alternatives to current selections',
    },
    {
      name: 'savings-detection',
      description: 'Detect opportunities for cost savings',
    },
  ];

  // ============================================
  // MESSAGE HANDLING
  // ============================================

  async handleMessage(message: AgentMessage): Promise<void> {
    this.log('info', `Received message: ${message.messageType}`, {
      from: message.fromAgent,
    });

    if (message.messageType === 'REQUEST') {
      await this.handleRequest(message);
    }
  }

  private async handleRequest(message: AgentMessage): Promise<void> {
    const payload = message.payload as OptimizationRequest;

    switch (payload.type) {
      case 'RANK':
        await this.rankCandidates(message);
        break;
      case 'FIND_ALTERNATIVES':
        await this.findAlternatives(message);
        break;
      default:
        this.log('warn', `Unknown request type: ${payload.type}`);
    }
  }

  // ============================================
  // OPTIMIZATION OPERATIONS (STUB)
  // ============================================

  /**
   * Rank trip candidates by value
   * TODO: Implement actual ranking in Phase 1-3
   */
  private async rankCandidates(message: AgentMessage): Promise<void> {
    const request = message.payload as OptimizationRequest;

    this.log('info', 'Ranking candidates', {
      candidateCount: request.candidates?.length || 0,
      constraints: request.constraints,
    });

    // STUB: Return empty ranking for now
    // In Phases 1-3, this will call the existing scoring service
    const response: OptimizationResponse = {
      ranked: request.candidates || [],
      savings: 0,
    };

    await this.respondToMessage(message, response);
  }

  /**
   * Find alternative options that may be better
   * TODO: Implement in Phase 6 (Continuous Optimization)
   */
  private async findAlternatives(message: AgentMessage): Promise<void> {
    const request = message.payload as OptimizationRequest;

    this.log('info', 'Finding alternatives', {
      currentSelections: request.currentSelections,
    });

    // STUB: Return no alternatives for now
    // In Phase 6, this will monitor prices and find better options
    const response: OptimizationResponse = {
      alternatives: [],
      savings: 0,
    };

    await this.respondToMessage(message, response);
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  protected async onInitialize(): Promise<void> {
    this.log('info', 'Optimization agent initialized');
  }

  protected async onShutdown(): Promise<void> {
    this.log('info', 'Optimization agent shutting down');
  }
}
