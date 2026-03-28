# Workflow Schema Documentation

This document provides comprehensive schema definitions for Constraint Flow workflows, constraints, and connectors. All schemas are versioned and backward-compatible.

## Table of Contents

- [Workflow Schema](#workflow-schema)
- [Constraint Types Schema](#constraint-types-schema)
- [Connector Interface Schema](#connector-interface-schema)
- [Step Schema](#step-schema)
- [JSON Schema Definitions](#json-schema-definitions)

---

## Workflow Schema

### Workflow Definition

```typescript
interface Workflow<TInput = unknown> {
  /** Unique workflow identifier (kebab-case) */
  name: string;
  
  /** Schema version for compatibility checking */
  version: string;
  
  /** Human-readable description */
  description?: string;
  
  /** Workflow trigger configuration */
  trigger?: TriggerConfig;
  
  /** Input schema for validation */
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
```

### Trigger Configuration

```typescript
interface TriggerConfig {
  /** Trigger type */
  type: 'webhook' | 'schedule' | 'manual' | 'event' | 'connector';
  
  /** Webhook-specific configuration */
  path?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
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
```

### Workflow Metadata

```typescript
interface WorkflowMetadata {
  /** Author information */
  author?: string;
  
  /** Creation timestamp */
  createdAt?: string;
  
  /** Last update timestamp */
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
```

---

## Constraint Types Schema

### Core Constraint Interface

```typescript
interface Constraint {
  /** Constraint type identifier */
  type: ConstraintType;
  
  /** Human-readable description */
  description?: string;
  
  /** Constraint configuration */
  config: Record<string, unknown>;
  
  /** Severity level on violation */
  severity?: 'error' | 'warning' | 'info';
  
  /** Custom error message template */
  message?: string;
}
```

### Constraint Types Reference

| Type | Category | Config Schema | Description |
|------|----------|---------------|-------------|
| `amount_limit` | Value | `{ max: number, field?: string }` | Maximum value constraint |
| `amount_range` | Value | `{ min: number, max: number, field?: string }` | Min/max value bounds |
| `exact_precision` | Value | `{ precision: 'cents' | 'micros' | 'units' }` | Force exact arithmetic |
| `category_validation` | Value | `{ field: string, allowed: string[] }` | Validate against allowed values |
| `time_limit` | Temporal | `{ milliseconds: number }` | Maximum execution time |
| `business_hours` | Temporal | `{ timezone?: string, start?: string, end?: string }` | Only execute during business hours |
| `weekdays_only` | Temporal | `{ excludeHolidays?: boolean }` | No weekend execution |
| `sla` | Temporal | `SLAConfig` | Service level agreement enforcement |
| `approval_required` | Approval | `{ when?: Condition }` | Always need approval |
| `multi_approval` | Approval | `{ count: number, when?: Condition }` | Multiple approvers needed |
| `conditional_approval` | Approval | `ConditionalApprovalConfig` | Approval based on condition |
| `escalation_path` | Approval | `{ path: EscalationLevel[] }` | Escalation chain |
| `balanced_workload` | Geometric | `{ tolerance?: number }` | Distribute work evenly |
| `no_cycles` | Geometric | `{ strict?: boolean }` | Prevent circular dependencies |
| `min_parallelism` | Geometric | `{ n: number }` | Minimum parallel tasks |
| `max_latency` | Geometric | `{ ms: number }` | Maximum response time |
| `audit_trail` | Compliance | `{ required: boolean, retentionDays?: number }` | Immutable audit log |
| `hipaa_compliant` | Compliance | `{ required: boolean }` | HIPAA data handling |
| `data_locality` | Compliance | `{ region: string }` | Regional data storage |
| `compliance_check` | Compliance | `{ frameworks: string[] }` | Compliance framework check |
| `rate_limit` | System | `{ maxPerMinute: number }` | API rate limiting |
| `idempotency` | System | `{ key: string, ttl: number }` | Prevent duplicate execution |
| `circuit_breaker` | System | `CircuitBreakerConfig` | Circuit breaker pattern |

### SLA Configuration

```typescript
interface SLAConfig {
  /** Response time by priority (minutes) */
  responseTime?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  
  /** Resolution time by priority (minutes) */
  resolutionTime?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  
  /** Actions on SLA breach */
  onBreach?: {
    notify?: string[];
    escalate?: boolean;
    createIncident?: boolean;
  };
}
```

### Conditional Approval Configuration

```typescript
interface ConditionalApprovalConfig {
  /** Condition that triggers approval requirement */
  if: Condition;
  
  /** Approval requirements when condition is met */
  then: {
    approvals: number;
    escalateAfter?: string;
  };
  
  /** Fallback approval requirements */
  else?: {
    approvals: number;
  };
}
```

---

## Connector Interface Schema

### Connector Definition

```typescript
interface Connector<TConfig extends ConnectorConfig = ConnectorConfig> {
  // ============================================
  // Metadata
  // ============================================
  
  /** Connector identifier (kebab-case) */
  name: string;
  
  /** Semantic version */
  version: string;
  
  /** Human-readable description */
  description: string;
  
  // ============================================
  // Configuration
  // ============================================
  
  /** Authentication configuration */
  auth: AuthConfig;
  
  /** Rate limiting configuration */
  rateLimits?: RateLimitConfig;
  
  /** Retry configuration */
  retry?: RetryConfig;
  
  // ============================================
  // Operations
  // ============================================
  
  /** Available operations */
  operations: Record<string, OperationDefinition>;
  
  // ============================================
  // Events
  // ============================================
  
  /** Webhook events this connector can receive */
  events?: Record<string, EventDefinition>;
  
  // ============================================
  // Constraints
  // ============================================
  
  /** Constraints enforced by this connector */
  constraints?: ConnectorConstraint[];
  
  // ============================================
  // Helpers
  // ============================================
  
  /** Helper methods for working with the connector */
  helpers?: Record<string, HelperFunction>;
}
```

### Connector Configuration

```typescript
interface ConnectorConfig {
  /** Base URL for API calls */
  baseUrl?: string;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Default headers to include in all requests */
  defaultHeaders?: Record<string, string>;
  
  /** Custom configuration options */
  [key: string]: unknown;
}
```

### Authentication Configuration

```typescript
type AuthConfig = 
  | APIKeyAuth
  | OAuth2Auth
  | BasicAuth
  | CustomAuth;

interface APIKeyAuth {
  type: 'api-key';
  headerName: string;
  description?: string;
  docs?: string;
}

interface OAuth2Auth {
  type: 'oauth2';
  grantType: 'authorization_code' | 'client_credentials' | 'refresh_token';
  scopes: string[];
  tokenUrl: string;
  authorizeUrl?: string;
  refreshUrl?: string;
  docs?: string;
}

interface BasicAuth {
  type: 'basic';
  description?: string;
}

interface CustomAuth {
  type: 'custom';
  handler: string; // Function reference
  description?: string;
}
```

### Rate Limit Configuration

```typescript
interface RateLimitConfig {
  /** Rate limit tier */
  tier?: string;
  
  /** Maximum requests per minute */
  requestsPerMinute: number;
  
  /** Maximum concurrent requests */
  concurrentRequests?: number;
  
  /** Burst limit for short spikes */
  burstLimit?: number;
  
  /** Custom rate limit rules by operation */
  byOperation?: Record<string, {
    requestsPerMinute?: number;
    concurrentRequests?: number;
  }>;
}
```

### Retry Configuration

```typescript
interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  
  /** Backoff strategy */
  backoff: 'fixed' | 'linear' | 'exponential';
  
  /** Base delay in milliseconds */
  baseDelayMs: number;
  
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
  
  /** HTTP status codes to retry on */
  retryOn: number[];
  
  /** HTTP status codes to skip retry */
  skipOn?: number[];
}
```

### Operation Definition

```typescript
interface OperationDefinition {
  /** Operation name */
  name: string;
  
  /** Human-readable description */
  description: string;
  
  /** Input schema (JSON Schema) */
  input: JSONSchema;
  
  /** Output schema (JSON Schema) */
  output: JSONSchema;
  
  /** Usage examples */
  examples?: OperationExample[];
  
  /** Whether operation is deprecated */
  deprecated?: boolean;
  
  /** Deprecation message */
  deprecationMessage?: string;
  
  /** Alternative operation if deprecated */
  alternativeOperation?: string;
}
```

### Event Definition

```typescript
interface EventDefinition {
  /** Event name */
  name: string;
  
  /** Human-readable description */
  description: string;
  
  /** Event payload schema */
  schema: JSONSchema;
  
  /** Whether event requires authentication */
  requiresAuthentication?: boolean;
  
  /** Event filtering options */
  filters?: Record<string, JSONSchema>;
}
```

---

## Step Schema

### Workflow Step Definition

```typescript
interface WorkflowStep {
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
  
  /** Operation to execute */
  operation?: string;
  
  /** Agent to use for this step */
  agent?: string;
  
  /** Action to perform (built-in or custom) */
  action?: string;
  
  /** Input parameters (supports expressions) */
  input: Record<string, unknown>;
  
  /** Output variable mappings */
  output?: Record<string, string>;
  
  // ============================================
  // Control Flow
  // ============================================
  
  /** Condition for step execution */
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
  
  /** Wait configuration */
  waitFor?: WaitForConfig;
  
  /** Fan-out configuration */
  step?: WorkflowStep; // For fan-out
  
  /** Aggregation configuration */
  aggregate?: Record<string, string>;
  
  // ============================================
  // Constraints & Compensation
  // ============================================
  
  /** Step-level constraints */
  constraints?: Constraint[];
  
  /** Compensation action for rollback */
  compensation?: CompensationAction;
  
  /** Whether step is optional */
  optional?: boolean;
  
  /** Delay before execution */
  delay?: number;
}
```

### Wait Configuration

```typescript
interface WaitForConfig {
  /** Event type to wait for */
  event: string;
  
  /** Correlation key for event matching */
  correlationKey: string;
  
  /** Timeout in milliseconds */
  timeout: number;
  
  /** Reminder notifications */
  reminders?: Array<{
    delay: number;
    connector: string;
    operation: string;
    input: Record<string, unknown>;
  }>;
  
  /** Escalation configuration */
  escalation?: {
    delay: number;
    connector: string;
    operation: string;
    input: Record<string, unknown>;
  };
  
  /** Periodic updates while waiting */
  periodicUpdate?: {
    interval: number;
    action: {
      connector: string;
      operation: string;
      input: Record<string, unknown>;
    };
  };
}
```

### Circuit Breaker Configuration

```typescript
interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  
  /** Time to wait before attempting reset (ms) */
  resetTimeout: number;
  
  /** Fallback action when circuit is open */
  fallback: {
    connector: string;
    operation: string;
    input: Record<string, unknown>;
  };
  
  /** State change handlers */
  onStateChange?: {
    open?: { notify?: string[]; log?: boolean };
    close?: { notify?: string[]; log?: boolean };
  };
}
```

---

## JSON Schema Definitions

### Complete Workflow JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://constraint-flow.ai/schemas/workflow.json",
  "title": "Workflow Definition",
  "description": "Constraint Flow workflow definition schema",
  "type": "object",
  "required": ["name", "version", "steps"],
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "Unique workflow identifier"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+(-[a-z0-9]+)?$",
      "description": "Semantic version"
    },
    "description": {
      "type": "string",
      "maxLength": 1000,
      "description": "Human-readable description"
    },
    "trigger": {
      "$ref": "#/definitions/trigger"
    },
    "input": {
      "$ref": "https://json-schema.org/draft/2020-12/schema"
    },
    "output": {
      "$ref": "https://json-schema.org/draft/2020-12/schema"
    },
    "steps": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/definitions/step"
      }
    },
    "constraints": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/constraint"
      }
    },
    "errorHandling": {
      "$ref": "#/definitions/errorHandling"
    },
    "compensation": {
      "type": "object",
      "additionalProperties": {
        "$ref": "#/definitions/compensationAction"
      }
    },
    "events": {
      "$ref": "#/definitions/workflowEvents"
    },
    "metadata": {
      "$ref": "#/definitions/metadata"
    }
  },
  "definitions": {
    "trigger": {
      "type": "object",
      "required": ["type"],
      "properties": {
        "type": {
          "type": "string",
          "enum": ["webhook", "schedule", "manual", "event", "connector"]
        },
        "path": { "type": "string" },
        "method": {
          "type": "string",
          "enum": ["GET", "POST", "PUT", "DELETE"]
        },
        "authentication": {
          "type": "string",
          "enum": ["required", "optional", "none"]
        },
        "cron": { "type": "string" },
        "timezone": { "type": "string" },
        "connector": { "type": "string" },
        "event": { "type": "string" },
        "filter": { "type": "object" },
        "deduplication": {
          "type": "object",
          "required": ["key", "ttlMinutes"],
          "properties": {
            "key": { "type": "string" },
            "ttlMinutes": { "type": "number", "minimum": 1 }
          }
        }
      }
    },
    "step": {
      "type": "object",
      "required": ["id", "input"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$"
        },
        "name": { "type": "string" },
        "description": { "type": "string" },
        "connector": { "type": "string" },
        "operation": { "type": "string" },
        "agent": { "type": "string" },
        "action": { "type": "string" },
        "input": { "type": "object" },
        "output": { "type": "object" },
        "condition": { "type": "string" },
        "dependsOn": {
          "type": "array",
          "items": { "type": "string" }
        },
        "timeout": { "type": "number", "minimum": 0 },
        "retry": { "$ref": "#/definitions/retry" },
        "fallback": { "$ref": "#/definitions/fallback" },
        "circuitBreaker": { "$ref": "#/definitions/circuitBreaker" },
        "waitFor": { "$ref": "#/definitions/waitFor" },
        "constraints": {
          "type": "array",
          "items": { "$ref": "#/definitions/constraint" }
        },
        "compensation": { "$ref": "#/definitions/compensationAction" },
        "optional": { "type": "boolean" },
        "delay": { "type": "number", "minimum": 0 }
      }
    },
    "constraint": {
      "type": "object",
      "required": ["type"],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "amount_limit", "amount_range", "exact_precision", "category_validation",
            "time_limit", "business_hours", "weekdays_only", "sla",
            "approval_required", "multi_approval", "conditional_approval", "escalation_path",
            "balanced_workload", "no_cycles", "min_parallelism", "max_latency",
            "audit_trail", "hipaa_compliant", "data_locality", "compliance_check",
            "rate_limit", "idempotency", "circuit_breaker"
          ]
        },
        "description": { "type": "string" },
        "config": { "type": "object" },
        "severity": {
          "type": "string",
          "enum": ["error", "warning", "info"],
          "default": "error"
        },
        "message": { "type": "string" }
      }
    },
    "retry": {
      "type": "object",
      "required": ["maxAttempts", "backoff", "baseDelayMs"],
      "properties": {
        "maxAttempts": { "type": "integer", "minimum": 1, "maximum": 10 },
        "backoff": {
          "type": "string",
          "enum": ["fixed", "linear", "exponential"]
        },
        "baseDelayMs": { "type": "number", "minimum": 0 },
        "maxDelayMs": { "type": "number", "minimum": 0 },
        "retryOn": {
          "type": "array",
          "items": { "type": "integer" }
        },
        "skipOn": {
          "type": "array",
          "items": { "type": "integer" }
        }
      }
    },
    "errorHandling": {
      "type": "object",
      "properties": {
        "strategy": {
          "type": "string",
          "enum": ["compensate", "continue", "abort"],
          "default": "abort"
        },
        "onError": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["error", "steps"],
            "properties": {
              "error": { "type": "string" },
              "steps": {
                "type": "array",
                "items": { "type": "string" }
              },
              "retry": { "type": "boolean" }
            }
          }
        },
        "defaultRetry": { "$ref": "#/definitions/retry" },
        "onTimeout": {
          "type": "object",
          "properties": {
            "steps": {
              "type": "array",
              "items": { "type": "string" }
            },
            "notify": {
              "type": "array",
              "items": { "type": "string" }
            }
          }
        }
      }
    },
    "compensationAction": {
      "type": "object",
      "required": ["connector", "operation", "input"],
      "properties": {
        "connector": { "type": "string" },
        "operation": { "type": "string" },
        "input": { "type": "object" },
        "condition": { "type": "string" }
      }
    },
    "fallback": {
      "type": "object",
      "required": ["connector", "operation", "input"],
      "properties": {
        "condition": { "type": "string" },
        "connector": { "type": "string" },
        "operation": { "type": "string" },
        "input": { "type": "object" }
      }
    },
    "circuitBreaker": {
      "type": "object",
      "required": ["failureThreshold", "resetTimeout", "fallback"],
      "properties": {
        "failureThreshold": { "type": "integer", "minimum": 1 },
        "resetTimeout": { "type": "number", "minimum": 0 },
        "fallback": { "$ref": "#/definitions/fallback" },
        "onStateChange": {
          "type": "object",
          "properties": {
            "open": {
              "type": "object",
              "properties": {
                "notify": {
                  "type": "array",
                  "items": { "type": "string" }
                },
                "log": { "type": "boolean" }
              }
            },
            "close": {
              "type": "object",
              "properties": {
                "notify": {
                  "type": "array",
                  "items": { "type": "string" }
                },
                "log": { "type": "boolean" }
              }
            }
          }
        }
      }
    },
    "waitFor": {
      "type": "object",
      "required": ["event", "correlationKey", "timeout"],
      "properties": {
        "event": { "type": "string" },
        "correlationKey": { "type": "string" },
        "timeout": { "type": "number", "minimum": 0 },
        "reminders": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "delay": { "type": "number" },
              "connector": { "type": "string" },
              "operation": { "type": "string" },
              "input": { "type": "object" }
            }
          }
        },
        "escalation": {
          "type": "object",
          "properties": {
            "delay": { "type": "number" },
            "connector": { "type": "string" },
            "operation": { "type": "string" },
            "input": { "type": "object" }
          }
        },
        "periodicUpdate": {
          "type": "object",
          "properties": {
            "interval": { "type": "number" },
            "action": {
              "type": "object",
              "properties": {
                "connector": { "type": "string" },
                "operation": { "type": "string" },
                "input": { "type": "object" }
              }
            }
          }
        }
      }
    },
    "workflowEvents": {
      "type": "object",
      "properties": {
        "onStarted": {
          "type": "object",
          "properties": {
            "action": { "type": "string", "enum": ["emit"] },
            "event": { "type": "string" },
            "payload": { "type": "object" }
          }
        },
        "onCompleted": {
          "type": "object",
          "properties": {
            "action": { "type": "string", "enum": ["emit"] },
            "event": { "type": "string" },
            "payload": { "type": "object" }
          }
        },
        "onError": {
          "type": "object",
          "properties": {
            "action": { "type": "string", "enum": ["emit"] },
            "event": { "type": "string" },
            "payload": { "type": "object" }
          }
        },
        "onStepComplete": {
          "type": "object",
          "properties": {
            "action": { "type": "string", "enum": ["emit"] },
            "event": { "type": "string" },
            "payload": { "type": "object" }
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "author": { "type": "string" },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" },
        "tags": {
          "type": "array",
          "items": { "type": "string" }
        },
        "owner": { "type": "string" },
        "docsUrl": { "type": "string", "format": "uri" },
        "custom": { "type": "object" }
      }
    }
  }
}
```

---

## Schema Validation

### Using JSON Schema for Validation

```typescript
import Ajv from 'ajv';
import workflowSchema from './schemas/workflow.json';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(workflowSchema);

function validateWorkflow(workflow: unknown): ValidationResult {
  const valid = validate(workflow);
  
  if (!valid) {
    return {
      valid: false,
      errors: validate.errors?.map(err => ({
        path: err.instancePath,
        message: err.message,
        params: err.params
      })) || []
    };
  }
  
  return { valid: true, errors: [] };
}
```

### TypeScript Type Guards

```typescript
function isWorkflow(value: unknown): value is Workflow {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    'version' in value &&
    typeof value.version === 'string' &&
    'steps' in value &&
    Array.isArray(value.steps)
  );
}

function isConstraint(value: unknown): value is Constraint {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof value.type === 'string'
  );
}
```

---

## Version Compatibility

| Schema Version | Constraint Flow | Breaking Changes |
|----------------|-----------------|------------------|
| 1.0.0 | 0.1.x - 0.2.x | Initial schema |
| 1.1.0 | 0.3.x+ | Added circuit breaker, waitFor patterns |

---

## Need Help?

- [Workflow Patterns Guide](./WORKFLOW_PATTERNS.md)
- [Connector Development Guide](./CONNECTORS.md)
- [JSON Schema Specification](https://json-schema.org/)
- [GitHub Discussions](https://github.com/SuperInstance/constraint-flow/discussions)
