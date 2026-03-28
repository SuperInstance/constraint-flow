/**
 * Workflow Module - Main Entry Point
 * 
 * Exports all workflow components: DAG, validation, connectors, templates,
 * and exact arithmetic for business automation with exact guarantees.
 * 
 * @module workflow
 * @version 1.0.0
 */

// DAG-based workflow definition
export {
  DAGBuilder,
  ExecutionPlanner,
  DAGUtils,
  type DAGNode,
  type DAGEdge,
  type WorkflowDAG,
  type DAGValidationError,
  type ExecutionPlan,
  type ExecutionStage,
  type DAGOptions
} from './dag';

// Constraint-based validation
export {
  WorkflowValidator,
  createValidationResult,
  createViolation,
  type WorkflowValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ConstraintContext,
  type ConstraintEvaluator
} from './validation';

// External service connectors
export {
  ConnectorManager,
  connectorRegistry as ConnectorRegistry,
  CircuitBreaker,
  RateLimiter,
  BaseConnectorInstance,
  HttpConnectorInstance,
  type ConnectorRegistryEntry,
  type ConnectorFactory,
  type ConnectionStatus,
  type ConnectorState,
  type CircuitBreakerState,
  type CircuitBreakerConfig,
  type ConnectorManagerConfig
} from './connectors';

// Pre-built workflow templates
export {
  TemplateBuilder,
  templateRegistry,
  invoiceApprovalTemplate,
  incidentResponseTemplate,
  dataPipelineTemplate,
  contentReviewTemplate,
  type TemplateConfig,
  type TemplateCategory,
  type WorkflowTemplate,
  type ValidationResult as TemplateValidationResult,
  type InvoiceApprovalConfig,
  type IncidentResponseConfig,
  type DataPipelineConfig,
  type ContentReviewConfig
} from './templates';

// Exact arithmetic for financial calculations
export {
  ExactNumber,
  CT_ADD,
  CT_SUB,
  CT_MUL,
  CT_DIV,
  CT_SUM,
  CT_AVERAGE,
  CT_FINANCIAL_SUM,
  CT_ROUND_TO_CENTS,
  CT_ROUND,
  CT_ROUND_HALF_EVEN,
  hiddenDimensions,
  achievablePrecision,
  type Rational,
  type PrecisionMode,
  type RoundingMode,
  type ExactArithmeticConfig
} from './arithmetic';

// Re-export types
export type { 
  Workflow, 
  WorkflowStep, 
  WorkflowConstraint,
  WorkflowResult,
  StepResult,
  ConstraintStatus
} from '../types/workflow';

export type {
  Constraint,
  ConstraintType,
  ConstraintViolation,
  ConstraintValidationResult,
  ConstraintSeverity
} from '../types/constraints';

export type {
  Connector,
  ConnectorConfig,
  ConnectorInstance,
  OperationResult,
  OperationError,
  HealthCheckResult,
  ValidationResult,
  RetryConfig,
  RateLimitConfig
} from '../types/connectors';

// Default export
export default {
  // DAG
  DAGBuilder,
  ExecutionPlanner,
  DAGUtils,
  
  // Validation
  WorkflowValidator,
  
  // Connectors
  ConnectorManager,
  CircuitBreaker,
  RateLimiter,
  
  // Templates
  TemplateBuilder,
  templateRegistry,
  
  // Exact Arithmetic
  ExactNumber,
  CT_ADD,
  CT_SUB,
  CT_MUL,
  CT_DIV,
  CT_SUM,
  CT_AVERAGE,
  CT_FINANCIAL_SUM,
  CT_ROUND_TO_CENTS,
  CT_ROUND,
  CT_ROUND_HALF_EVEN
};
