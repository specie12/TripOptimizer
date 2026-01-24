/**
 * Orchestrator Agent
 *
 * ⚠️ DEPRECATED - Phase 1 Refactoring
 *
 * This agent-based orchestration has been replaced with direct service calls.
 * See src/agents/README.md for migration guide.
 *
 * NEW APPROACH:
 * - Use services directly (budget.service.ts, candidate.service.ts, etc.)
 * - AI only used through 4 defined agents in ai-agent.service.ts
 * - No message-passing overhead
 *
 * DO NOT USE THIS IN NEW CODE.
 *
 * @deprecated Use direct service orchestration in trip.service.ts instead
 */

import { Agent } from './base.agent';
import type { AgentMessage, AgentCapability, BudgetAllocationRequest, BudgetAllocationResponse, OptimizationRequest, OptimizationResponse } from './types';
import { TripStateMachine } from './state-machine';
import { TripState } from './types';

export class OrchestratorAgent extends Agent {
  readonly type = 'ORCHESTRATOR' as const;
  readonly capabilities: AgentCapability[] = [
    {
      name: 'trip-coordination',
      description: 'Coordinates all agents for end-to-end trip planning',
      requiredAgents: ['BUDGET', 'OPTIMIZATION', 'BOOKING'],
    },
    {
      name: 'state-management',
      description: 'Manages trip lifecycle state transitions',
    },
    {
      name: 'conflict-resolution',
      description: 'Resolves conflicts between agent recommendations',
    },
  ];

  // Track state machines for active trips
  private tripStates: Map<string, TripStateMachine> = new Map();

  // ============================================
  // MESSAGE HANDLING
  // ============================================

  async handleMessage(message: AgentMessage): Promise<void> {
    this.log('info', `Received message: ${message.messageType}`, {
      from: message.fromAgent,
      messageId: message.messageId,
    });

    switch (message.messageType) {
      case 'REQUEST':
        await this.handleRequest(message);
        break;
      case 'EVENT':
        await this.handleEvent(message);
        break;
      case 'ALERT':
        await this.handleAlert(message);
        break;
      default:
        this.log('warn', `Unhandled message type: ${message.messageType}`);
    }
  }

  // ============================================
  // REQUEST HANDLING
  // ============================================

  private async handleRequest(message: AgentMessage): Promise<void> {
    const payload = message.payload as { type: string; [key: string]: unknown };

    switch (payload.type) {
      case 'PLAN_TRIP':
        await this.planTrip(message);
        break;
      case 'GET_STATE':
        await this.getState(message);
        break;
      case 'TRANSITION_STATE':
        await this.transitionState(message);
        break;
      default:
        this.log('warn', `Unknown request type: ${payload.type}`);
    }
  }

  private async handleEvent(message: AgentMessage): Promise<void> {
    this.log('info', `Event from ${message.fromAgent}`, message.payload);
  }

  private async handleAlert(message: AgentMessage): Promise<void> {
    this.log('warn', `Alert from ${message.fromAgent}`, message.payload);
    // TODO: Handle alerts (price changes, booking failures, etc.)
  }

  // ============================================
  // TRIP PLANNING ORCHESTRATION
  // ============================================

  /**
   * Orchestrate complete trip planning
   * Coordinates Budget, Optimization, and other agents
   */
  private async planTrip(message: AgentMessage): Promise<void> {
    const payload = message.payload as {
      tripRequestId: string;
      totalBudget: number;
      priorities?: Record<string, number>;
      constraints?: Record<string, unknown>;
    };

    try {
      // Initialize state machine for this trip
      const stateMachine = new TripStateMachine(TripState.PLANNING);
      this.tripStates.set(payload.tripRequestId, stateMachine);

      // Step 1: Request budget allocation from Budget Agent
      this.log('info', `Requesting budget allocation for trip ${payload.tripRequestId}`);

      const budgetRequest: BudgetAllocationRequest = {
        type: 'ALLOCATE',
        totalBudget: payload.totalBudget,
        priorities: payload.priorities,
        constraints: payload.constraints,
      };

      const budgetAllocation = await this.requestFromAgent<
        BudgetAllocationRequest,
        BudgetAllocationResponse
      >('BUDGET', budgetRequest);

      this.log('info', 'Budget allocation received', budgetAllocation);

      // Step 2: Transition to OPTIMIZING state
      stateMachine.transitionTo(
        TripState.OPTIMIZING,
        'Budget allocated, starting optimization',
        'ORCHESTRATOR'
      );

      // Step 3: Request candidate ranking from Optimization Agent
      this.log('info', 'Requesting optimization');

      const optimizationRequest: OptimizationRequest = {
        type: 'RANK',
        constraints: budgetAllocation.allocations,
      };

      const optimizationResult = await this.requestFromAgent<
        OptimizationRequest,
        OptimizationResponse
      >('OPTIMIZATION', optimizationRequest);

      this.log('info', 'Optimization complete', optimizationResult);

      // Step 4: Send response back to requester
      await this.respondToMessage(message, {
        success: true,
        tripRequestId: payload.tripRequestId,
        budgetAllocation,
        rankedOptions: optimizationResult.ranked,
        state: stateMachine.getCurrentState(),
      });
    } catch (error) {
      this.log('error', 'Error planning trip', error);

      await this.respondToMessage(message, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  /**
   * Get trip state
   */
  private async getState(message: AgentMessage): Promise<void> {
    const payload = message.payload as { tripRequestId: string };
    const stateMachine = this.tripStates.get(payload.tripRequestId);

    if (!stateMachine) {
      await this.respondToMessage(message, {
        error: 'Trip state not found',
      });
      return;
    }

    await this.respondToMessage(message, {
      state: stateMachine.getStateInfo(),
    });
  }

  /**
   * Transition trip state
   */
  private async transitionState(message: AgentMessage): Promise<void> {
    const payload = message.payload as {
      tripRequestId: string;
      newState: TripState;
      reason?: string;
    };

    const stateMachine = this.tripStates.get(payload.tripRequestId);

    if (!stateMachine) {
      await this.respondToMessage(message, {
        success: false,
        error: 'Trip state not found',
      });
      return;
    }

    const success = stateMachine.transitionTo(
      payload.newState,
      payload.reason,
      message.fromAgent
    );

    await this.respondToMessage(message, {
      success,
      currentState: stateMachine.getCurrentState(),
      validNextStates: stateMachine.getValidNextStates(),
    });
  }

  // ============================================
  // LIFECYCLE METHODS
  // ============================================

  protected async onInitialize(): Promise<void> {
    this.log('info', 'Orchestrator agent initialized');
  }

  protected async onShutdown(): Promise<void> {
    this.log('info', 'Orchestrator agent shutting down');
    this.tripStates.clear();
  }

  // ============================================
  // PUBLIC METHODS (for direct service calls)
  // ============================================

  /**
   * Create a new trip planning request
   * This is called directly from trip.service.ts
   */
  async createTripPlan(params: {
    tripRequestId: string;
    totalBudget: number;
    priorities?: Record<string, number>;
    constraints?: Record<string, unknown>;
  }): Promise<{
    success: boolean;
    budgetAllocation?: BudgetAllocationResponse;
    rankedOptions?: unknown[];
    error?: string;
  }> {
    try {
      // Initialize state machine for this trip
      const stateMachine = new TripStateMachine(TripState.PLANNING);
      this.tripStates.set(params.tripRequestId, stateMachine);

      // Step 1: Request budget allocation from Budget Agent
      this.log('info', `Requesting budget allocation for trip ${params.tripRequestId}`);

      const budgetRequest: BudgetAllocationRequest = {
        type: 'ALLOCATE',
        totalBudget: params.totalBudget,
        priorities: params.priorities,
        constraints: params.constraints,
      };

      const budgetAllocation = await this.requestFromAgent<
        BudgetAllocationRequest,
        BudgetAllocationResponse
      >('BUDGET', budgetRequest);

      this.log('info', 'Budget allocation received', budgetAllocation);

      // Step 2: Transition to OPTIMIZING state
      stateMachine.transitionTo(
        TripState.OPTIMIZING,
        'Budget allocated, starting optimization',
        'ORCHESTRATOR'
      );

      // Step 3: Request candidate ranking from Optimization Agent
      this.log('info', 'Requesting optimization');

      const optimizationRequest: OptimizationRequest = {
        type: 'RANK',
        constraints: budgetAllocation.allocations,
      };

      const optimizationResult = await this.requestFromAgent<
        OptimizationRequest,
        OptimizationResponse
      >('OPTIMIZATION', optimizationRequest);

      this.log('info', 'Optimization complete', optimizationResult);

      // Step 4: Return result
      return {
        success: true,
        budgetAllocation,
        rankedOptions: optimizationResult.ranked,
      };
    } catch (error) {
      this.log('error', 'Error planning trip', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get trip state machine for a trip
   */
  getTripState(tripRequestId: string): TripStateMachine | undefined {
    return this.tripStates.get(tripRequestId);
  }
}
