/**
 * Monitoring Agent
 *
 * Watches for changes that affect trips:
 * - Tracks price changes on watched items
 * - Monitors flight schedule changes
 * - Detects availability changes
 * - Sends alerts for significant events
 */

import { Agent } from './base.agent';
import type {
  AgentMessage,
  AgentCapability,
  MonitoringAlert,
} from './types';

export class MonitoringAgent extends Agent {
  readonly type = 'MONITORING' as const;
  readonly capabilities: AgentCapability[] = [
    {
      name: 'price-monitoring',
      description: 'Track price changes on flights, hotels, activities',
    },
    {
      name: 'schedule-monitoring',
      description: 'Monitor flight and booking schedule changes',
    },
    {
      name: 'availability-monitoring',
      description: 'Watch for availability changes',
    },
    {
      name: 'alert-generation',
      description: 'Generate alerts for significant changes',
    },
  ];

  // Track items being monitored
  private watchedItems: Set<string> = new Set();

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
    const payload = message.payload as { type: string; itemId?: string };

    switch (payload.type) {
      case 'WATCH':
        await this.watchItem(message);
        break;
      case 'UNWATCH':
        await this.unwatchItem(message);
        break;
      case 'GET_WATCHED':
        await this.getWatchedItems(message);
        break;
      default:
        this.log('warn', `Unknown request type: ${payload.type}`);
    }
  }

  // ============================================
  // MONITORING OPERATIONS (STUB)
  // ============================================

  /**
   * Start watching an item for changes
   * TODO: Implement in Phase 6 (Continuous Optimization)
   */
  private async watchItem(message: AgentMessage): Promise<void> {
    const payload = message.payload as { itemId: string; itemType: string };

    this.log('info', 'Watching item', {
      itemId: payload.itemId,
      itemType: payload.itemType,
    });

    this.watchedItems.add(payload.itemId);

    // STUB: Just acknowledge for now
    // In Phase 6, this will start background monitoring
    await this.respondToMessage(message, {
      success: true,
      watching: payload.itemId,
    });
  }

  /**
   * Stop watching an item
   * TODO: Implement in Phase 6
   */
  private async unwatchItem(message: AgentMessage): Promise<void> {
    const payload = message.payload as { itemId: string };

    this.log('info', 'Unwatching item', {
      itemId: payload.itemId,
    });

    this.watchedItems.delete(payload.itemId);

    await this.respondToMessage(message, {
      success: true,
      unwatched: payload.itemId,
    });
  }

  /**
   * Get list of watched items
   */
  private async getWatchedItems(message: AgentMessage): Promise<void> {
    await this.respondToMessage(message, {
      watchedItems: Array.from(this.watchedItems),
    });
  }

  /**
   * Send monitoring alert to orchestrator
   * TODO: Implement in Phase 6
   */
  private async sendAlert(alert: MonitoringAlert): Promise<void> {
    this.log('warn', 'Sending monitoring alert', alert);

    await this.sendMessage('ORCHESTRATOR', alert, 'HIGH');
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  protected async onInitialize(): Promise<void> {
    this.log('info', 'Monitoring agent initialized');
    // TODO: Start background monitoring jobs in Phase 6
  }

  protected async onShutdown(): Promise<void> {
    this.log('info', 'Monitoring agent shutting down');
    // TODO: Stop background monitoring jobs in Phase 6
    this.watchedItems.clear();
  }
}
