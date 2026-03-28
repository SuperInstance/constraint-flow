/**
 * Constraint Type Definitions
 * 
 * Types for defining constraints that enforce business rules, SLAs,
 * and compliance requirements in workflows.
 * 
 * @module types/constraints
 */

// ============================================
// Constraint Types Enum
// ============================================

export type ConstraintType =
  // Value Constraints
  | 'amount_limit'
  | 'amount_range'
  | 'exact_precision'
  | 'category_validation'
  | 'time_window'
  
  // Temporal Constraints
  | 'time_limit'
  | 'business_hours'
  | 'weekdays_only'
  | 'sla'
  
  // Approval Constraints
  | 'approval_required'
  | 'multi_approval'
  | 'conditional_approval'
  | 'escalation_path'
  
  // Geometric Constraints
  | 'balanced_workload'
  | 'no_cycles'
  | 'min_parallelism'
  | 'max_latency'
  
  // Compliance Constraints
  | 'audit_trail'
  | 'hipaa_compliant'
  | 'data_locality'
  | 'compliance_check'
  
  // System Constraints
  | 'rate_limit'
  | 'idempotency'
  | 'circuit_breaker'
  | 'payload_size'
  | 'required_fields';

// ============================================
// Constraint Severity
// ============================================

export type ConstraintSeverity = 'error' | 'warning' | 'info';

// ============================================
// Base Constraint Interface
// ============================================

export interface Constraint {
  /** Constraint type identifier */
  type: ConstraintType;
  
  /** Human-readable description */
  description?: string;
  
  /** Constraint configuration */
  config: Record<string, unknown>;
  
  /** Severity level on violation */
  severity?: ConstraintSeverity;
  
  /** Custom error message template */
  message?: string;
}

export interface WorkflowConstraint extends Constraint {
  /** Field to apply constraint to (expression) */
  field?: string;
  
  /** Condition for constraint activation */
  when?: Condition;
}

// ============================================
// Condition Types
// ============================================

export interface Condition {
  [key: string]: unknown;
}

export type ComparisonOperator = 
  | '==' 
  | '!=' 
  | '>' 
  | '>=' 
  | '<' 
  | '<='
  | 'in'
  | 'not_in'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'matches';

export interface FieldCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

// ============================================
// Value Constraint Configs
// ============================================

export interface AmountLimitConfig {
  /** Maximum allowed value */
  max: number;
  
  /** Field to check (defaults to input) */
  field?: string;
  
  /** Whether to enforce exact precision */
  exactPrecision?: boolean;
}

export interface AmountRangeConfig {
  /** Minimum allowed value */
  min: number;
  
  /** Maximum allowed value */
  max: number;
  
  /** Field to check */
  field?: string;
  
  /** Whether to enforce exact precision */
  exactPrecision?: boolean;
}

export type PrecisionMode = 'cents' | 'micros' | 'units' | 'milliseconds';

export interface ExactPrecisionConfig {
  /** Precision mode */
  precision: PrecisionMode;
  
  /** Fields to apply precision to */
  fields?: string[];
  
  /** Rounding mode */
  rounding?: 'half_up' | 'half_even' | 'up' | 'down';
}

export interface CategoryValidationConfig {
  /** Field to validate */
  field: string;
  
  /** Allowed values */
  allowed: string[];
  
  /** Whether match is case-sensitive */
  caseSensitive?: boolean;
}

export interface TimeWindowConfig {
  /** Field containing the timestamp */
  field: string;
  
  /** Maximum age in days */
  maxAge?: number;
  
  /** Minimum age in days */
  minAge?: number;
  
  /** Whether to include future dates */
  allowFuture?: boolean;
}

// ============================================
// Temporal Constraint Configs
// ============================================

export interface TimeLimitConfig {
  /** Maximum duration in milliseconds */
  milliseconds: number;
  
  /** Action on timeout */
  onTimeout?: 'abort' | 'continue' | 'escalate';
}

export interface BusinessHoursConfig {
  /** Timezone for business hours */
  timezone?: string;
  
  /** Start time (HH:MM format) */
  start?: string;
  
  /** End time (HH:MM format) */
  end?: string;
  
  /** Days of week (0=Sunday, 6=Saturday) */
  days?: number[];
  
  /** Holiday calendar reference */
  holidays?: string;
}

export interface WeekdaysOnlyConfig {
  /** Whether to exclude holidays */
  excludeHolidays?: boolean;
  
  /** Holiday calendar reference */
  holidayCalendar?: string;
}

export interface SLAConfig {
  /** Response time by priority (minutes) */
  responseTime?: SLATierConfig;
  
  /** Resolution time by priority (minutes) */
  resolutionTime?: SLATierConfig;
  
  /** Actions on SLA breach */
  onBreach?: SLABreachConfig;
}

export interface SLATierConfig {
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
}

export interface SLABreachConfig {
  /** Channels/users to notify */
  notify?: string[];
  
  /** Whether to escalate automatically */
  escalate?: boolean;
  
  /** Whether to create an incident */
  createIncident?: boolean;
  
  /** Custom action on breach */
  action?: {
    connector: string;
    operation: string;
    input: Record<string, unknown>;
  };
}

// ============================================
// Approval Constraint Configs
// ============================================

export interface ApprovalRequiredConfig {
  /** Condition for approval requirement */
  when?: Condition;
  
  /** Required approver roles */
  roles?: string[];
  
  /** Required approver users */
  users?: string[];
}

export interface MultiApprovalConfig {
  /** Number of approvals required */
  count: number;
  
  /** Condition for multi-approval requirement */
  when?: Condition;
  
  /** Whether approvers must be distinct */
  distinctApprovers?: boolean;
  
  /** Escalation after delay */
  escalateAfter?: string;
}

export interface ConditionalApprovalConfig {
  /** Condition that triggers approval requirement */
  if: Condition;
  
  /** Approval requirements when condition is met */
  then: {
    approvals: number;
    roles?: string[];
    escalateAfter?: string;
  };
  
  /** Fallback approval requirements */
  else?: {
    approvals: number;
    roles?: string[];
  };
}

export interface EscalationPathConfig {
  /** Escalation levels */
  path: EscalationLevel[];
  
  /** Field to use for escalation delay */
  delayField?: string;
}

export interface EscalationLevel {
  /** Delay before this escalation level (minutes) */
  delay: number;
  
  /** Action to take */
  action: 'notify' | 'page' | 'assign';
  
  /** Role or user to escalate to */
  role?: string;
  
  /** Specific user to escalate to */
  user?: string;
  
  /** Channel to notify */
  channel?: string;
}

// ============================================
// Geometric Constraint Configs
// ============================================

export interface BalancedWorkloadConfig {
  /** Tolerance for imbalance (0-1) */
  tolerance?: number;
  
  /** Agents to balance */
  agents?: string[];
  
  /** Metric to balance on */
  metric?: 'count' | 'duration' | 'cost';
}

export interface NoCyclesConfig {
  /** Whether to strictly enforce no cycles */
  strict?: boolean;
  
  /** Maximum path length to check */
  maxDepth?: number;
}

export interface MinParallelismConfig {
  /** Minimum number of parallel tasks */
  n: number;
  
  /** Maximum parallelism (optional cap) */
  max?: number;
}

export interface MaxLatencyConfig {
  /** Maximum latency in milliseconds */
  ms: number;
  
  /** Percentile to measure (e.g., p95, p99) */
  percentile?: number;
}

// ============================================
// Compliance Constraint Configs
// ============================================

export interface AuditTrailConfig {
  /** Whether audit trail is required */
  required: boolean;
  
  /** Retention period in days */
  retentionDays?: number;
  
  /** Fields to include in audit */
  fields?: string[];
  
  /** Whether audit log must be immutable */
  immutable?: boolean;
  
  /** Encryption requirements */
  encryption?: 'at_rest' | 'in_transit' | 'both';
}

export interface HIPAACompliantConfig {
  /** Whether HIPAA compliance is required */
  required: boolean;
  
  /** PHI fields to protect */
  phiFields?: string[];
  
  /** Minimum necessary principle */
  minimumNecessary?: boolean;
  
  /** Audit access to PHI */
  auditAccess?: boolean;
}

export interface DataLocalityConfig {
  /** Required region for data storage */
  region: string;
  
  /** Allowed regions for replication */
  allowedRegions?: string[];
  
  /** Whether data can leave region */
  allowCrossRegion?: boolean;
}

export interface ComplianceCheckConfig {
  /** Compliance frameworks to check */
  frameworks: string[];
  
  /** Strictness level */
  strictness?: 'strict' | 'moderate' | 'lenient';
  
  /** Custom compliance rules */
  customRules?: string[];
}

// ============================================
// System Constraint Configs
// ============================================

export interface RateLimitConfig {
  /** Maximum requests per minute */
  maxPerMinute?: number;
  
  /** Maximum requests per second */
  maxPerSecond?: number;
  
  /** Burst limit */
  burstLimit?: number;
  
  /** Rate limit by operation */
  byOperation?: Record<string, {
    maxPerMinute?: number;
    maxPerSecond?: number;
  }>;
}

export interface IdempotencyConfig {
  /** Idempotency key expression */
  key: string;
  
  /** Time-to-live in seconds */
  ttl: number;
  
  /** Behavior on duplicate */
  onDuplicate?: 'reject' | 'return_existing' | 'ignore';
}

export interface PayloadSizeConfig {
  /** Maximum payload size in bytes */
  maxSizeBytes: number;
  
  /** Error message on violation */
  errorMessage?: string;
}

export interface RequiredFieldsConfig {
  /** Required field names */
  fields: string[];
  
  /** Whether to validate nested fields */
  validateNested?: boolean;
}

// ============================================
// Constraint Violation
// ============================================

export interface ConstraintViolation {
  /** Constraint type that was violated */
  type: ConstraintType;
  
  /** Human-readable violation message */
  message: string;
  
  /** Field that caused the violation */
  field?: string;
  
  /** Actual value that violated the constraint */
  actualValue?: unknown;
  
  /** Expected value or range */
  expectedValue?: unknown;
  
  /** Severity of the violation */
  severity: ConstraintSeverity;
  
  /** Step where violation occurred */
  stepId?: string;
  
  /** Additional details */
  details?: Record<string, unknown>;
}

// ============================================
// Constraint Validation Result
// ============================================

export interface ConstraintValidationResult {
  /** Whether all constraints are satisfied */
  valid: boolean;
  
  /** List of violations (empty if valid) */
  violations: ConstraintViolation[];
  
  /** Warnings (non-blocking violations) */
  warnings: ConstraintViolation[];
  
  /** Constraint check duration (ms) */
  duration: number;
}
