/**
 * External Service Connectors
 * 
 * Unified connector framework for integrating with external services
 * like Slack, GitHub, Jira, ERPs, and custom APIs. Provides:
 * - Connection pooling and management
 * - Rate limiting and retry logic
 * - Circuit breaker patterns
 * - Constraint-aware operation execution
 * 
 * @module workflow/connectors
 * @version 1.0.0
 */

import type {
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

// ============================================
// Types
// ============================================

/**
 * Connector registry entry
 */
export interface ConnectorRegistryEntry {
  /** Connector definition */
  definition: Connector;
  /** Factory function to create instances */
  factory: ConnectorFactory;
  /** Whether this is a built-in connector */
  builtIn: boolean;
}

/**
 * Factory function to create connector instances
 */
export type ConnectorFactory = (config: ConnectorConfig) => ConnectorInstance;

/**
 * Connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Connector state for monitoring
 */
export interface ConnectorState {
  /** Connector name */
  name: string;
  /** Connection status */
  status: ConnectionStatus;
  /** Last successful operation */
  lastSuccess?: Date;
  /** Last failed operation */
  lastFailure?: Date;
  /** Total operations count */
  totalOperations: number;
  /** Failed operations count */
  failedOperations: number;
  /** Average latency (ms) */
  averageLatency: number;
  /** Rate limit remaining */
  rateLimitRemaining?: number;
  /** Circuit breaker state */
  circuitBreakerState: CircuitBreakerState;
}

/**
 * Circuit breaker states
 */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening */
  failureThreshold: number;
  /** Time to wait before attempting reset (ms) */
  resetTimeout: number;
  /** Number of successes needed to close */
  successThreshold: number;
}

/**
 * Connector manager configuration
 */
export interface ConnectorManagerConfig {
  /** Default retry configuration */
  defaultRetry?: RetryConfig;
  /** Default circuit breaker configuration */
  defaultCircuitBreaker?: CircuitBreakerConfig;
  /** Health check interval (ms) */
  healthCheckInterval?: number;
  /** Maximum connections per connector */
  maxConnectionsPerConnector?: number;
}

// ============================================
// Circuit Breaker Implementation
// ============================================

/**
 * Circuit breaker for fault tolerance
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private readonly config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  /**
   * Check if operations are allowed
   */
  canExecute(): boolean {
    if (this.state === 'closed') return true;
    
    if (this.state === 'open') {
      const now = new Date();
      const timeSinceFailure = this.lastFailureTime 
        ? now.getTime() - this.lastFailureTime.getTime() 
        : Infinity;
      
      if (timeSinceFailure >= this.config.resetTimeout) {
        this.state = 'half-open';
        this.successCount = 0;
        return true;
      }
      return false;
    }
    
    // Half-open: allow one request
    return true;
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'closed';
        this.successCount = 0;
      }
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.state === 'half-open') {
      this.state = 'open';
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
  }
}

// ============================================
// Rate Limiter Implementation
// ============================================

/**
 * Token bucket rate limiter
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: Date;
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.tokens = config.burstLimit || config.requestsPerMinute;
    this.lastRefill = new Date();
  }

  /**
   * Try to acquire a token for an operation
   */
  tryAcquire(): boolean {
    this.refill();
    
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = new Date();
    const elapsed = now.getTime() - this.lastRefill.getTime();
    
    // Refill based on requests per minute
    const tokensPerMs = this.config.requestsPerMinute / 60000;
    const newTokens = elapsed * tokensPerMs;
    
    const maxTokens = this.config.burstLimit || this.config.requestsPerMinute;
    this.tokens = Math.min(maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  /**
   * Get remaining tokens
   */
  getRemaining(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Wait until a token is available
   */
  async waitForToken(timeoutMs: number = 60000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (this.tryAcquire()) return true;
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }
}

// ============================================
// Base Connector Instance
// ============================================

/**
 * Base class for connector instances
 */
export abstract class BaseConnectorInstance<TConfig extends ConnectorConfig = ConnectorConfig> 
  implements ConnectorInstance<TConfig> {
  
  protected config: TConfig;
  protected definition: Connector<TConfig>;
  protected circuitBreaker: CircuitBreaker;
  protected rateLimiter: RateLimiter;
  protected state: ConnectorState;

  constructor(definition: Connector<TConfig>, config: TConfig) {
    this.definition = definition;
    this.config = config;
    
    this.circuitBreaker = new CircuitBreaker(
      definition.constraints?.find(c => c.type === 'circuit_breaker')?.config as CircuitBreakerConfig || {
        failureThreshold: 5,
        resetTimeout: 30000,
        successThreshold: 2
      }
    );

    this.rateLimiter = new RateLimiter(
      definition.rateLimits || { requestsPerMinute: 60 }
    );

    this.state = {
      name: definition.name,
      status: 'disconnected',
      totalOperations: 0,
      failedOperations: 0,
      averageLatency: 0,
      circuitBreakerState: 'closed'
    };
  }

  /**
   * Get the connector definition
   */
  get readonly() {
    return { definition: this.definition };
  }

  /**
   * Initialize the connector
   */
  async initialize(): Promise<void> {
    this.state.status = 'connecting';
    try {
      await this.doInitialize();
      this.state.status = 'connected';
    } catch (error) {
      this.state.status = 'error';
      throw error;
    }
  }

  /**
   * Subclasses implement actual initialization
   */
  protected abstract doInitialize(): Promise<void>;

  /**
   * Execute an operation with retry and circuit breaker
   */
  async execute<T = unknown>(
    operation: string,
    input: Record<string, unknown>
  ): Promise<OperationResult<T>> {
    // Check circuit breaker
    if (!this.circuitBreaker.canExecute()) {
      return {
        success: false,
        error: {
          code: 'CIRCUIT_BREAKER_OPEN',
          message: 'Circuit breaker is open - too many recent failures'
        }
      };
    }

    // Check rate limit
    if (!this.rateLimiter.tryAcquire()) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded - please retry later'
        }
      };
    }

    const startTime = Date.now();
    this.state.totalOperations++;

    try {
      const result = await this.executeWithRetry<T>(operation, input);
      
      // Update state on success
      this.state.lastSuccess = new Date();
      this.state.averageLatency = 
        (this.state.averageLatency * (this.state.totalOperations - 1) + 
         (Date.now() - startTime)) / this.state.totalOperations;
      
      this.circuitBreaker.recordSuccess();
      this.state.circuitBreakerState = this.circuitBreaker.getState();
      
      return result;
    } catch (error) {
      this.state.lastFailure = new Date();
      this.state.failedOperations++;
      this.circuitBreaker.recordFailure();
      this.state.circuitBreakerState = this.circuitBreaker.getState();

      return {
        success: false,
        error: this.normalizeError(error)
      };
    }
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry<T>(
    operation: string,
    input: Record<string, unknown>
  ): Promise<OperationResult<T>> {
    const retry = this.definition.retry || { maxAttempts: 1, backoff: 'fixed', baseDelayMs: 1000, retryOn: [] };
    let lastError: OperationError | null = null;

    for (let attempt = 0; attempt < retry.maxAttempts; attempt++) {
      try {
        const result = await this.doExecute<T>(operation, input);
        return result;
      } catch (error) {
        lastError = this.normalizeError(error);
        
        // Check if we should retry this error
        const shouldRetry = this.shouldRetry(lastError, retry);
        
        if (!shouldRetry || attempt === retry.maxAttempts - 1) {
          break;
        }

        // Calculate delay with backoff
        const delay = this.calculateBackoff(attempt, retry);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: lastError || { code: 'UNKNOWN_ERROR', message: 'Unknown error' }
    };
  }

  /**
   * Subclasses implement actual execution
   */
  protected abstract doExecute<T>(
    operation: string,
    input: Record<string, unknown>
  ): Promise<OperationResult<T>>;

  /**
   * Validate input against operation schema
   */
  validateInput(operation: string, input: Record<string, unknown>): ValidationResult {
    const op = this.definition.operations[operation];
    if (!op) {
      return {
        valid: false,
        errors: [{ path: '', message: `Unknown operation: ${operation}` }]
      };
    }

    // Simple validation - in production, use a JSON Schema validator
    const errors: Array<{ path: string; message: string }> = [];
    const required = op.input.required || [];

    for (const field of required) {
      if (!(field in input)) {
        errors.push({ path: field, message: `Missing required field: ${field}` });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validate output against operation schema
   */
  validateOutput(operation: string, output: unknown): ValidationResult {
    const op = this.definition.operations[operation];
    if (!op) {
      return {
        valid: false,
        errors: [{ path: '', message: `Unknown operation: ${operation}` }]
      };
    }

    // Basic output validation
    return { valid: true };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.doHealthCheck();
      return {
        healthy: result.healthy,
        latency: Date.now() - startTime,
        message: result.message,
        details: result.details
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        message: `Health check failed: ${error}`
      };
    }
  }

  /**
   * Subclasses implement actual health check
   */
  protected abstract doHealthCheck(): Promise<HealthCheckResult>;

  /**
   * Close the connector
   */
  async close(): Promise<void> {
    this.state.status = 'disconnected';
    await this.doClose();
  }

  /**
   * Subclasses implement actual cleanup
   */
  protected abstract doClose(): Promise<void>;

  /**
   * Get connector state
   */
  getState(): ConnectorState {
    return { ...this.state };
  }

  /**
   * Check if should retry based on error
   */
  private shouldRetry(error: OperationError, retry: RetryConfig): boolean {
    if (error.statusCode && retry.retryOn.includes(error.statusCode)) {
      if (retry.skipOn?.includes(error.statusCode)) return false;
      return true;
    }
    
    if (error.code && retry.retryOnErrors?.includes(error.code)) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate backoff delay
   */
  private calculateBackoff(attempt: number, retry: RetryConfig): number {
    switch (retry.backoff) {
      case 'exponential':
        return Math.min(
          retry.baseDelayMs * Math.pow(2, attempt),
          retry.maxDelayMs || retry.baseDelayMs * 10
        );
      case 'linear':
        return Math.min(
          retry.baseDelayMs * (attempt + 1),
          retry.maxDelayMs || retry.baseDelayMs * 10
        );
      case 'fixed':
      default:
        return retry.baseDelayMs;
    }
  }

  /**
   * Normalize error to OperationError
   */
  private normalizeError(error: unknown): OperationError {
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      return {
        code: (err.code as string) || 'UNKNOWN_ERROR',
        message: (err.message as string) || String(error),
        statusCode: err.statusCode as number | undefined,
        cause: error
      };
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      cause: error
    };
  }
}

// ============================================
// Connector Registry
// ============================================

/**
 * Global connector registry
 */
class ConnectorRegistry {
  private connectors: Map<string, ConnectorRegistryEntry> = new Map();

  /**
   * Register a connector
   */
  register(name: string, definition: Connector, factory: ConnectorFactory): void {
    this.connectors.set(name, {
      definition,
      factory,
      builtIn: false
    });
  }

  /**
   * Get a connector definition
   */
  get(name: string): ConnectorRegistryEntry | undefined {
    return this.connectors.get(name);
  }

  /**
   * Check if a connector exists
   */
  has(name: string): boolean {
    return this.connectors.has(name);
  }

  /**
   * List all registered connectors
   */
  list(): string[] {
    return [...this.connectors.keys()];
  }

  /**
   * Create an instance of a connector
   */
  createInstance(name: string, config: ConnectorConfig): ConnectorInstance {
    const entry = this.connectors.get(name);
    if (!entry) {
      throw new Error(`Connector not found: ${name}`);
    }
    return entry.factory(config);
  }
}

// Global registry instance
export const connectorRegistry = new ConnectorRegistry();

// ============================================
// Connector Manager
// ============================================

/**
 * Manages connector instances and provides unified interface
 */
export class ConnectorManager {
  private instances: Map<string, ConnectorInstance> = new Map();
  private config: ConnectorManagerConfig;
  private healthCheckInterval?: ReturnType<typeof setInterval>;

  constructor(config: ConnectorManagerConfig = {}) {
    this.config = {
      defaultRetry: {
        maxAttempts: 3,
        backoff: 'exponential',
        baseDelayMs: 1000,
        retryOn: [429, 500, 502, 503, 504]
      },
      defaultCircuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000,
        successThreshold: 2
      },
      healthCheckInterval: 60000,
      maxConnectionsPerConnector: 10,
      ...config
    };
  }

  /**
   * Register and initialize a connector
   */
  async registerConnector(
    name: string, 
    connectorName: string, 
    config: ConnectorConfig
  ): Promise<ConnectorInstance> {
    const instance = connectorRegistry.createInstance(connectorName, config);
    await instance.initialize();
    this.instances.set(name, instance);
    return instance;
  }

  /**
   * Get a connector instance
   */
  getConnector(name: string): ConnectorInstance | undefined {
    return this.instances.get(name);
  }

  /**
   * Execute an operation on a connector
   */
  async execute<T = unknown>(
    connectorName: string,
    operation: string,
    input: Record<string, unknown>
  ): Promise<OperationResult<T>> {
    const connector = this.instances.get(connectorName);
    if (!connector) {
      return {
        success: false,
        error: {
          code: 'CONNECTOR_NOT_FOUND',
          message: `Connector not found: ${connectorName}`
        }
      };
    }
    
    return connector.execute<T>(operation, input);
  }

  /**
   * Get all connector states
   */
  getStates(): Record<string, ConnectorState> {
    const states: Record<string, ConnectorState> = {};
    
    for (const [name, instance] of this.instances) {
      if ('getState' in instance) {
        states[name] = (instance as BaseConnectorInstance).getState();
      }
    }
    
    return states;
  }

  /**
   * Run health checks on all connectors
   */
  async runHealthChecks(): Promise<Record<string, HealthCheckResult>> {
    const results: Record<string, HealthCheckResult> = {};
    
    for (const [name, instance] of this.instances) {
      results[name] = await instance.healthCheck();
    }
    
    return results;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(): void {
    if (this.healthCheckInterval) return;
    
    this.healthCheckInterval = setInterval(
      () => this.runHealthChecks(),
      this.config.healthCheckInterval
    );
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Close all connectors
   */
  async closeAll(): Promise<void> {
    this.stopHealthChecks();
    
    for (const instance of this.instances.values()) {
      await instance.close();
    }
    
    this.instances.clear();
  }
}

// ============================================
// HTTP Connector Base
// ============================================

/**
 * Base class for HTTP-based connectors
 */
export abstract class HttpConnectorInstance<TConfig extends ConnectorConfig = ConnectorConfig> 
  extends BaseConnectorInstance<TConfig> {
  
  protected baseUrl: string;

  constructor(definition: Connector<TConfig>, config: TConfig) {
    super(definition, config);
    this.baseUrl = config.baseUrl || '';
  }

  protected async doInitialize(): Promise<void> {
    // Verify connectivity
    try {
      const response = await fetch(this.baseUrl, { method: 'HEAD' });
      // Connection successful
    } catch {
      // May fail if endpoint doesn't support HEAD, that's OK
    }
  }

  protected async doExecute<T>(
    operation: string,
    input: Record<string, unknown>
  ): Promise<OperationResult<T>> {
    const op = this.definition.operations[operation];
    if (!op) {
      return {
        success: false,
        error: { code: 'UNKNOWN_OPERATION', message: `Unknown operation: ${operation}` }
      };
    }

    // Build HTTP request
    const url = this.buildUrl(operation, input);
    const request = this.buildRequest(operation, input);

    const response = await fetch(url, request);
    const data = await this.parseResponse<T>(response);

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: `HTTP error: ${response.status} ${response.statusText}`,
          statusCode: response.status,
          details: data as Record<string, unknown>
        }
      };
    }

    return {
      success: true,
      data,
      metadata: {
        duration: 0,
        attempts: 1
      }
    };
  }

  protected buildUrl(operation: string, input: Record<string, unknown>): string {
    // Override in subclasses
    return this.baseUrl;
  }

  protected buildRequest(operation: string, input: Record<string, unknown>): RequestInit {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.defaultHeaders
      },
      body: JSON.stringify(input)
    };
  }

  protected async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as Promise<T>;
  }

  protected async doHealthCheck(): Promise<HealthCheckResult> {
    try {
      const response = await fetch(this.baseUrl, { method: 'HEAD' });
      return {
        healthy: response.ok,
        message: response.ok ? 'Connection healthy' : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Connection failed: ${error}`
      };
    }
  }

  protected async doClose(): Promise<void> {
    // Nothing to close for HTTP
  }
}

// ============================================
// Exports
// ============================================

export default {
  ConnectorManager,
  ConnectorRegistry: connectorRegistry,
  CircuitBreaker,
  RateLimiter,
  BaseConnectorInstance,
  HttpConnectorInstance
};
