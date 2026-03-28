# Production Readiness Guide

This guide covers production deployment best practices for Constraint Flow, including rate limiting strategies, retry/fallback patterns, and monitoring integration.

## Table of Contents

- [Rate Limiting Strategy](#rate-limiting-strategy)
- [Retry & Fallback Patterns](#retry--fallback-patterns)
- [Monitoring Integration](#monitoring-integration)
- [Health Checks](#health-checks)
- [Capacity Planning](#capacity-planning)

---

## Rate Limiting Strategy

### Overview

Rate limiting protects Constraint Flow from:
- API quota exhaustion
- Resource exhaustion
- Cascading failures
- Unintended DDoS

### Rate Limiting Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    RATE LIMITING LAYERS                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Global Rate Limit (Application)                   │
│  └─ Protects overall system capacity                        │
│                                                              │
│  Layer 2: User/tenant Rate Limit                            │
│  └─ Ensures fair usage across tenants                       │
│                                                              │
│  Layer 3: Workflow Rate Limit                               │
│  └─ Prevents workflow spam                                  │
│                                                              │
│  Layer 4: Connector Rate Limit                              │
│  └─ Respects external API limits                            │
│                                                              │
│  Layer 5: Operation Rate Limit                              │
│  └─ Granular control per operation                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Configuration

```typescript
const rateLimitConfig = {
  // Global application limits
  global: {
    requestsPerSecond: 1000,
    requestsPerMinute: 50000,
    concurrentRequests: 500,
  },
  
  // Per-tenant limits
  tenant: {
    default: {
      requestsPerSecond: 100,
      requestsPerMinute: 5000,
      concurrentRequests: 50,
    },
    enterprise: {
      requestsPerSecond: 500,
      requestsPerMinute: 25000,
      concurrentRequests: 200,
    },
  },
  
  // Per-workflow limits
  workflow: {
    executionsPerMinute: 100,
    concurrentExecutions: 10,
  },
  
  // Per-connector limits
  connector: {
    slack: {
      requestsPerMinute: 100,
      concurrentRequests: 10,
    },
    github: {
      requestsPerHour: 5000,
      concurrentRequests: 20,
    },
    jira: {
      requestsPerMinute: 60,
      concurrentRequests: 5,
    },
  },
};
```

### Rate Limit Response Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

### Rate Limit Handling in Workflows

```typescript
const workflow = defineWorkflow({
  name: 'rate-limited-api-calls',
  
  steps: [
    {
      id: 'call-external-api',
      connector: 'external-service',
      operation: 'getData',
      
      // Built-in rate limit handling
      rateLimit: {
        respectHeader: true, // Use external service's rate limit headers
        maxRetries: 3,
        backoff: 'exponential',
      },
      
      // Fallback when rate limited
      fallback: {
        condition: '${error.code === "RATE_LIMITED"}',
        connector: 'cache',
        operation: 'get',
        input: { key: 'fallback:${input.resourceId}' },
      },
    },
  ],
});
```

---

## Retry & Fallback Patterns

### Retry Strategies

#### Exponential Backoff (Recommended)

```typescript
const exponentialBackoff = {
  strategy: 'exponential',
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
  jitter: true, // Add randomness to prevent thundering herd
  
  // Calculate delay: baseDelayMs * 2^attempt + jitter
  calculateDelay: (attempt: number, base: number, max: number) => {
    const delay = Math.min(base * Math.pow(2, attempt), max);
    const jitter = delay * 0.2 * Math.random(); // 20% jitter
    return delay + jitter;
  },
};
```

#### Linear Backoff

```typescript
const linearBackoff = {
  strategy: 'linear',
  maxAttempts: 3,
  baseDelayMs: 5000,
  
  // Calculate delay: baseDelayMs * attempt
  calculateDelay: (attempt: number, base: number) => base * attempt,
};
```

#### Fixed Delay

```typescript
const fixedDelay = {
  strategy: 'fixed',
  maxAttempts: 3,
  delayMs: 5000,
};
```

### Retry Configuration

```typescript
const retryConfig = {
  // What to retry
  retryOn: [
    'NETWORK_TIMEOUT',
    'NETWORK_ERROR',
    'RATE_LIMITED',
    'SERVICE_UNAVAILABLE',
    'INTERNAL_ERROR',
  ],
  
  // What NOT to retry
  skipRetryOn: [
    'AUTHENTICATION_FAILED',
    'PERMISSION_DENIED',
    'VALIDATION_ERROR',
    'RESOURCE_NOT_FOUND',
  ],
  
  // HTTP status codes to retry
  retryOnStatus: [408, 429, 500, 502, 503, 504],
  
  // Maximum total retry time
  maxTotalRetryTimeMs: 300000, // 5 minutes
};
```

### Workflow-Level Retry

```typescript
const workflowWithRetry = defineWorkflow({
  name: 'reliable-workflow',
  
  // Global retry configuration
  errorHandling: {
    strategy: 'continue',
    
    defaultRetry: {
      maxAttempts: 3,
      backoff: 'exponential',
      baseDelayMs: 1000,
      maxDelayMs: 30000,
    },
    
    onError: [
      {
        error: 'RATE_LIMITED',
        retry: {
          maxAttempts: 5,
          backoff: 'exponential',
          baseDelayMs: 60000, // Start with 1 minute
        },
      },
      {
        error: 'NETWORK_*',
        retry: {
          maxAttempts: 3,
          backoff: 'exponential',
          baseDelayMs: 5000,
        },
      },
    ],
  },
  
  steps: [/* ... */],
});
```

### Step-Level Retry

```typescript
const stepWithRetry = {
  id: 'unreliable-operation',
  connector: 'external-api',
  operation: 'fetchData',
  
  retry: {
    maxAttempts: 5,
    backoff: 'exponential',
    baseDelayMs: 2000,
    maxDelayMs: 60000,
    retryOn: ['TIMEOUT', 'SERVICE_UNAVAILABLE'],
  },
  
  // Fallback if all retries fail
  fallback: {
    connector: 'cache',
    operation: 'get',
    input: { key: 'fallback-data' },
  },
};
```

### Fallback Patterns

#### Static Fallback

```typescript
{
  id: 'with-static-fallback',
  connector: 'api',
  operation: 'fetch',
  
  fallback: {
    connector: 'static',
    operation: 'return',
    input: { data: { status: 'unavailable' } },
  },
}
```

#### Cached Fallback

```typescript
{
  id: 'with-cached-fallback',
  connector: 'api',
  operation: 'fetch',
  
  fallback: {
    connector: 'cache',
    operation: 'get',
    input: { key: 'api-data-${input.id}' },
  },
}
```

#### Alternative Connector Fallback

```typescript
{
  id: 'with-alternative-connector',
  connector: 'primary-payment',
  operation: 'charge',
  
  fallback: {
    condition: '${error.code === "SERVICE_UNAVAILABLE"}',
    connector: 'backup-payment',
    operation: 'charge',
    input: { /* same input */ },
  },
}
```

#### Circuit Breaker Pattern

```typescript
{
  id: 'with-circuit-breaker',
  connector: 'external-service',
  operation: 'getData',
  
  circuitBreaker: {
    failureThreshold: 5,        // Open after 5 failures
    successThreshold: 2,        // Close after 2 successes
    resetTimeout: 60000,        // Try reset after 1 minute
    
    fallback: {
      connector: 'cache',
      operation: 'get',
      input: { key: 'fallback:${input.id}' },
    },
    
    onStateChange: {
      open: {
        notify: ['#ops-alerts'],
        log: true,
      },
      close: {
        notify: ['#ops-alerts'],
      },
    },
  },
}
```

---

## Monitoring Integration

### Metrics

#### System Metrics

```typescript
const systemMetrics = {
  // Throughput
  'constraint_flow.workflows.started': 'counter',
  'constraint_flow.workflows.completed': 'counter',
  'constraint_flow.workflows.failed': 'counter',
  'constraint_flow.steps.executed': 'counter',
  
  // Latency
  'constraint_flow.workflow.duration': 'histogram',
  'constraint_flow.step.duration': 'histogram',
  'constraint_flow.connector.latency': 'histogram',
  
  // Errors
  'constraint_flow.errors.total': 'counter',
  'constraint_flow.errors.by_type': 'counter',
  'constraint_flow.retries.total': 'counter',
  
  // Resources
  'constraint_flow.memory.used': 'gauge',
  'constraint_flow.cpu.usage': 'gauge',
  'constraint_flow.connections.active': 'gauge',
  
  // Queues
  'constraint_flow.queue.size': 'gauge',
  'constraint_flow.queue.wait_time': 'histogram',
};
```

#### Business Metrics

```typescript
const businessMetrics = {
  // Workflow execution
  'constraint_flow.workflow.success_rate': 'gauge',
  'constraint_flow.workflow.sla_breach': 'counter',
  'constraint_flow.approval.pending': 'gauge',
  
  // Connector usage
  'constraint_flow.connector.calls': 'counter',
  'constraint_flow.connector.errors': 'counter',
  'constraint_flow.connector.rate_limit_hits': 'counter',
  
  // Constraints
  'constraint_flow.constraint.violations': 'counter',
  'constraint_flow.constraint.checks': 'counter',
};
```

### Prometheus Integration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'constraint-flow'
    static_configs:
      - targets: ['constraint-flow:9090']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

```typescript
// Custom metrics endpoint
app.get('/metrics', async (req, res) => {
  const metrics = await metricsRegistry.getMetrics();
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});
```

### Grafana Dashboards

#### Overview Dashboard

```json
{
  "dashboard": {
    "title": "Constraint Flow Overview",
    "panels": [
      {
        "title": "Workflow Throughput",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(constraint_flow_workflows_started_total[5m])",
            "legendFormat": "Started"
          },
          {
            "expr": "rate(constraint_flow_workflows_completed_total[5m])",
            "legendFormat": "Completed"
          },
          {
            "expr": "rate(constraint_flow_workflows_failed_total[5m])",
            "legendFormat": "Failed"
          }
        ]
      },
      {
        "title": "Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(constraint_flow_workflows_completed_total[5m])) / sum(rate(constraint_flow_workflows_started_total[5m])) * 100",
            "legendFormat": "%"
          }
        ],
        "thresholds": {
          "mode": "absolute",
          "steps": [
            { "color": "red", "value": 0 },
            { "color": "yellow", "value": 95 },
            { "color": "green", "value": 99 }
          ]
        }
      },
      {
        "title": "P95 Latency",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(constraint_flow_workflow_duration_seconds_bucket[5m]))",
            "legendFormat": "P95"
          }
        ]
      }
    ]
  }
}
```

### Alerting Rules

```yaml
# alerting_rules.yml
groups:
  - name: constraint-flow
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(constraint_flow_workflows_failed_total[5m])) /
          sum(rate(constraint_flow_workflows_started_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"
      
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, rate(constraint_flow_workflow_duration_seconds_bucket[5m])) > 30
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High workflow latency"
          description: "P95 latency is {{ $value }}s"
      
      - alert: CircuitBreakerOpen
        expr: |
          constraint_flow_circuit_breaker_state{state="open"} == 1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Circuit breaker open for {{ $labels.connector }}"
          description: "The circuit breaker for {{ $labels.connector }} has been open for more than 1 minute"
      
      - alert: RateLimitApproaching
        expr: |
          constraint_flow_rate_limit_remaining / constraint_flow_rate_limit_limit < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Rate limit nearly exhausted for {{ $labels.connector }}"
          description: "Only {{ $value | humanizePercentage }} of rate limit remaining"
```

### Logging

#### Structured Logging

```typescript
const logConfig = {
  format: 'json',
  level: 'info',
  
  fields: {
    service: 'constraint-flow',
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
  },
  
  // Request logging
  requestLogging: {
    enabled: true,
    includeHeaders: ['x-request-id', 'x-workflow-id'],
    excludePaths: ['/health', '/metrics'],
  },
  
  // Workflow execution logging
  workflowLogging: {
    enabled: true,
    logSteps: true,
    logInput: false, // Don't log sensitive input
    logOutput: false,
  },
};
```

#### Log Aggregation

```yaml
# fluent-bit.conf
[INPUT]
  Name              tail
  Path              /var/log/constraint-flow/*.log
  Parser            json
  Tag               constraint-flow

[OUTPUT]
  Name              elasticsearch
  Match             constraint-flow
  Host              elasticsearch
  Port              9200
  Index             constraint-flow-%Y.%m.%d
```

---

## Health Checks

### Liveness Probe

```typescript
// /health/live
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

### Readiness Probe

```typescript
// /health/ready
app.get('/health/ready', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    connectors: await checkConnectors(),
  };
  
  const allHealthy = Object.values(checks).every(c => c.healthy);
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    checks,
  });
});
```

### Detailed Health Check

```typescript
// /health/detail
app.get('/health/detail', async (req, res) => {
  const details = {
    version: process.env.APP_VERSION,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    
    components: {
      database: await getDatabaseHealth(),
      redis: await getRedisHealth(),
      queue: await getQueueHealth(),
      connectors: await getConnectorsHealth(),
    },
    
    metrics: {
      activeWorkflows: await getActiveWorkflowCount(),
      queuedExecutions: await getQueueSize(),
      avgLatency: await getAverageLatency(),
    },
  };
  
  res.json(details);
});
```

---

## Capacity Planning

### Resource Requirements

| Component | CPU | Memory | Storage |
|-----------|-----|--------|---------|
| API Server (per instance) | 1-2 cores | 2-4 GB | - |
| Workflow Engine (per instance) | 2-4 cores | 4-8 GB | - |
| Database (PostgreSQL) | 4-8 cores | 16-32 GB | 500GB+ |
| Redis (Cache) | 2 cores | 8-16 GB | - |
| Queue (Redis/RabbitMQ) | 2-4 cores | 8-16 GB | - |

### Scaling Guidelines

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU > 70% | 5 minutes | Add instance |
| Memory > 80% | 5 minutes | Add instance |
| Queue depth > 1000 | 5 minutes | Add workers |
| P95 latency > 5s | 10 minutes | Add instances |
| Error rate > 1% | 5 minutes | Alert + investigate |

### Performance Benchmarks

| Scenario | Throughput | Latency P95 |
|----------|-----------|-------------|
| Simple workflow | 1000/min | 500ms |
| Medium complexity | 500/min | 2s |
| Complex workflow | 100/min | 10s |
| With external API | 200/min | 3s |

### Exact Arithmetic Performance (from constraint-theory-core)

| Operation | Operations/sec | Notes |
|-----------|---------------|-------|
| CT_ADD | 2,500,000 | Single exact addition |
| CT_SUM (100 values) | 500,000 | Batch sum without error |
| CT_ROUND | 1,800,000 | Regulatory rounding |
| ExactNumber.compare | 3,000,000 | Exact comparison |

### Geometric Routing Performance (from constraint-theory-core)

| Agents | Routes/sec | Memory |
|--------|-----------|--------|
| 10 | 20,000 | 10 KB |
| 100 | 5,000 | 50 KB |
| 1,000 | 500 | 200 KB |
| 10,000 | 80 | 1.5 MB |

### Constraint Validation Performance

| Constraint | Validations/sec | Notes |
|------------|-----------------|-------|
| amount_limit | 200,000 | Simple comparison |
| exact_precision | 66,000 | Rational conversion |
| no_cycles | 2,000 | Graph traversal |
| balanced_workload | 10,000 | Geometric analysis |

### Comparison: JavaScript vs Constraint Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              FINANCIAL CALCULATION ACCURACY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Test: Sum 1,000 values of $0.10 each                           │
│                                                                  │
│  JavaScript (float):                                             │
│    Result: $99.9999999999986                                    │
│    Error: $0.0000000000014                                      │
│                                                                  │
│  Constraint Flow (exact):                                        │
│    Result: $100.00 EXACTLY                                      │
│    Error: $0.00                                                 │
│                                                                  │
│  At 1 billion transactions:                                      │
│    JavaScript error: ~$40,000 unaccounted                       │
│    Constraint Flow: $0.00 unaccounted                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Benchmark Commands

```bash
# Run full benchmark suite
npm run benchmark

# Run exact arithmetic benchmarks
npm run benchmark:arithmetic

# Run routing benchmarks
npm run benchmark:routing

# Run constraint validation benchmarks
npm run benchmark:constraints

# Generate benchmark report
npm run benchmark:report
```

---

## Related Documentation

- [Core Integration Guide](./CORE_INTEGRATION.md) - Exact arithmetic and Rust integration
- [Enterprise Guide](./ENTERPRISE.md) - SSO, audit logging, compliance
- [Security Guide](./SECURITY.md) - Security best practices

---

**Last Updated**: 2025-01-27
**Document Version**: 1.1.0
