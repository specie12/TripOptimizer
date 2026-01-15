/**
 * Trip Lifecycle State Machine
 *
 * Manages state transitions for trips throughout their lifecycle.
 * Enforces valid state transitions and tracks state history.
 */

import { TripState, VALID_TRANSITIONS } from './types';

export interface StateTransition {
  fromState: TripState;
  toState: TripState;
  timestamp: Date;
  reason?: string;
  triggeredBy?: string; // Agent or user who triggered transition
}

export interface TripStateInfo {
  currentState: TripState;
  previousState?: TripState;
  history: StateTransition[];
  enteredCurrentStateAt: Date;
}

/**
 * State Machine for managing trip lifecycle
 */
export class TripStateMachine {
  private currentState: TripState;
  private history: StateTransition[] = [];
  private enteredCurrentStateAt: Date;

  constructor(initialState: TripState = TripState.PLANNING) {
    this.currentState = initialState;
    this.enteredCurrentStateAt = new Date();
  }

  /**
   * Get current state
   */
  getCurrentState(): TripState {
    return this.currentState;
  }

  /**
   * Check if a transition is valid
   */
  canTransitionTo(newState: TripState): boolean {
    const validTransitions = VALID_TRANSITIONS[this.currentState] || [];
    return validTransitions.includes(newState);
  }

  /**
   * Attempt to transition to a new state
   */
  transitionTo(
    newState: TripState,
    reason?: string,
    triggeredBy?: string
  ): boolean {
    if (!this.canTransitionTo(newState)) {
      console.warn(
        `Invalid state transition: ${this.currentState} -> ${newState}`
      );
      return false;
    }

    const transition: StateTransition = {
      fromState: this.currentState,
      toState: newState,
      timestamp: new Date(),
      reason,
      triggeredBy,
    };

    this.history.push(transition);
    this.currentState = newState;
    this.enteredCurrentStateAt = new Date();

    return true;
  }

  /**
   * Get all valid next states from current state
   */
  getValidNextStates(): TripState[] {
    return VALID_TRANSITIONS[this.currentState] || [];
  }

  /**
   * Get state transition history
   */
  getHistory(): StateTransition[] {
    return [...this.history];
  }

  /**
   * Get complete state info
   */
  getStateInfo(): TripStateInfo {
    const previousTransition = this.history[this.history.length - 1];

    return {
      currentState: this.currentState,
      previousState: previousTransition?.fromState,
      history: this.history,
      enteredCurrentStateAt: this.enteredCurrentStateAt,
    };
  }

  /**
   * Check if trip is in a terminal state
   */
  isTerminalState(): boolean {
    const validTransitions = VALID_TRANSITIONS[this.currentState] || [];
    return validTransitions.length === 0;
  }

  /**
   * Check if trip is active (in progress)
   */
  isActive(): boolean {
    return this.currentState === TripState.ACTIVE;
  }

  /**
   * Check if trip is completed
   */
  isCompleted(): boolean {
    return (
      this.currentState === TripState.COMPLETED ||
      this.currentState === TripState.CANCELLED
    );
  }

  /**
   * Check if trip is in planning phase
   */
  isPlanning(): boolean {
    return (
      this.currentState === TripState.PLANNING ||
      this.currentState === TripState.OPTIMIZING
    );
  }

  /**
   * Check if trip is in booking phase
   */
  isBooking(): boolean {
    return this.currentState === TripState.BOOKING;
  }

  /**
   * Check if trip bookings are confirmed
   */
  isConfirmed(): boolean {
    return this.currentState === TripState.CONFIRMED;
  }

  /**
   * Get time spent in current state (milliseconds)
   */
  getTimeInCurrentState(): number {
    return Date.now() - this.enteredCurrentStateAt.getTime();
  }

  /**
   * Reset state machine to initial state (for testing)
   */
  reset(initialState: TripState = TripState.PLANNING): void {
    this.currentState = initialState;
    this.history = [];
    this.enteredCurrentStateAt = new Date();
  }

  /**
   * Serialize state machine for persistence
   */
  serialize(): string {
    return JSON.stringify({
      currentState: this.currentState,
      history: this.history,
      enteredCurrentStateAt: this.enteredCurrentStateAt,
    });
  }

  /**
   * Deserialize state machine from persisted data
   */
  static deserialize(data: string): TripStateMachine {
    const parsed = JSON.parse(data);
    const machine = new TripStateMachine(parsed.currentState);
    machine.history = parsed.history.map((t: StateTransition) => ({
      ...t,
      timestamp: new Date(t.timestamp),
    }));
    machine.enteredCurrentStateAt = new Date(parsed.enteredCurrentStateAt);
    return machine;
  }
}

/**
 * Helper function to create state machine from database record
 */
export function createStateMachineFromDb(
  stateData?: string
): TripStateMachine {
  if (stateData) {
    try {
      return TripStateMachine.deserialize(stateData);
    } catch (error) {
      console.error('Error deserializing state machine:', error);
    }
  }

  return new TripStateMachine();
}
