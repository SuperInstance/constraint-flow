/**
 * Connector Type Definitions
 * 
 * Types for defining connectors that integrate Constraint Flow with
 * external systems like Slack, Jira, GitHub, databases, and APIs.
 * 
 * @module types/connectors
 */

// ============================================
// Connector Definition
// ============================================

/**
 * Main connector interface
 * @template TConfig - Configuration type for the connector
 */
export interface Connector<TConfig extends ConnectorConfig = ConnectorConfig> {
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

// ============================================
// Connector Configuration
// ============================================

export interface ConnectorConfig {
  /** Base URL for API calls */
  baseUrl?: string;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Default headers to include in all requests */
  defaultHeaders?: Record<string, string>;
  
  /** Custom configuration options */
  [key: string]: unknown;
}

// ============================================
// Authentication Types
// ============================================

export type AuthType = 'api-key' | 'oauth2' | 'basic' | 'custom' | 'bearer';

export type AuthConfig =
  | APIKeyAuth
  | OAuth2Auth
  | BasicAuth
  | BearerAuth
  | CustomAuth;

export interface APIKeyAuth {
  type: 'api-key';
  
  /** Header name for the API key */
  headerName: string;
  
  /** Description of how to obtain the API key */
  description?: string;
  
  /** Documentation URL */
  docs?: string;
  
  /** Header template (e.g., 'Bearer ${apiKey}') */
  headerTemplate?: string;
}

export interface OAuth2Auth {
  type: 'oauth2';
  
  /** OAuth2 grant type */
  grantType: 'authorization_code' | 'client_credentials' | 'refresh_token' | 'password';
  
  /** Required OAuth scopes */
  scopes: string[];
  
  /** Token endpoint URL */
  tokenUrl: string;
  
  /** Authorization endpoint URL */
  authorizeUrl?: string;
  
  /** Refresh token endpoint URL */
  refreshUrl?: string;
  
  /** Documentation URL */
  docs?: string;
  
  /** PKCE configuration */
  pkce?: {
    enabled: boolean;
    challengeMethod?: 'S256' | 'plain';
  };
}

export interface BasicAuth {
  type: 'basic';
  
  /** Description */
  description?: string;
  
  /** Documentation URL */
  docs?: string;
}

export interface BearerAuth {
  type: 'bearer';
  
  /** Description */
  description?: string;
  
  /** Documentation URL */
  docs?: string;
  
  /** Header prefix (default: 'Bearer') */
  prefix?: string;
}

export interface CustomAuth {
  type: 'custom';
  
  /** Handler function reference */
  handler: string;
  
  /** Description */
  description?: string;
  
  /** Documentation URL */
  docs?: string;
}

// ============================================
// Rate Limiting
// ============================================

export interface RateLimitConfig {
  /** Rate limit tier name */
  tier?: string;
  
  /** Maximum requests per minute */
  requestsPerMinute: number;
  
  /** Maximum concurrent requests */
  concurrentRequests?: number;
  
  /** Burst limit for short spikes */
  burstLimit?: number;
  
  /** Rate limits by operation */
  byOperation?: Record<string, OperationRateLimit>;
}

export interface OperationRateLimit {
  /** Maximum requests per minute for this operation */
  requestsPerMinute?: number;
  
  /** Maximum concurrent requests for this operation */
  concurrentRequests?: number;
}

// ============================================
// Retry Configuration
// ============================================

export type BackoffStrategy = 'fixed' | 'linear' | 'exponential';

export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  
  /** Backoff strategy */
  backoff: BackoffStrategy;
  
  /** Base delay in milliseconds */
  baseDelayMs: number;
  
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
  
  /** HTTP status codes to retry on */
  retryOn: number[];
  
  /** HTTP status codes to skip retry */
  skipOn?: number[];
  
  /** Error codes to retry on */
  retryOnErrors?: string[];
}

// ============================================
// Operation Definition
// ============================================

export interface OperationDefinition {
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
  
  /** Sunset date for deprecated operations */
  sunsetDate?: string;
}

export interface OperationExample {
  /** Example name */
  name: string;
  
  /** Example description */
  description?: string;
  
  /** Input parameters */
  input: Record<string, unknown>;
  
  /** Expected output */
  output?: unknown;
}

// ============================================
// JSON Schema (Simplified)
// ============================================

export interface JSONSchema {
  $schema?: string;
  $ref?: string;
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
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
// Event Definition
// ============================================

export interface EventDefinition {
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

// ============================================
// Connector Constraint
// ============================================

export interface ConnectorConstraint {
  /** Constraint type */
  type: string;
  
  /** Human-readable description */
  description: string;
  
  /** Constraint configuration */
  config: Record<string, unknown>;
}

// ============================================
// Helper Function
// ============================================

export type HelperFunction = (...args: unknown[]) => unknown;

// ============================================
// Operation Result
// ============================================

export interface OperationResult<T = unknown> {
  /** Whether operation succeeded */
  success: boolean;
  
  /** Operation result data */
  data?: T;
  
  /** Error if operation failed */
  error?: OperationError;
  
  /** Constraint validation results */
  constraints?: {
    satisfied: boolean;
    details: ConnectorConstraint[];
  };
  
  /** Operation metadata */
  metadata?: {
    /** Duration in milliseconds */
    duration: number;
    
    /** Number of retry attempts */
    attempts: number;
    
    /** Rate limit remaining */
    rateLimitRemaining?: number;
    
    /** Rate limit reset time */
    rateLimitResetAt?: string;
  };
}

export interface OperationError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** HTTP status code (if applicable) */
  statusCode?: number;
  
  /** Error details */
  details?: Record<string, unknown>;
  
  /** Original error */
  cause?: unknown;
}

// ============================================
// Compensation Action
// ============================================

export interface CompensationAction {
  /** Connector to use for compensation */
  connector: string;
  
  /** Operation to execute */
  operation: string;
  
  /** Input parameters */
  input: Record<string, unknown>;
  
  /** Condition for compensation execution */
  condition?: string;
}

// ============================================
// Connector Instance
// ============================================

export interface ConnectorInstance<TConfig extends ConnectorConfig = ConnectorConfig> {
  /** Connector definition */
  readonly definition: Connector<TConfig>;
  
  /** Initialize the connector */
  initialize(): Promise<void>;
  
  /** Execute an operation */
  execute<T = unknown>(
    operation: string,
    input: Record<string, unknown>
  ): Promise<OperationResult<T>>;
  
  /** Validate input against operation schema */
  validateInput(
    operation: string,
    input: Record<string, unknown>
  ): ValidationResult;
  
  /** Validate output against operation schema */
  validateOutput(
    operation: string,
    output: unknown
  ): ValidationResult;
  
  /** Health check */
  healthCheck(): Promise<HealthCheckResult>;
  
  /** Close the connector */
  close(): Promise<void>;
}

export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}

export interface HealthCheckResult {
  healthy: boolean;
  latency?: number;
  message?: string;
  details?: Record<string, unknown>;
}
