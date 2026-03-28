/**
 * Error Type Definitions
 * 
 * Standardized error types for Constraint Flow runtime.
 * All error codes are documented and stable across versions.
 * 
 * @module types/errors
 */

// ============================================
// Error Codes
// ============================================

/**
 * Standardized error codes for Constraint Flow
 * 
 * Format: <CATEGORY>_<SPECIFIC_ERROR>
 * Categories: WF (Workflow), STEP, CONN (Connector), CONST (Constraint), SYS (System)
 */
export const ErrorCodes = {
  // ============================================
  // Workflow Errors (WF_*)
  // ============================================
  
  /** Workflow not found */
  WF_NOT_FOUND: 'WF_NOT_FOUND',
  
  /** Workflow validation failed */
  WF_VALIDATION_ERROR: 'WF_VALIDATION_ERROR',
  
  /** Workflow execution timeout */
  WF_TIMEOUT: 'WF_TIMEOUT',
  
  /** Workflow already running */
  WF_ALREADY_RUNNING: 'WF_ALREADY_RUNNING',
  
  /** Workflow cancelled by user */
  WF_CANCELLED: 'WF_CANCELLED',
  
  /** Workflow version mismatch */
  WF_VERSION_MISMATCH: 'WF_VERSION_MISMATCH',
  
  /** Invalid workflow input */
  WF_INVALID_INPUT: 'WF_INVALID_INPUT',
  
  /** Workflow output validation failed */
  WF_OUTPUT_VALIDATION_ERROR: 'WF_OUTPUT_VALIDATION_ERROR',
  
  // ============================================
  // Step Errors (STEP_*)
  // ============================================
  
  /** Step not found */
  STEP_NOT_FOUND: 'STEP_NOT_FOUND',
  
  /** Step execution failed */
  STEP_EXECUTION_ERROR: 'STEP_EXECUTION_ERROR',
  
  /** Step timeout */
  STEP_TIMEOUT: 'STEP_TIMEOUT',
  
  /** Step condition not met */
  STEP_CONDITION_NOT_MET: 'STEP_CONDITION_NOT_MET',
  
  /** Step validation failed */
  STEP_VALIDATION_ERROR: 'STEP_VALIDATION_ERROR',
  
  /** Step retry exhausted */
  STEP_RETRY_EXHAUSTED: 'STEP_RETRY_EXHAUSTED',
  
  /** Step skipped due to condition */
  STEP_SKIPPED: 'STEP_SKIPPED',
  
  /** Circular dependency detected */
  STEP_CIRCULAR_DEPENDENCY: 'STEP_CIRCULAR_DEPENDENCY',
  
  // ============================================
  // Connector Errors (CONN_*)
  // ============================================
  
  /** Connector not found */
  CONN_NOT_FOUND: 'CONN_NOT_FOUND',
  
  /** Connector operation not found */
  CONN_OPERATION_NOT_FOUND: 'CONN_OPERATION_NOT_FOUND',
  
  /** Connector authentication failed */
  CONN_AUTH_FAILED: 'CONN_AUTH_FAILED',
  
  /** Connector rate limited */
  CONN_RATE_LIMITED: 'CONN_RATE_LIMITED',
  
  /** Connector timeout */
  CONN_TIMEOUT: 'CONN_TIMEOUT',
  
  /** Connector network error */
  CONN_NETWORK_ERROR: 'CONN_NETWORK_ERROR',
  
  /** Connector validation failed */
  CONN_VALIDATION_ERROR: 'CONN_VALIDATION_ERROR',
  
  /** Connector unavailable */
  CONN_UNAVAILABLE: 'CONN_UNAVAILABLE',
  
  /** Connector deprecated */
  CONN_DEPRECATED: 'CONN_DEPRECATED',
  
  // ============================================
  // Constraint Errors (CONST_*)
  // ============================================
  
  /** Constraint violation */
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  /** Constraint timeout */
  CONSTRAINT_TIMEOUT: 'CONSTRAINT_TIMEOUT',
  
  /** Constraint not found */
  CONSTRAINT_NOT_FOUND: 'CONSTRAINT_NOT_FOUND',
  
  /** Constraint configuration error */
  CONSTRAINT_CONFIG_ERROR: 'CONSTRAINT_CONFIG_ERROR',
  
  /** SLA breach */
  CONSTRAINT_SLA_BREACH: 'CONSTRAINT_SLA_BREACH',
  
  /** Approval required */
  CONSTRAINT_APPROVAL_REQUIRED: 'CONSTRAINT_APPROVAL_REQUIRED',
  
  // ============================================
  // System Errors (SYS_*)
  // ============================================
  
  /** Internal error */
  SYS_INTERNAL_ERROR: 'SYS_INTERNAL_ERROR',
  
  /** Memory limit exceeded */
  SYS_MEMORY_LIMIT: 'SYS_MEMORY_LIMIT',
  
  /** Configuration error */
  SYS_CONFIG_ERROR: 'SYS_CONFIG_ERROR',
  
  /** Feature not supported */
  SYS_NOT_SUPPORTED: 'SYS_NOT_SUPPORTED',
  
  /** Deprecation warning */
  SYS_DEPRECATED: 'SYS_DEPRECATED',
  
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================
// Base Error Class
// ============================================

/**
 * Base class for all Constraint Flow errors
 */
export class ConstraintFlowError extends Error {
  /** Error code */
  readonly code: ErrorCode;
  
  /** HTTP status code (for API responses) */
  readonly statusCode?: number;
  
  /** Whether error is retryable */
  readonly retryable: boolean;
  
  /** Additional error details */
  readonly details?: Record<string, unknown>;
  
  /** Timestamp when error occurred */
  readonly timestamp: string;
  
  /** Original error cause */
  readonly cause?: Error;

  constructor(
    message: string,
    code: ErrorCode,
    options?: {
      statusCode?: number;
      retryable?: boolean;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'ConstraintFlowError';
    this.code = code;
    this.statusCode = options?.statusCode;
    this.retryable = options?.retryable ?? false;
    this.details = options?.details;
    this.timestamp = new Date().toISOString();
    this.cause = options?.cause;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      retryable: this.retryable,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// ============================================
// Workflow Errors
// ============================================

export class WorkflowError extends ConstraintFlowError {
  constructor(
    message: string,
    code: ErrorCode,
    options?: {
      workflowName?: string;
      executionId?: string;
      statusCode?: number;
      retryable?: boolean;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      details: {
        ...options?.details,
        workflowName: options?.workflowName,
        executionId: options?.executionId,
      },
    });
    this.name = 'WorkflowError';
  }
}

export class WorkflowNotFoundError extends WorkflowError {
  constructor(workflowName: string) {
    super(`Workflow '${workflowName}' not found`, ErrorCodes.WF_NOT_FOUND, {
      workflowName,
      statusCode: 404,
      retryable: false,
    });
    this.name = 'WorkflowNotFoundError';
  }
}

export class WorkflowValidationError extends WorkflowError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCodes.WF_VALIDATION_ERROR, {
      statusCode: 400,
      retryable: false,
      details,
    });
    this.name = 'WorkflowValidationError';
  }
}

export class WorkflowTimeoutError extends WorkflowError {
  constructor(
    workflowName: string,
    executionId: string,
    timeoutMs: number
  ) {
    super(
      `Workflow '${workflowName}' timed out after ${timeoutMs}ms`,
      ErrorCodes.WF_TIMEOUT,
      {
        workflowName,
        executionId,
        statusCode: 408,
        retryable: true,
        details: { timeoutMs },
      }
    );
    this.name = 'WorkflowTimeoutError';
  }
}

// ============================================
// Step Errors
// ============================================

export class StepExecutionError extends ConstraintFlowError {
  readonly stepId: string;
  readonly operation?: string;

  constructor(
    message: string,
    stepId: string,
    options?: {
      operation?: string;
      statusCode?: number;
      retryable?: boolean;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, ErrorCodes.STEP_EXECUTION_ERROR, {
      ...options,
      details: {
        ...options?.details,
        stepId,
        operation: options?.operation,
      },
    });
    this.name = 'StepExecutionError';
    this.stepId = stepId;
    this.operation = options?.operation;
  }
}

export class StepTimeoutError extends ConstraintFlowError {
  readonly stepId: string;
  readonly timeoutMs: number;

  constructor(stepId: string, timeoutMs: number) {
    super(
      `Step '${stepId}' timed out after ${timeoutMs}ms`,
      ErrorCodes.STEP_TIMEOUT,
      {
        statusCode: 408,
        retryable: true,
        details: { stepId, timeoutMs },
      }
    );
    this.name = 'StepTimeoutError';
    this.stepId = stepId;
    this.timeoutMs = timeoutMs;
  }
}

// ============================================
// Connector Errors
// ============================================

export class ConnectorError extends ConstraintFlowError {
  readonly connector: string;
  readonly operation?: string;

  constructor(
    message: string,
    connector: string,
    code: ErrorCode,
    options?: {
      operation?: string;
      statusCode?: number;
      retryable?: boolean;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      details: {
        ...options?.details,
        connector,
        operation: options?.operation,
      },
    });
    this.name = 'ConnectorError';
    this.connector = connector;
    this.operation = options?.operation;
  }
}

export class ConnectorNotFoundError extends ConnectorError {
  constructor(connector: string) {
    super(`Connector '${connector}' not found`, connector, ErrorCodes.CONN_NOT_FOUND, {
      statusCode: 404,
      retryable: false,
    });
    this.name = 'ConnectorNotFoundError';
  }
}

export class ConnectorAuthError extends ConnectorError {
  constructor(connector: string, message?: string) {
    super(
      message ?? `Authentication failed for connector '${connector}'`,
      connector,
      ErrorCodes.CONN_AUTH_FAILED,
      {
        statusCode: 401,
        retryable: false,
      }
    );
    this.name = 'ConnectorAuthError';
  }
}

export class ConnectorRateLimitError extends ConnectorError {
  readonly retryAfter?: number;

  constructor(connector: string, retryAfter?: number) {
    super(
      `Rate limit exceeded for connector '${connector}'`,
      connector,
      ErrorCodes.CONN_RATE_LIMITED,
      {
        statusCode: 429,
        retryable: true,
        details: { retryAfter },
      }
    );
    this.name = 'ConnectorRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ConnectorTimeoutError extends ConnectorError {
  constructor(connector: string, operation?: string) {
    super(
      `Connector '${connector}' operation '${operation ?? 'unknown'}' timed out`,
      connector,
      ErrorCodes.CONN_TIMEOUT,
      {
        operation,
        statusCode: 408,
        retryable: true,
      }
    );
    this.name = 'ConnectorTimeoutError';
  }
}

export class ConnectorNetworkError extends ConnectorError {
  constructor(connector: string, operation?: string, cause?: Error) {
    super(
      `Network error connecting to '${connector}'`,
      connector,
      ErrorCodes.CONN_NETWORK_ERROR,
      {
        operation,
        statusCode: 503,
        retryable: true,
        cause,
      }
    );
    this.name = 'ConnectorNetworkError';
  }
}

// ============================================
// Constraint Errors
// ============================================

export class ConstraintViolationError extends ConstraintFlowError {
  readonly constraintType: string;
  readonly stepId?: string;

  constructor(
    message: string,
    constraintType: string,
    options?: {
      stepId?: string;
      config?: Record<string, unknown>;
      details?: Record<string, unknown>;
    }
  ) {
    super(message, ErrorCodes.CONSTRAINT_VIOLATION, {
      statusCode: 400,
      retryable: false,
      details: {
        ...options?.details,
        constraintType,
        stepId: options?.stepId,
        config: options?.config,
      },
    });
    this.name = 'ConstraintViolationError';
    this.constraintType = constraintType;
    this.stepId = options?.stepId;
  }
}

export class SLABreachError extends ConstraintFlowError {
  readonly slaType: 'response' | 'resolution';
  readonly priority: string;
  readonly durationMs: number;
  readonly allowedMs: number;

  constructor(
    slaType: 'response' | 'resolution',
    priority: string,
    durationMs: number,
    allowedMs: number
  ) {
    super(
      `SLA breach: ${slaType} time ${durationMs}ms exceeded ${allowedMs}ms limit for ${priority} priority`,
      ErrorCodes.CONSTRAINT_SLA_BREACH,
      {
        statusCode: 400,
        retryable: false,
        details: {
          slaType,
          priority,
          durationMs,
          allowedMs,
        },
      }
    );
    this.name = 'SLABreachError';
    this.slaType = slaType;
    this.priority = priority;
    this.durationMs = durationMs;
    this.allowedMs = allowedMs;
  }
}

// ============================================
// Compensation Error
// ============================================

export class CompensationError extends ConstraintFlowError {
  readonly stepId: string;

  constructor(
    stepId: string,
    message: string,
    options?: {
      compensationError?: Error;
      originalError?: Error;
    }
  ) {
    super(
      `Compensation failed for step '${stepId}': ${message}`,
      ErrorCodes.SYS_INTERNAL_ERROR,
      {
        statusCode: 500,
        retryable: false,
        details: {
          stepId,
          compensationError: options?.compensationError?.message,
          originalError: options?.originalError?.message,
        },
      }
    );
    this.name = 'CompensationError';
    this.stepId = stepId;
  }
}

// ============================================
// Error Handling Utilities
// ============================================

/**
 * Determines if an error is retryable
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof ConstraintFlowError) {
    return error.retryable;
  }
  return false;
}

/**
 * Gets the error code from an error
 */
export function getErrorCode(error: unknown): ErrorCode | undefined {
  if (error instanceof ConstraintFlowError) {
    return error.code;
  }
  return undefined;
}

/**
 * Converts unknown error to ConstraintFlowError
 */
export function toConstraintFlowError(error: unknown): ConstraintFlowError {
  if (error instanceof ConstraintFlowError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new ConstraintFlowError(
      error.message,
      ErrorCodes.SYS_INTERNAL_ERROR,
      { cause: error }
    );
  }
  
  return new ConstraintFlowError(
    String(error),
    ErrorCodes.SYS_INTERNAL_ERROR
  );
}
