/**
 * Budget Agent
 *
 * Manages all financial aspects of trips:
 * - Budget allocation across categories
 * - Spend tracking and remaining budget calculation
 * - Budget constraint enforcement
 * - Budget health reports and alerts
 */

import { Agent } from './base.agent';
import type {
  AgentMessage,
  AgentCapability,
  BudgetAllocationRequest,
  BudgetAllocationResponse,
  SpendRecordRequest,
} from './types';

export class BudgetAgent extends Agent {
  readonly type = 'BUDGET' as const;
  readonly capabilities: AgentCapability[] = [
    {
      name: 'budget-allocation',
      description: 'Allocate total budget across trip categories',
    },
    {
      name: 'spend-tracking',
      description: 'Track expenses and remaining budget',
    },
    {
      name: 'budget-alerts',
      description: 'Alert when budgets approach limits',
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
    const payload = message.payload as { type: string };

    switch (payload.type) {
      case 'ALLOCATE':
        await this.allocateBudget(message);
        break;
      case 'RECORD_SPEND':
        await this.recordSpend(message);
        break;
      default:
        this.log('warn', `Unknown request type: ${payload.type}`);
    }
  }

  // ============================================
  // BUDGET OPERATIONS (STUB)
  // ============================================

  /**
   * Allocate budget across categories
   * TODO: Implement actual allocation logic in Phase 1
   */
  private async allocateBudget(message: AgentMessage): Promise<void> {
    const request = message.payload as BudgetAllocationRequest;

    this.log('info', 'Allocating budget', {
      totalBudget: request.totalBudget,
      priorities: request.priorities,
    });

    // STUB: Simple equal allocation for now
    // In Phase 1, this will implement smart allocation based on priorities
    const categories = ['flight', 'hotel', 'activity', 'food', 'transport', 'contingency'];
    const perCategory = Math.floor(request.totalBudget / categories.length);

    const allocations: Record<string, number> = {};
    categories.forEach((category) => {
      allocations[category] = perCategory;
    });

    const response: BudgetAllocationResponse = {
      allocations,
      remaining: request.totalBudget - perCategory * categories.length,
    };

    await this.respondToMessage(message, response);
  }

  /**
   * Record a spend against budget
   * TODO: Implement actual spend tracking in Phase 5
   */
  private async recordSpend(message: AgentMessage): Promise<void> {
    const request = message.payload as SpendRecordRequest;

    this.log('info', 'Recording spend', {
      category: request.category,
      amount: request.amount,
    });

    // STUB: Just acknowledge for now
    // In Phase 5, this will actually track spending in database
    await this.respondToMessage(message, {
      success: true,
      recorded: {
        category: request.category,
        amount: request.amount,
      },
    });
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  protected async onInitialize(): Promise<void> {
    this.log('info', 'Budget agent initialized');
  }

  protected async onShutdown(): Promise<void> {
    this.log('info', 'Budget agent shutting down');
  }
}
