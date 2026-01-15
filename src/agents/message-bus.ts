/**
 * Message Bus for Inter-Agent Communication
 *
 * Implements pub/sub pattern for asynchronous agent communication.
 * Agents subscribe to message types and the bus routes messages appropriately.
 */

import { v4 as uuidv4 } from 'uuid';
import type { AgentMessage, AgentType } from './types';

type MessageHandler<T = unknown> = (message: AgentMessage<T>) => Promise<void>;

interface Subscription {
  agentType: AgentType;
  handler: MessageHandler;
}

/**
 * Singleton message bus for agent communication
 */
class MessageBus {
  private subscriptions: Map<AgentType, Subscription[]> = new Map();
  private messageLog: AgentMessage[] = [];
  private maxLogSize = 1000;

  /**
   * Subscribe an agent to receive messages
   */
  subscribe(agentType: AgentType, handler: MessageHandler): () => void {
    const subscription: Subscription = { agentType, handler };

    if (!this.subscriptions.has(agentType)) {
      this.subscriptions.set(agentType, []);
    }

    this.subscriptions.get(agentType)!.push(subscription);

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(agentType);
      if (subs) {
        const index = subs.indexOf(subscription);
        if (index > -1) {
          subs.splice(index, 1);
        }
      }
    };
  }

  /**
   * Publish a message to a specific agent
   */
  async publish<T = unknown>(message: AgentMessage<T>): Promise<void> {
    // Log the message
    this.logMessage(message);

    // Get subscribers for the target agent
    const subscribers = this.subscriptions.get(message.toAgent) || [];

    if (subscribers.length === 0) {
      console.warn(
        `No subscribers for agent type: ${message.toAgent}. Message ${message.messageId} not delivered.`
      );
      return;
    }

    // Deliver to all subscribers (typically just one per agent type)
    const deliveryPromises = subscribers.map((sub) =>
      sub.handler(message).catch((error) => {
        console.error(
          `Error delivering message ${message.messageId} to ${message.toAgent}:`,
          error
        );
      })
    );

    await Promise.all(deliveryPromises);
  }

  /**
   * Send a request and wait for a response
   * Uses correlationId to match request/response pairs
   */
  async request<TRequest, TResponse>(
    fromAgent: AgentType,
    toAgent: AgentType,
    payload: TRequest,
    timeoutMs: number = 30000
  ): Promise<TResponse> {
    const messageId = uuidv4();
    const correlationId = uuidv4();

    const requestMessage: AgentMessage<TRequest> = {
      messageId,
      correlationId,
      fromAgent,
      toAgent,
      messageType: 'REQUEST',
      priority: 'MEDIUM',
      payload,
      timestamp: new Date(),
    };

    // Set up response listener
    const responsePromise = new Promise<TResponse>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(
          new Error(
            `Request timeout: ${fromAgent} -> ${toAgent} (${timeoutMs}ms)`
          )
        );
      }, timeoutMs);

      const unsubscribe = this.subscribe(fromAgent, async (message) => {
        if (
          message.messageType === 'RESPONSE' &&
          message.correlationId === correlationId
        ) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(message.payload as TResponse);
        }
      });
    });

    // Publish the request
    await this.publish(requestMessage);

    return responsePromise;
  }

  /**
   * Send a response to a request
   */
  async respond<T>(
    originalMessage: AgentMessage,
    fromAgent: AgentType,
    responsePayload: T
  ): Promise<void> {
    const responseMessage: AgentMessage<T> = {
      messageId: uuidv4(),
      correlationId: originalMessage.correlationId,
      fromAgent,
      toAgent: originalMessage.fromAgent,
      messageType: 'RESPONSE',
      priority: originalMessage.priority,
      payload: responsePayload,
      timestamp: new Date(),
    };

    await this.publish(responseMessage);
  }

  /**
   * Broadcast an event to all agents
   */
  async broadcast<T>(fromAgent: AgentType, payload: T): Promise<void> {
    const agentTypes: AgentType[] = Array.from(this.subscriptions.keys());

    const messages = agentTypes.map((toAgent) => ({
      messageId: uuidv4(),
      fromAgent,
      toAgent,
      messageType: 'EVENT' as const,
      priority: 'MEDIUM' as const,
      payload,
      timestamp: new Date(),
    }));

    await Promise.all(messages.map((msg) => this.publish(msg)));
  }

  /**
   * Get message log for debugging
   */
  getMessageLog(): AgentMessage[] {
    return [...this.messageLog];
  }

  /**
   * Get messages for a specific agent
   */
  getMessagesForAgent(agentType: AgentType): AgentMessage[] {
    return this.messageLog.filter(
      (msg) => msg.toAgent === agentType || msg.fromAgent === agentType
    );
  }

  /**
   * Clear message log
   */
  clearMessageLog(): void {
    this.messageLog = [];
  }

  /**
   * Get statistics about message bus activity
   */
  getStats() {
    return {
      totalMessages: this.messageLog.length,
      subscriberCount: Array.from(this.subscriptions.values()).reduce(
        (sum, subs) => sum + subs.length,
        0
      ),
      agentTypes: Array.from(this.subscriptions.keys()),
    };
  }

  /**
   * Reset the message bus (for testing)
   */
  reset(): void {
    this.subscriptions.clear();
    this.messageLog = [];
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private logMessage(message: AgentMessage): void {
    this.messageLog.push(message);

    // Maintain max log size
    if (this.messageLog.length > this.maxLogSize) {
      this.messageLog.shift();
    }
  }
}

// Export singleton instance
export const messageBus = new MessageBus();
export { MessageBus };
