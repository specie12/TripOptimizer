/**
 * Exception Agent
 *
 * ⚠️ DEPRECATED - Phase 1 Refactoring
 *
 * Exception handling should be done via standard error handling patterns.
 * See src/agents/README.md for migration guide.
 *
 * NEW APPROACH:
 * - Use try/catch blocks
 * - Use Express error middleware
 * - Log errors to console/monitoring service
 *
 * DO NOT USE THIS IN NEW CODE.
 *
 * @deprecated Use standard error handling patterns instead
 */

import { Agent } from './base.agent';
import type {
  AgentMessage,
  AgentCapability,
  ExceptionRequest,
  ExceptionResponse,
} from './types';

export class ExceptionAgent extends Agent {
  readonly type = 'EXCEPTION' as const;
  readonly capabilities: AgentCapability[] = [
    {
      name: 'failure-handling',
      description: 'Handle and recover from booking failures',
    },
    {
      name: 'conflict-resolution',
      description: 'Resolve schedule and booking conflicts',
    },
    {
      name: 'refund-processing',
      description: 'Process refunds and credits',
    },
    {
      name: 'disruption-recovery',
      description: 'Coordinate recovery from trip disruptions',
    },
  ];

  // Track active exceptions
  private activeExceptions: Map<string, ExceptionRequest> = new Map();

  // ============================================
  // MESSAGE HANDLING
  // ============================================

  async handleMessage(message: AgentMessage): Promise<void> {
    this.log('info', `Received message: ${message.messageType}`, {
      from: message.fromAgent,
    });

    if (message.messageType === 'REQUEST') {
      await this.handleRequest(message);
    } else if (message.messageType === 'ALERT') {
      await this.handleAlert(message);
    }
  }

  private async handleRequest(message: AgentMessage): Promise<void> {
    const payload = message.payload as ExceptionRequest;

    switch (payload.type) {
      case 'HANDLE_FAILURE':
        await this.handleFailure(message);
        break;
      case 'RESOLVE_CONFLICT':
        await this.resolveConflict(message);
        break;
      case 'PROCESS_REFUND':
        await this.processRefund(message);
        break;
      default:
        this.log('warn', `Unknown request type: ${payload.type}`);
    }
  }

  private async handleAlert(message: AgentMessage): Promise<void> {
    this.log('warn', 'Received alert', message.payload);

    // TODO: In Phase 6, handle alerts from Monitoring Agent
    // For now, just log them
  }

  // ============================================
  // EXCEPTION OPERATIONS (STUB)
  // ============================================

  /**
   * Handle a booking or planning failure
   * TODO: Implement in Phase 4-6
   */
  private async handleFailure(message: AgentMessage): Promise<void> {
    const request = message.payload as ExceptionRequest;

    this.log('error', 'Handling failure', {
      error: request.error,
      context: request.context,
    });

    const exceptionId = `exc-${Date.now()}`;
    this.activeExceptions.set(exceptionId, request);

    // STUB: Return generic failure response
    // In Phase 4-6, this will implement recovery strategies
    const response: ExceptionResponse = {
      resolved: false,
      actions: ['Log error', 'Notify user'],
      alternatives: [],
    };

    await this.respondToMessage(message, response);
  }

  /**
   * Resolve a schedule or booking conflict
   * TODO: Implement in Phase 4-6
   */
  private async resolveConflict(message: AgentMessage): Promise<void> {
    const request = message.payload as ExceptionRequest;

    this.log('warn', 'Resolving conflict', {
      error: request.error,
    });

    // STUB: Return unresolved for now
    const response: ExceptionResponse = {
      resolved: false,
      actions: ['Manual review required'],
      alternatives: [],
    };

    await this.respondToMessage(message, response);
  }

  /**
   * Process a refund
   * TODO: Implement in Phase 4-6
   */
  private async processRefund(message: AgentMessage): Promise<void> {
    const request = message.payload as ExceptionRequest;

    this.log('info', 'Processing refund', {
      context: request.context,
    });

    // STUB: Return success for now
    const response: ExceptionResponse = {
      resolved: true,
      actions: ['Refund initiated'],
    };

    await this.respondToMessage(message, response);
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  protected async onInitialize(): Promise<void> {
    this.log('info', 'Exception agent initialized');
  }

  protected async onShutdown(): Promise<void> {
    this.log('info', 'Exception agent shutting down');
    this.activeExceptions.clear();
  }
}
