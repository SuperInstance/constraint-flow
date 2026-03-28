/**
 * Workflow Type Definitions
 * 
 * Core workflow types for defining, validating, and executing workflows.
 * 
 * @module types/workflow
 */

import type { Constraint, WorkflowConstraint } from './constraints';
import type { ConnectorConfig, RetryConfig, CompensationAction } from './connectors';
import type { WorkflowEvent } from './events';

// ============================================
// JSON Schema Reference
// ============================================

/**
 * JSON Schema definition (simplified for documentation purposes)
 */
export interface JSONSchema {
  $schema?: string;
  $id?: string;
  $ref?: string;
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema | { $ref: string };
  enum?: (string | number | boolean)[];
  const?: unknown;
  default?: unknown;
  description?: string;
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  additionalProperties?: boolean | JSONSchema;
  [key: string]: unknown;
}

// ============================================
// Workflow Definition
// ============================================

/**
 * Main workflow definition interface
 * @template TInput - Input type for the workflow
 */
export interface Workflow<TInput = unknown> {
  /** Unique workflow identifier (kebab-case) */
  name: string;
  
  /** Semantic version for compatibility checking */
  version: string;
  
  /** Human-readable description */
  description?: string;
  
  /** Workflow trigger configuration */
  trigger?: TriggerConfig;
  
  /** Input schema for validation (JSON Schema) */
  input?: JSONSchema;
  
  /** Output schema for result validation */
  output?: JSONSchema;
  
  /** Ordered list of workflow steps */
  steps: WorkflowStep[];
  
  /** Workflow-level constraints */
  constraints?: WorkflowConstraint[];
  
  /** Error handling strategy */
  errorHandling?: ErrorHandlingConfig;
  
  /** Compensation actions for rollback */
  compensation?: Record<string, CompensationAction>;
  
  /** Event hooks for lifecycle events */
  events?: WorkflowEvents;
  
  /** Metadata for workflow management */
  metadata?: WorkflowMetadata;
}

// ============================================
// Trigger Configuration
// ============================================

export type TriggerType = 'webhook' | 'schedule' | 'manual' | 'event' | 'connector';

export interface TriggerConfig {
  /** Trigger type */
  type: TriggerType;
  
  /** Webhook-specific configuration */
  path?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  authentication?: 'required' | 'optional' | 'none';
  
  /** Schedule-specific configuration */
  cron?: string;
  timezone?: string;
  
  /** Event-specific configuration */
  connector?: string;
  event?: string;
  filter?: Record<string, unknown>;
  
  /** Deduplication configuration */
  deduplication?: {
    key: string;
    ttlMinutes: number;
  };
}

// ============================================
// Workflow Step
// ============================================

export interface WorkflowStep {
  // ============================================
  // Identity
  // ============================================
  
  /** Unique step identifier (kebab-case) */
  id: string;
  
  /** Human-readable step name */
  name?: string;
  
  /** Step description */
  description?: string;
  
  // ============================================
  // Execution
  // ============================================
  
  /** Connector to use for this step */
  connector?: string;
  
  /** Operation to execute on the connector */
  operation?: string;
  
  /** Agent to use for this step */
  agent?: string;
  
  /** Action to perform (built-in or custom) */
  action?: string;
  
  /** Input parameters (supports expressions like ${input.field}) */
  input: Record<string, unknown>;
  
  /** Output variable mappings */
  output?: Record<string, string>;
  
  // ============================================
  // Control Flow
  // ============================================
  
  /** Condition for step execution (expression language) */
  condition?: string;
  
  /** Dependencies on other steps */
  dependsOn?: string[];
  
  /** Step timeout in milliseconds */
  timeout?: number;
  
  /** Retry configuration */
  retry?: RetryConfig;
  
  /** Fallback configuration */
  fallback?: FallbackConfig;
  
  /** Circuit breaker configuration */
  circuitBreaker?: CircuitBreakerConfig;
  
  // ============================================
  // Special Step Types
  // ============================================
  
  /** Wait configuration (for wait steps) */
  waitFor?: WaitForConfig;
  
  /** Sub-step template for fan-out patterns */
  step?: WorkflowStep;
  
  /** Aggregation configuration for fan-out */
  aggregate?: Record<string, string>;
  
  // ============================================
  // Constraints & Compensation
  // ============================================
  
  /** Step-level constraints */
  constraints?: Constraint[];
  
  /** Compensation action for rollback */
  compensation?: CompensationAction;
  
  /** Whether step is optional (failures don't fail workflow) */
  optional?: boolean;
  
  /** Delay before execution (milliseconds) */
  delay?: number;
}

// ============================================
// Fallback Configuration
// ============================================

export interface FallbackConfig {
  /** Condition that triggers fallback */
  condition?: string;
  
  /** Connector to use for fallback */
  connector: string;
  
  /** Operation to execute */
  operation: string;
  
  /** Input parameters */
  input: Record<string, unknown>;
}

// ============================================
// Circuit Breaker Configuration
// ============================================

export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  
  /** Time to wait before attempting reset (ms) */
  resetTimeout: number;
  
  /** Fallback action when circuit is open */
  fallback: FallbackConfig;
  
  /** State change handlers */
  onStateChange?: {
    open?: CircuitBreakerStateHandler;
    close?: CircuitBreakerStateHandler;
  };
}

export interface CircuitBreakerStateHandler {
  /** Channels/users to notify */
  notify?: string[];
  
  /** Whether to log the state change */
  log?: boolean;
}

// ============================================
// Wait Configuration
// ============================================

export interface WaitForConfig {
  /** Event type to wait for */
  event: string;
  
  /** Correlation key for event matching */
  correlationKey: string;
  
  /** Timeout in milliseconds */
  timeout: number;
  
  /** Reminder notifications */
  reminders?: ReminderConfig[];
  
  /** Escalation configuration */
  escalation?: EscalationConfig;
  
  /** Periodic updates while waiting */
  periodicUpdate?: PeriodicUpdateConfig;
}

export interface ReminderConfig {
  /** Delay before reminder (ms) */
  delay: number;
  
  /** Connector to use */
  connector: string;
  
  /** Operation to execute */
  operation: string;
  
  /** Input parameters */
  input: Record<string, unknown>;
}

export interface EscalationConfig {
  /** Delay before escalation (ms) */
  delay: number;
  
  /** Connector to use */
  connector: string;
  
  /** Operation to execute */
  operation: string;
  
  /** Input parameters */
  input: Record<string, unknown>;
}

export interface PeriodicUpdateConfig {
  /** Interval between updates (ms) */
  interval: number;
  
  /** Action to perform */
  action: {
    connector: string;
    operation: string;
    input: Record<string, unknown>;
  };
}

// ============================================
// Error Handling
// ============================================

export type ErrorHandlingStrategy = 'compensate' | 'continue' | 'abort';

export interface ErrorHandlingConfig {
  /** Global error handling strategy */
  strategy: ErrorHandlingStrategy;
  
  /** Error-specific handlers */
  onError?: ErrorHandlerConfig[];
  
  /** Default retry configuration */
  defaultRetry?: RetryConfig;
  
  /** Timeout handling */
  onTimeout?: {
    steps?: string[];
    notify?: string[];
  };
}

export interface ErrorHandlerConfig {
  /** Error type to handle (glob pattern supported) */
  error: string;
  
  /** Steps to execute on this error */
  steps: string[];
  
  /** Whether to retry */
  retry?: boolean | RetryConfig;
  
  /** Whether to continue workflow after handling */
  continueWorkflow?: boolean;
}

// ============================================
// Workflow Events
// ============================================

export interface WorkflowEvents {
  /** Event emitted when workflow starts */
  onStarted?: WorkflowEvent;
  
  /** Event emitted when workflow completes successfully */
  onCompleted?: WorkflowEvent;
  
  /** Event emitted when workflow fails */
  onError?: WorkflowEvent;
  
  /** Event emitted when a step completes */
  onStepComplete?: WorkflowEvent;
}

// ============================================
// Workflow Metadata
// ============================================

export interface WorkflowMetadata {
  /** Author information */
  author?: string;
  
  /** Creation timestamp (ISO 8601) */
  createdAt?: string;
  
  /** Last update timestamp (ISO 8601) */
  updatedAt?: string;
  
  /** Tags for categorization */
  tags?: string[];
  
  /** Department or team ownership */
  owner?: string;
  
  /** Documentation URL */
  docsUrl?: string;
  
  /** Custom metadata fields */
  custom?: Record<string, unknown>;
}

// ============================================
// Workflow Result
// ============================================

export interface WorkflowResult<TResult = unknown> {
  /** Whether workflow completed successfully */
  success: boolean;
  
  /** Final workflow output */
  result?: TResult;
  
  /** Execution duration in milliseconds */
  duration: number;
  
  /** Execution trace for each step */
  steps: StepResult[];
  
  /** Whether compensation was executed */
  compensated?: boolean;
  
  /** Error if workflow failed */
  error?: WorkflowError;
  
  /** Workflow execution ID */
  executionId: string;
  
  /** Timestamp when workflow started */
  startedAt: string;
  
  /** Timestamp when workflow completed */
  completedAt: string;
}

export interface StepResult {
  /** Step ID */
  id: string;
  
  /** Step name */
  name?: string;
  
  /** Whether step succeeded */
  success: boolean;
  
  /** Step output */
  result?: unknown;
  
  /** Step duration in milliseconds */
  duration: number;
  
  /** Number of retry attempts */
  attempts?: number;
  
  /** Error if step failed */
  error?: StepError;
}

export interface WorkflowError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Step where error occurred */
  stepId?: string;
  
  /** Original error */
  cause?: unknown;
}

export interface StepError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Operation that failed */
  operation?: string;
  
  /** Original error */
  cause?: unknown;
}

// ============================================
// Execution Status
// ============================================

export type WorkflowStatus = 
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'compensating';

export interface ExecutionStatus {
  /** Execution ID */
  executionId: string;
  
  /** Workflow name */
  workflowName: string;
  
  /** Current status */
  status: WorkflowStatus;
  
  /** Current step being executed */
  currentStep?: string;
  
  /** Completed steps */
  completedSteps: string[];
  
  /** Failed steps */
  failedSteps: string[];
  
  /** Remaining steps */
  pendingSteps: string[];
  
  /** Constraint status */
  constraints: ConstraintStatus[];
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Timestamp when execution started */
  startedAt: string;
  
  /** Estimated time remaining (ms) */
  estimatedTimeRemaining?: number;
}

export interface ConstraintStatus {
  /** Constraint type */
  type: string;
  
  /** Whether constraint is satisfied */
  satisfied: boolean;
  
  /** Constraint description */
  description?: string;
  
  /** Violation details if not satisfied */
  violation?: {
    message: string;
    details?: Record<string, unknown>;
  };
}
