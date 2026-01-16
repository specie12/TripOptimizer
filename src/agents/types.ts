/**
 * Agent Types and Interfaces
 *
 * Core type definitions for the multi-agent architecture.
 */

// ============================================
// AGENT TYPES
// ============================================

export type AgentType =
  | 'ORCHESTRATOR'
  | 'BUDGET'
  | 'OPTIMIZATION'
  | 'BOOKING'
  | 'MONITORING'
  | 'EXCEPTION';

// ============================================
// MESSAGE TYPES
// ============================================

export type MessageType = 'REQUEST' | 'RESPONSE' | 'EVENT' | 'ALERT';
export type MessagePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AgentMessage<T = unknown> {
  messageId: string;
  fromAgent: AgentType;
  toAgent: AgentType;
  messageType: MessageType;
  priority: MessagePriority;
  payload: T;
  correlationId?: string; // Links related messages (request/response)
  timestamp: Date;
}

// ============================================
// AGENT CONTEXT
// ============================================

/**
 * Shared context available to all agents
 * Provides access to database, services, and shared state
 */
export interface AgentContext {
  tripRequestId?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// AGENT HEALTH
// ============================================

export type AgentHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'STARTING';

export interface AgentHealth {
  status: AgentHealthStatus;
  lastCheckAt: Date;
  details?: {
    uptime?: number; // milliseconds
    messagesProcessed?: number;
    errors?: number;
    lastError?: string;
  };
}

// ============================================
// TRIP LIFECYCLE STATES
// ============================================

export enum TripState {
  PLANNING = 'PLANNING',           // Initial budget allocation, candidate generation
  OPTIMIZING = 'OPTIMIZING',       // Ranking and optimization
  BOOKING = 'BOOKING',             // Executing bookings
  CONFIRMED = 'CONFIRMED',         // Bookings completed, waiting for trip

  ACTIVE = 'ACTIVE',               // Trip in progress
  COMPLETED = 'COMPLETED',         // Trip finished
  CANCELLED = 'CANCELLED',         // Trip cancelled
  FAILED = 'FAILED',               // Booking or planning failed
}

/**
 * Valid state transitions for trip lifecycle
 */
export const VALID_TRANSITIONS: Record<TripState, TripState[]> = {
  [TripState.PLANNING]: [TripState.OPTIMIZING, TripState.CANCELLED],
  [TripState.OPTIMIZING]: [TripState.BOOKING, TripState.PLANNING, TripState.CANCELLED],
  [TripState.BOOKING]: [TripState.CONFIRMED, TripState.FAILED, TripState.CANCELLED],
  [TripState.CONFIRMED]: [TripState.ACTIVE, TripState.CANCELLED],
  [TripState.ACTIVE]: [TripState.COMPLETED, TripState.CANCELLED],
  [TripState.COMPLETED]: [],
  [TripState.CANCELLED]: [],
  [TripState.FAILED]: [TripState.PLANNING], // Can retry planning
};

// ============================================
// AGENT CAPABILITIES
// ============================================

export interface AgentCapability {
  name: string;
  description: string;
  requiredAgents?: AgentType[]; // Dependencies on other agents
}

// ============================================
// MESSAGE PAYLOAD TYPES
// ============================================

/**
 * Budget Agent Message Payloads
 */
export interface BudgetAllocationRequest {
  type: 'ALLOCATE';
  totalBudget: number; // cents
  priorities?: Record<string, number>;
  constraints?: Record<string, unknown>;
}

export interface BudgetAllocationResponse {
  allocations: Record<string, number>; // category -> amount in cents
  remaining: number;
}

export interface SpendRecordRequest {
  type: 'RECORD_SPEND';
  category: string;
  amount: number;
  description?: string;
}

/**
 * Optimization Agent Message Payloads
 */
export interface OptimizationRequest {
  type: 'RANK' | 'FIND_ALTERNATIVES';
  tripRequestId?: string; // Phase 2: For checking locked items
  candidates?: unknown[];
  currentSelections?: unknown[];
  constraints?: Record<string, unknown>;
}

export interface OptimizationResponse {
  ranked?: unknown[];
  alternatives?: unknown[];
  savings?: number;
}

/**
 * Booking Agent Message Payloads
 */
export interface BookingRequest {
  type: 'BOOK' | 'CANCEL' | 'MODIFY';
  optionId: string;
  optionType: 'flight' | 'hotel' | 'activity';
  userInfo?: Record<string, unknown>;
}

export interface BookingResponse {
  success: boolean;
  confirmationCode?: string;
  error?: string;
}

/**
 * Monitoring Agent Message Payloads
 */
export interface MonitoringAlert {
  type: 'PRICE_CHANGE' | 'SCHEDULE_CHANGE' | 'AVAILABILITY_CHANGE';
  itemId: string;
  itemType: string;
  details: Record<string, unknown>;
}

/**
 * Exception Agent Message Payloads
 */
export interface ExceptionRequest {
  type: 'HANDLE_FAILURE' | 'RESOLVE_CONFLICT' | 'PROCESS_REFUND';
  error: string;
  context?: Record<string, unknown>;
}

export interface ExceptionResponse {
  resolved: boolean;
  actions: string[];
  alternatives?: unknown[];
}
