/**
 * Event Type Definitions
 * 
 * Types for workflow events, event handling, and event-driven workflows.
 * 
 * @module types/events
 */

// ============================================
// Workflow Events
// ============================================

export interface WorkflowEvent {
  /** Event action type */
  action: 'emit' | 'trigger' | 'wait';
  
  /** Event name/type */
  event: string;
  
  /** Event payload (supports expressions) */
  payload?: Record<string, unknown> | string;
  
  /** Event metadata */
  metadata?: Record<string, unknown>;
}

// ============================================
// Event Types
// ============================================

export type WorkflowEventType =
  | 'workflow.started'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'workflow.cancelled'
  | 'workflow.paused'
  | 'workflow.resumed'
  | 'step.started'
  | 'step.completed'
  | 'step.failed'
  | 'step.skipped'
  | 'step.retry'
  | 'constraint.violation'
  | 'constraint.warning'
  | 'compensation.started'
  | 'compensation.completed'
  | 'compensation.failed'
  | 'approval.requested'
  | 'approval.granted'
  | 'approval.rejected'
  | 'sla.warning'
  | 'sla.breach'
  | 'escalation.triggered';

// ============================================
// Event Payloads
// ============================================

export interface WorkflowStartedPayload {
  workflowName: string;
  executionId: string;
  input: unknown;
  timestamp: string;
  trigger: string;
}

export interface WorkflowCompletedPayload {
  workflowName: string;
  executionId: string;
  result: unknown;
  duration: number;
  timestamp: string;
}

export interface WorkflowFailedPayload {
  workflowName: string;
  executionId: string;
  error: {
    code: string;
    message: string;
    stepId?: string;
  };
  compensated: boolean;
  duration: number;
  timestamp: string;
}

export interface StepStartedPayload {
  workflowName: string;
  executionId: string;
  stepId: string;
  stepName?: string;
  timestamp: string;
}

export interface StepCompletedPayload {
  workflowName: string;
  executionId: string;
  stepId: string;
  stepName?: string;
  result: unknown;
  duration: number;
  timestamp: string;
}

export interface StepFailedPayload {
  workflowName: string;
  executionId: string;
  stepId: string;
  stepName?: string;
  error: {
    code: string;
    message: string;
  };
  attempt: number;
  maxAttempts: number;
  willRetry: boolean;
  timestamp: string;
}

export interface ConstraintViolationPayload {
  workflowName: string;
  executionId: string;
  constraintType: string;
  constraint: Record<string, unknown>;
  violation: {
    field?: string;
    expected?: unknown;
    actual?: unknown;
    message: string;
  };
  severity: 'error' | 'warning' | 'info';
  stepId?: string;
  timestamp: string;
}

export interface ApprovalRequestedPayload {
  workflowName: string;
  executionId: string;
  approvalId: string;
  requestedBy?: string;
  requestedFrom: string[];
  context: Record<string, unknown>;
  expiresAt?: string;
  timestamp: string;
}

export interface ApprovalDecisionPayload {
  workflowName: string;
  executionId: string;
  approvalId: string;
  decision: 'approved' | 'rejected';
  decidedBy: string;
  reason?: string;
  timestamp: string;
}

export interface SLAPayload {
  workflowName: string;
  executionId: string;
  slaType: 'response' | 'resolution';
  priority: string;
  elapsedMs: number;
  limitMs: number;
  percentageRemaining: number;
  timestamp: string;
}

export interface EscalationPayload {
  workflowName: string;
  executionId: string;
  escalationLevel: number;
  escalatedTo: string;
  reason: string;
  previousLevel?: number;
  timestamp: string;
}

// ============================================
// Event Handler
// ============================================

export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

export interface EventSubscription {
  /** Subscription ID */
  id: string;
  
  /** Event type to subscribe to */
  eventType: WorkflowEventType | string;
  
  /** Event handler */
  handler: EventHandler;
  
  /** Filter for event matching */
  filter?: EventFilter;
  
  /** Whether subscription is active */
  active: boolean;
}

export interface EventFilter {
  /** Workflow name filter */
  workflowName?: string | string[];
  
  /** Step ID filter */
  stepId?: string | string[];
  
  /** Custom filter expression */
  expression?: string;
}

// ============================================
// Event Bus Interface
// ============================================

export interface EventBus {
  /** Subscribe to events */
  subscribe(subscription: EventSubscription): void;
  
  /** Unsubscribe from events */
  unsubscribe(subscriptionId: string): void;
  
  /** Emit an event */
  emit(eventType: WorkflowEventType | string, payload: unknown): Promise<void>;
  
  /** Get all subscriptions */
  getSubscriptions(): EventSubscription[];
  
  /** Clear all subscriptions */
  clearAll(): void;
}

// ============================================
// Webhook Event
// ============================================

export interface WebhookEvent {
  /** Event ID */
  id: string;
  
  /** Event source (connector name) */
  source: string;
  
  /** Event type */
  type: string;
  
  /** Event payload */
  payload: unknown;
  
  /** Event timestamp */
  timestamp: string;
  
  /** Signature for verification */
  signature?: string;
  
  /** Headers from the webhook request */
  headers?: Record<string, string>;
}

// ============================================
// Wait Event
// ============================================

export interface WaitEvent {
  /** Event type to wait for */
  type: string;
  
  /** Correlation key for matching */
  correlationKey: string;
  
  /** Event payload */
  payload: unknown;
  
  /** Event timestamp */
  timestamp: string;
  
  /** Source of the event */
  source?: string;
}
