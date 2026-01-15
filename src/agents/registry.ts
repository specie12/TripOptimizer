/**
 * Agent Registry
 *
 * Centralized registry for agent discovery and management.
 * Tracks all active agents and their health status.
 */

import type { Agent } from './base.agent';
import type { AgentType, AgentContext, AgentHealth } from './types';

/**
 * Singleton registry for managing agents
 */
class AgentRegistry {
  private agents: Map<AgentType, Agent> = new Map();
  private initialized = false;

  /**
   * Register an agent
   */
  register(agent: Agent): void {
    if (this.agents.has(agent.type)) {
      throw new Error(`Agent ${agent.type} is already registered`);
    }

    this.agents.set(agent.type, agent);
  }

  /**
   * Get an agent by type
   */
  get(agentType: AgentType): Agent | undefined {
    return this.agents.get(agentType);
  }

  /**
   * Check if an agent is registered
   */
  has(agentType: AgentType): boolean {
    return this.agents.has(agentType);
  }

  /**
   * Get all registered agents
   */
  getAll(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get all agent types
   */
  getAgentTypes(): AgentType[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Initialize all agents with shared context
   */
  async initializeAll(context: AgentContext): Promise<void> {
    if (this.initialized) {
      console.warn('Agents already initialized');
      return;
    }

    const agents = this.getAll();
    console.log(`Initializing ${agents.length} agents...`);

    // Initialize agents in parallel
    await Promise.all(
      agents.map(async (agent) => {
        try {
          await agent.initialize(context);
          console.log(`✓ ${agent.type} agent initialized`);
        } catch (error) {
          console.error(`✗ Failed to initialize ${agent.type} agent:`, error);
          throw error;
        }
      })
    );

    this.initialized = true;
    console.log('All agents initialized successfully');
  }

  /**
   * Shutdown all agents gracefully
   */
  async shutdownAll(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    const agents = this.getAll();
    console.log(`Shutting down ${agents.length} agents...`);

    await Promise.all(
      agents.map(async (agent) => {
        try {
          await agent.shutdown();
          console.log(`✓ ${agent.type} agent shutdown`);
        } catch (error) {
          console.error(`✗ Error shutting down ${agent.type} agent:`, error);
        }
      })
    );

    this.initialized = false;
    console.log('All agents shutdown');
  }

  /**
   * Get health status of all agents
   */
  async getHealthStatus(): Promise<Map<AgentType, AgentHealth>> {
    const healthMap = new Map<AgentType, AgentHealth>();

    await Promise.all(
      Array.from(this.agents.entries()).map(async ([type, agent]) => {
        try {
          const health = await agent.healthCheck();
          healthMap.set(type, health);
        } catch (error) {
          console.error(`Error checking health of ${type} agent:`, error);
          healthMap.set(type, {
            status: 'UNHEALTHY',
            lastCheckAt: new Date(),
            details: {
              lastError: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      })
    );

    return healthMap;
  }

  /**
   * Get health status summary
   */
  async getHealthSummary() {
    const healthMap = await this.getHealthStatus();
    const summary = {
      total: healthMap.size,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      starting: 0,
    };

    for (const health of healthMap.values()) {
      switch (health.status) {
        case 'HEALTHY':
          summary.healthy++;
          break;
        case 'DEGRADED':
          summary.degraded++;
          break;
        case 'UNHEALTHY':
          summary.unhealthy++;
          break;
        case 'STARTING':
          summary.starting++;
          break;
      }
    }

    return {
      ...summary,
      allHealthy: summary.healthy === summary.total,
      agents: Array.from(healthMap.entries()).map(([type, health]) => ({
        type,
        status: health.status,
        details: health.details,
      })),
    };
  }

  /**
   * Check if all agents are healthy
   */
  async areAllHealthy(): Promise<boolean> {
    const healthMap = await this.getHealthStatus();
    return Array.from(healthMap.values()).every(
      (health) => health.status === 'HEALTHY'
    );
  }

  /**
   * Get agent info for all agents
   */
  getAgentInfo() {
    return Array.from(this.agents.values()).map((agent) => agent.getInfo());
  }

  /**
   * Clear all agents (for testing)
   */
  clear(): void {
    this.agents.clear();
    this.initialized = false;
  }

  /**
   * Get initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistry();
export { AgentRegistry };
