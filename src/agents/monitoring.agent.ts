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
import {
  startPriceMonitoring,
  stopPriceMonitoring,
  monitorAllTripPrices,
} from '../jobs/price-monitor.job';

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

  // Track price monitoring interval
  private monitoringInterval: NodeJS.Timeout | null = null;

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
   */
  private async watchItem(message: AgentMessage): Promise<void> {
    const payload = message.payload as { itemId: string; itemType: string };

    this.log('info', 'Watching item', {
      itemId: payload.itemId,
      itemType: payload.itemType,
    });

    this.watchedItems.add(payload.itemId);

    await this.respondToMessage(message, {
      success: true,
      watching: payload.itemId,
    });
  }

  /**
   * Stop watching an item
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
   * Manually trigger price monitoring (called by orchestrator)
   */
  async triggerManualMonitoring(): Promise<void> {
    this.log('info', 'Manual price monitoring triggered');
    await monitorAllTripPrices();
    this.log('info', 'Manual price monitoring completed');
  }

  /**
   * Send monitoring alert to orchestrator
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

    // Start background price monitoring job
    this.monitoringInterval = startPriceMonitoring();
    this.log('info', 'Background price monitoring started (60min intervals)');
  }

  protected async onShutdown(): Promise<void> {
    this.log('info', 'Monitoring agent shutting down');

    // Stop background monitoring job
    if (this.monitoringInterval) {
      stopPriceMonitoring(this.monitoringInterval);
      this.log('info', 'Background price monitoring stopped');
    }

    this.watchedItems.clear();
  }
}
