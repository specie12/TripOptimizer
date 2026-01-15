/**
 * Base Agent Abstract Class
 *
 * All specialized agents extend from this base class.
 * Provides common lifecycle methods and message handling infrastructure.
 */

import type {
  AgentType,
  AgentMessage,
  AgentContext,
  AgentHealth,
  AgentCapability,
  AgentHealthStatus,
} from './types';
import { messageBus } from './message-bus';

export abstract class Agent {
  abstract readonly type: AgentType;
  abstract readonly capabilities: AgentCapability[];

  protected context: AgentContext = {};
  private health: AgentHealth;
  private messagesProcessed = 0;
  private errors = 0;
  private startTime = Date.now();
  private unsubscribe?: () => void;

  constructor() {
    this.health = {
      status: 'STARTING',
      lastCheckAt: new Date(),
    };
  }

  // ============================================
  // LIFECYCLE METHODS
  // ============================================

  /**
   * Initialize the agent with context and subscribe to messages
   */
  async initialize(context: AgentContext): Promise<void> {
    this.context = context;
    this.health.status = 'HEALTHY';

    // Subscribe to messages for this agent
    this.unsubscribe = messageBus.subscribe(this.type, async (message) => {
      try {
        await this.handleMessage(message);
        this.messagesProcessed++;
      } catch (error) {
        this.errors++;
        this.health.status = 'DEGRADED';
        console.error(
          `Error handling message in ${this.type} agent:`,
          error
        );
      }
    });

    // Call agent-specific initialization
    await this.onInitialize();
  }

  /**
   * Shutdown the agent gracefully
   */
  async shutdown(): Promise<void> {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    await this.onShutdown();
  }

  /**
   * Override this in subclasses for agent-specific initialization
   */
  protected async onInitialize(): Promise<void> {
    // Default: no-op
  }

  /**
   * Override this in subclasses for agent-specific cleanup
   */
  protected async onShutdown(): Promise<void> {
    // Default: no-op
  }

  // ============================================
  // ABSTRACT METHODS (must be implemented by subclasses)
  // ============================================

  /**
   * Handle incoming messages
   * Subclasses must implement this to process messages
   */
  abstract handleMessage(message: AgentMessage): Promise<void>;

  // ============================================
  // HEALTH CHECK
  // ============================================

  /**
   * Get current health status
   */
  async healthCheck(): Promise<AgentHealth> {
    const uptime = Date.now() - this.startTime;

    this.health = {
      status: this.determineHealthStatus(),
      lastCheckAt: new Date(),
      details: {
        uptime,
        messagesProcessed: this.messagesProcessed,
        errors: this.errors,
      },
    };

    return this.health;
  }

  /**
   * Determine health status based on error rate
   */
  private determineHealthStatus(): AgentHealthStatus {
    if (this.messagesProcessed === 0) {
      return 'STARTING';
    }

    const errorRate = this.errors / this.messagesProcessed;

    if (errorRate > 0.5) {
      return 'UNHEALTHY';
    } else if (errorRate > 0.1) {
      return 'DEGRADED';
    }

    return 'HEALTHY';
  }

  // ============================================
  // MESSAGING HELPERS
  // ============================================

  /**
   * Send a one-way message to another agent
   */
  protected async sendMessage<T>(
    toAgent: AgentType,
    payload: T,
    priority: AgentMessage['priority'] = 'MEDIUM'
  ): Promise<void> {
    const message: AgentMessage<T> = {
      messageId: this.generateMessageId(),
      fromAgent: this.type,
      toAgent,
      messageType: 'EVENT',
      priority,
      payload,
      timestamp: new Date(),
    };

    await messageBus.publish(message);
  }

  /**
   * Send a request to another agent and wait for response
   */
  protected async requestFromAgent<TRequest, TResponse>(
    toAgent: AgentType,
    payload: TRequest,
    timeoutMs: number = 30000
  ): Promise<TResponse> {
    return messageBus.request<TRequest, TResponse>(
      this.type,
      toAgent,
      payload,
      timeoutMs
    );
  }

  /**
   * Send a response to a request message
   */
  protected async respondToMessage<T>(
    originalMessage: AgentMessage,
    responsePayload: T
  ): Promise<void> {
    await messageBus.respond(originalMessage, this.type, responsePayload);
  }

  /**
   * Broadcast an event to all agents
   */
  protected async broadcastEvent<T>(payload: T): Promise<void> {
    await messageBus.broadcast(this.type, payload);
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${this.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log agent activity
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    const logMessage = `[${this.type}] ${message}`;

    switch (level) {
      case 'info':
        console.log(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        break;
    }
  }

  /**
   * Get agent info for status reporting
   */
  getInfo() {
    return {
      type: this.type,
      capabilities: this.capabilities,
      health: this.health,
      stats: {
        messagesProcessed: this.messagesProcessed,
        errors: this.errors,
        uptime: Date.now() - this.startTime,
      },
    };
  }
}
