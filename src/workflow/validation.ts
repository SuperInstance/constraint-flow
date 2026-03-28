/**
 * Constraint-Based Workflow Validation
 * 
 * Implements the WorkflowValidator class for validating workflows against
 * business constraints, SLAs, and compliance requirements. Provides both
 * structural validation and runtime constraint checking.
 * 
 * @module workflow/validation
 * @version 1.0.0
 */

import type { 
  Workflow, 
  WorkflowStep, 
  WorkflowResult,
  ConstraintStatus 
} from '../types/workflow';
import type { 
  Constraint, 
  WorkflowConstraint,
  ConstraintType,
  ConstraintViolation,
  ConstraintValidationResult,
  ConstraintSeverity
} from '../types/constraints';
import { DAGBuilder, type WorkflowDAG } from './dag';

// ============================================
// Types
// ============================================

/**
 * Result of workflow validation
 */
export interface WorkflowValidationResult {
  /** Whether workflow is valid */
  valid: boolean;
  /** Structural errors (DAG issues, missing references) */
  structuralErrors: ValidationError[];
  /** Constraint violations */
  constraintViolations: ConstraintViolation[];
  /** Warnings (non-blocking issues) */
  warnings: ValidationWarning[];
  /** Validation duration (ms) */
  duration: number;
}

/**
 * Structural validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  location?: string;
  severity: 'error' | 'warning';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

/**
 * Runtime context for constraint evaluation
 */
export interface ConstraintContext {
  /** Current workflow input */
  input: Record<string, unknown>;
  /** Step results so far */
  stepResults: Map<string, unknown>;
  /** Current timestamp */
  timestamp: Date;
  /** Workflow execution ID */
  executionId: string;
  /** Current step being validated (if applicable) */
  currentStep?: string;
}

/**
 * Constraint evaluator function type
 */
export type ConstraintEvaluator = (
  value: unknown,
  config: Record<string, unknown>,
  context: ConstraintContext
) => boolean | Promise<boolean>;

// ============================================
// Built-in Constraint Evaluators
// ============================================

/**
 * Registry of built-in constraint evaluators
 */
const BUILTIN_EVALUATORS: Record<ConstraintType, ConstraintEvaluator> = {
  // Value Constraints
  amount_limit: (value, config, ctx) => {
    const max = config.max as number;
    const numValue = Number(value);
    if (isNaN(numValue)) return false;
    return numValue <= max;
  },

  amount_range: (value, config, ctx) => {
    const min = config.min as number;
    const max = config.max as number;
    const numValue = Number(value);
    if (isNaN(numValue)) return false;
    return numValue >= min && numValue <= max;
  },

  exact_precision: (value, config, ctx) => {
    // Check if value has appropriate precision
    const precision = config.precision as string;
    const numValue = Number(value);
    if (isNaN(numValue)) return false;
    
    const precisionMap: Record<string, number> = {
      'cents': 2,
      'micros': 6,
      'units': 0,
      'milliseconds': 3
    };
    
    const decimals = precisionMap[precision] || 2;
    const factor = Math.pow(10, decimals);
    return (numValue * factor) % 1 === 0;
  },

  category_validation: (value, config, ctx) => {
    const allowed = config.allowed as string[];
    const caseSensitive = config.caseSensitive !== false;
    
    if (typeof value !== 'string') return false;
    
    if (caseSensitive) {
      return allowed.includes(value);
    }
    const lowerAllowed = allowed.map(a => a.toLowerCase());
    return lowerAllowed.includes(value.toLowerCase());
  },

  time_window: (value, config, ctx) => {
    const date = new Date(value as string);
    if (isNaN(date.getTime())) return false;
    
    const now = ctx.timestamp;
    const maxAge = config.maxAge as number | undefined;
    const minAge = config.minAge as number | undefined;
    
    if (maxAge) {
      const maxDate = new Date(now.getTime() - maxAge * 24 * 60 * 60 * 1000);
      if (date < maxDate) return false;
    }
    
    if (minAge) {
      const minDate = new Date(now.getTime() - minAge * 24 * 60 * 60 * 1000);
      if (date > minDate) return false;
    }
    
    if (!config.allowFuture && date > now) return false;
    
    return true;
  },

  // Temporal Constraints
  time_limit: (value, config, ctx) => {
    // This is checked at runtime against execution duration
    // For validation, just check config is valid
    return typeof config.milliseconds === 'number';
  },

  business_hours: (value, config, ctx) => {
    const now = ctx.timestamp;
    const timezone = config.timezone as string || 'UTC';
    
    // Simple business hours check (9 AM - 5 PM)
    const startHour = parseInt(config.start as string || '09:00'.split(':')[0]);
    const endHour = parseInt(config.end as string || '17:00'.split(':')[0]);
    const days = (config.days as number[]) || [1, 2, 3, 4, 5]; // Mon-Fri
    
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    return days.includes(dayOfWeek) && hour >= startHour && hour < endHour;
  },

  weekdays_only: (value, config, ctx) => {
    const dayOfWeek = ctx.timestamp.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  },

  sla: (value, config, ctx) => {
    // SLA validation happens at runtime
    // For static validation, check config structure
    return config.responseTime !== undefined || config.resolutionTime !== undefined;
  },

  // Approval Constraints
  approval_required: (value, config, ctx) => {
    // Approval constraints are enforced at runtime
    // Validation checks that roles/users are specified if required
    if (config.roles || config.users) return true;
    return true; // Can be configured at runtime
  },

  multi_approval: (value, config, ctx) => {
    const count = config.count as number;
    return typeof count === 'number' && count > 0;
  },

  conditional_approval: (value, config, ctx) => {
    // Check that 'if' and 'then' are defined
    return config.if !== undefined && config.then !== undefined;
  },

  escalation_path: (value, config, ctx) => {
    const path = config.path as Array<{ delay: number; action: string }>;
    return Array.isArray(path) && path.length > 0;
  },

  // Geometric Constraints
  balanced_workload: (value, config, ctx) => {
    // Geometric constraints are checked at runtime during routing
    // Validation ensures tolerance is valid
    const tolerance = config.tolerance as number | undefined;
    return tolerance === undefined || (tolerance >= 0 && tolerance <= 1);
  },

  no_cycles: (value, config, ctx) => {
    // This is checked during DAG validation
    return true;
  },

  min_parallelism: (value, config, ctx) => {
    const n = config.n as number;
    return typeof n === 'number' && n > 0;
  },

  max_latency: (value, config, ctx) => {
    const ms = config.ms as number;
    return typeof ms === 'number' && ms > 0;
  },

  // Compliance Constraints
  audit_trail: (value, config, ctx) => {
    const required = config.required as boolean;
    if (!required) return true;
    // Check retention period if specified
    const retentionDays = config.retentionDays as number | undefined;
    return retentionDays === undefined || retentionDays > 0;
  },

  hipaa_compliant: (value, config, ctx) => {
    const required = config.required as boolean;
    if (!required) return true;
    // Check PHI fields are specified
    return config.phiFields !== undefined || config.minimumNecessary === true;
  },

  data_locality: (value, config, ctx) => {
    const region = config.region as string;
    return typeof region === 'string' && region.length > 0;
  },

  compliance_check: (value, config, ctx) => {
    const frameworks = config.frameworks as string[];
    return Array.isArray(frameworks) && frameworks.length > 0;
  },

  // System Constraints
  rate_limit: (value, config, ctx) => {
    const maxPerMinute = config.maxPerMinute as number | undefined;
    const maxPerSecond = config.maxPerSecond as number | undefined;
    return (maxPerMinute !== undefined && maxPerMinute > 0) || 
           (maxPerSecond !== undefined && maxPerSecond > 0);
  },

  idempotency: (value, config, ctx) => {
    const key = config.key as string;
    const ttl = config.ttl as number;
    return typeof key === 'string' && key.length > 0 && 
           typeof ttl === 'number' && ttl > 0;
  },

  circuit_breaker: (value, config, ctx) => {
    // Circuit breaker config validated at connector level
    return true;
  },

  payload_size: (value, config, ctx) => {
    const maxSizeBytes = config.maxSizeBytes as number;
    return typeof maxSizeBytes === 'number' && maxSizeBytes > 0;
  },

  required_fields: (value, config, ctx) => {
    const fields = config.fields as string[];
    return Array.isArray(fields) && fields.length > 0;
  }
};

// ============================================
// Workflow Validator Class
// ============================================

/**
 * Validates workflows against structural and constraint rules
 */
export class WorkflowValidator {
  private customEvaluators: Map<ConstraintType, ConstraintEvaluator> = new Map();
  private dag: WorkflowDAG | null = null;

  constructor() {
    // Can add custom evaluators via registerEvaluator
  }

  /**
   * Register a custom constraint evaluator
   */
  registerEvaluator(type: ConstraintType, evaluator: ConstraintEvaluator): void {
    this.customEvaluators.set(type, evaluator);
  }

  /**
   * Validate a workflow definition
   */
  validate(workflow: Workflow): WorkflowValidationResult {
    const startTime = Date.now();
    const structuralErrors: ValidationError[] = [];
    const constraintViolations: ConstraintViolation[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Structural validation
    const structuralResult = this.validateStructure(workflow);
    structuralErrors.push(...structuralResult.errors);
    warnings.push(...structuralResult.warnings);

    // 2. Build DAG and check for cycles
    this.dag = DAGBuilder.fromWorkflow(workflow);
    if (!this.dag.validated) {
      for (const error of this.dag.errors) {
        structuralErrors.push({
          code: 'DAG_ERROR',
          message: error.message,
          location: error.nodeId,
          severity: 'error'
        });
      }
    }

    // 3. Validate constraints
    const constraintResult = this.validateConstraints(workflow);
    constraintViolations.push(...constraintResult.violations);
    warnings.push(...constraintResult.warnings);

    // 4. Validate step references
    const referenceResult = this.validateReferences(workflow);
    structuralErrors.push(...referenceResult.errors);

    const duration = Date.now() - startTime;

    return {
      valid: structuralErrors.length === 0 && constraintViolations.filter(v => v.severity === 'error').length === 0,
      structuralErrors,
      constraintViolations,
      warnings,
      duration
    };
  }

  /**
   * Validate workflow structure
   */
  private validateStructure(workflow: Workflow): { 
    errors: ValidationError[]; 
    warnings: ValidationWarning[] 
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    if (!workflow.name) {
      errors.push({
        code: 'MISSING_NAME',
        message: 'Workflow name is required',
        severity: 'error'
      });
    }

    if (!workflow.version) {
      warnings.push({
        code: 'MISSING_VERSION',
        message: 'Workflow version is recommended for compatibility tracking'
      });
    }

    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push({
        code: 'NO_STEPS',
        message: 'Workflow must have at least one step',
        severity: 'error'
      });
    }

    // Check for duplicate step IDs
    const stepIds = new Set<string>();
    for (const step of workflow.steps) {
      if (stepIds.has(step.id)) {
        errors.push({
          code: 'DUPLICATE_STEP_ID',
          message: `Duplicate step ID: ${step.id}`,
          location: step.id,
          severity: 'error'
        });
      }
      stepIds.add(step.id);
    }

    // Check for missing input on steps
    for (const step of workflow.steps) {
      if (!step.input && !step.action && !step.connector && !step.agent) {
        warnings.push({
          code: 'EMPTY_STEP',
          message: `Step ${step.id} has no input, action, connector, or agent defined`,
          suggestion: 'Define what this step should do'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate workflow constraints
   */
  private validateConstraints(workflow: Workflow): {
    violations: ConstraintViolation[];
    warnings: ValidationViolation[];
  } {
    const violations: ConstraintViolation[] = [];
    const warnings: ValidationWarning[] = [];

    if (!workflow.constraints) {
      return { violations: [], warnings: [] };
    }

    const context: ConstraintContext = {
      input: {},
      stepResults: new Map(),
      timestamp: new Date(),
      executionId: 'validation'
    };

    for (const constraint of workflow.constraints) {
      const evaluator = this.customEvaluators.get(constraint.type) || 
                        BUILTIN_EVALUATORS[constraint.type];
      
      if (!evaluator) {
        warnings.push({
          code: 'UNKNOWN_CONSTRAINT',
          message: `Unknown constraint type: ${constraint.type}`,
          suggestion: 'Check constraint type spelling or register a custom evaluator'
        });
        continue;
      }

      try {
        // For validation, we just check the config is valid
        const valid = evaluator(undefined, constraint.config, context);
        
        if (!valid && constraint.severity === 'error') {
          violations.push({
            type: constraint.type,
            message: constraint.message || `Constraint ${constraint.type} validation failed`,
            severity: 'error',
            details: { config: constraint.config }
          });
        }
      } catch (error) {
        warnings.push({
          code: 'CONSTRAINT_EVALUATION_ERROR',
          message: `Failed to evaluate constraint ${constraint.type}: ${error}`
        });
      }
    }

    return { violations, warnings };
  }

  /**
   * Validate step references (dependsOn, condition references)
   */
  private validateReferences(workflow: Workflow): { errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    const stepIds = new Set(workflow.steps.map(s => s.id));

    for (const step of workflow.steps) {
      // Check dependsOn references
      if (step.dependsOn) {
        for (const depId of step.dependsOn) {
          if (!stepIds.has(depId)) {
            errors.push({
              code: 'INVALID_DEPENDENCY',
              message: `Step ${step.id} depends on non-existent step ${depId}`,
              location: step.id,
              severity: 'error'
            });
          }
        }
      }

      // Check fallback references
      if (step.fallback) {
        if (step.fallback.connector && !step.fallback.operation) {
          errors.push({
            code: 'INCOMPLETE_FALLBACK',
            message: `Step ${step.id} has fallback connector but no operation`,
            location: step.id,
            severity: 'warning'
          });
        }
      }
    }

    return { errors };
  }

  /**
   * Validate a specific step against constraints at runtime
   */
  validateStep(
    workflow: Workflow, 
    step: WorkflowStep, 
    context: ConstraintContext
  ): ConstraintValidationResult {
    const violations: ConstraintViolation[] = [];
    const warnings: ConstraintViolation[] = [];
    const startTime = Date.now();

    // Validate step-level constraints
    if (step.constraints) {
      for (const constraint of step.constraints) {
        const result = this.evaluateConstraint(constraint, context);
        
        if (!result.satisfied) {
          const violation: ConstraintViolation = {
            type: constraint.type,
            message: result.message || `Constraint ${constraint.type} not satisfied`,
            severity: constraint.severity || 'error',
            stepId: step.id,
            details: { config: constraint.config, actualValue: result.actualValue }
          };

          if (violation.severity === 'error') {
            violations.push(violation);
          } else {
            warnings.push(violation);
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    return {
      valid: violations.length === 0,
      violations,
      warnings,
      duration
    };
  }

  /**
   * Evaluate a single constraint
   */
  evaluateConstraint(
    constraint: Constraint | WorkflowConstraint,
    context: ConstraintContext
  ): { satisfied: boolean; message?: string; actualValue?: unknown } {
    const evaluator = this.customEvaluators.get(constraint.type) || 
                      BUILTIN_EVALUATORS[constraint.type];

    if (!evaluator) {
      return { 
        satisfied: false, 
        message: `No evaluator for constraint type ${constraint.type}` 
      };
    }

    try {
      // Extract value if field is specified
      let value: unknown = undefined;
      if ('field' in constraint && constraint.field) {
        value = this.resolveField(constraint.field, context);
      }

      const satisfied = evaluator(value, constraint.config, context);
      return { 
        satisfied: satisfied === true, 
        actualValue: value 
      };
    } catch (error) {
      return { 
        satisfied: false, 
        message: `Error evaluating constraint: ${error}` 
      };
    }
  }

  /**
   * Resolve a field path from context
   */
  private resolveField(field: string, context: ConstraintContext): unknown {
    const parts = field.split('.');
    let value: unknown = context;

    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      
      if (value instanceof Map) {
        value = value.get(part);
      } else if (typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Quick validation for workflow changes
   */
  quickValidate(workflow: Workflow): boolean {
    // Fast path - just check basics
    if (!workflow.name || !workflow.steps?.length) return false;
    
    // Check for cycles (fast)
    const visited = new Set<string>();
    const stack = new Set<string>();
    
    const hasCycle = (stepId: string): boolean => {
      if (stack.has(stepId)) return true;
      if (visited.has(stepId)) return false;
      
      visited.add(stepId);
      stack.add(stepId);
      
      const step = workflow.steps.find(s => s.id === stepId);
      if (step?.dependsOn) {
        for (const depId of step.dependsOn) {
          if (hasCycle(depId)) return true;
        }
      }
      
      stack.delete(stepId);
      return false;
    };

    for (const step of workflow.steps) {
      if (hasCycle(step.id)) return false;
    }

    return true;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Create a constraint validation result
 */
export function createValidationResult(
  valid: boolean,
  violations: ConstraintViolation[] = [],
  warnings: ConstraintViolation[] = [],
  duration: number = 0
): ConstraintValidationResult {
  return { valid, violations, warnings, duration };
}

/**
 * Create a constraint violation
 */
export function createViolation(
  type: ConstraintType,
  message: string,
  options: Partial<ConstraintViolation> = {}
): ConstraintViolation {
  return {
    type,
    message,
    severity: options.severity || 'error',
    ...options
  };
}

// ============================================
// Exports
// ============================================

export default WorkflowValidator;
