/**
 * Booking Agent
 *
 * Manages actual booking process:
 * - Validates availability before booking
 * - Executes bookings through integrated APIs
 * - Handles confirmations and receipts
 * - Manages modifications and cancellations
 */

import { Agent } from './base.agent';
import type {
  AgentMessage,
  AgentCapability,
  BookingRequest,
  BookingResponse,
} from './types';

export class BookingAgent extends Agent {
  readonly type = 'BOOKING' as const;
  readonly capabilities: AgentCapability[] = [
    {
      name: 'booking-execution',
      description: 'Execute bookings through APIs',
    },
    {
      name: 'availability-check',
      description: 'Validate item availability before booking',
    },
    {
      name: 'booking-management',
      description: 'Handle modifications and cancellations',
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
    const payload = message.payload as BookingRequest;

    switch (payload.type) {
      case 'BOOK':
        await this.executeBooking(message);
        break;
      case 'CANCEL':
        await this.cancelBooking(message);
        break;
      case 'MODIFY':
        await this.modifyBooking(message);
        break;
      default:
        this.log('warn', `Unknown request type: ${payload.type}`);
    }
  }

  // ============================================
  // BOOKING OPERATIONS (STUB)
  // ============================================

  /**
   * Execute a booking
   * TODO: Implement in Phase 4 (API Integration)
   */
  private async executeBooking(message: AgentMessage): Promise<void> {
    const request = message.payload as BookingRequest;

    this.log('info', 'Executing booking', {
      optionId: request.optionId,
      optionType: request.optionType,
    });

    // STUB: Simulate successful booking
    // In Phase 4, this will call real booking APIs
    const response: BookingResponse = {
      success: true,
      confirmationCode: `STUB-${request.optionId.slice(0, 8).toUpperCase()}`,
    };

    await this.respondToMessage(message, response);
  }

  /**
   * Cancel a booking
   * TODO: Implement in Phase 4 (API Integration)
   */
  private async cancelBooking(message: AgentMessage): Promise<void> {
    const request = message.payload as BookingRequest;

    this.log('info', 'Cancelling booking', {
      optionId: request.optionId,
    });

    // STUB: Simulate successful cancellation
    const response: BookingResponse = {
      success: true,
    };

    await this.respondToMessage(message, response);
  }

  /**
   * Modify a booking
   * TODO: Implement in Phase 4 (API Integration)
   */
  private async modifyBooking(message: AgentMessage): Promise<void> {
    const request = message.payload as BookingRequest;

    this.log('info', 'Modifying booking', {
      optionId: request.optionId,
    });

    // STUB: Simulate successful modification
    const response: BookingResponse = {
      success: true,
    };

    await this.respondToMessage(message, response);
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  protected async onInitialize(): Promise<void> {
    this.log('info', 'Booking agent initialized');
  }

  protected async onShutdown(): Promise<void> {
    this.log('info', 'Booking agent shutting down');
  }
}
