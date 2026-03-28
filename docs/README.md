# Constraint Flow Documentation

Welcome to the Constraint Flow documentation. This index provides quick access to all documentation resources.

## Getting Started

- [README](../README.md) - Project overview and quick start
- [Onboarding Guide](../ONBOARDING.md) - Comprehensive getting started guide
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute to the project

## Core Documentation

### Schema & Types

| Document | Description |
|----------|-------------|
| [Schema Documentation](./SCHEMA.md) | Complete workflow, constraint, and connector schemas with JSON Schema definitions |
| [Workflow Patterns](./WORKFLOW_PATTERNS.md) | Common workflow patterns and best practices |
| [Connector Development](./CONNECTORS.md) | Guide to developing and configuring connectors |

### Integration & Ecosystem

| Document | Description |
|----------|-------------|
| [Core Integration](./CORE_INTEGRATION.md) | Integration with constraint-theory-core (Rust) |
| [Ranch Integration](./RANCH_INTEGRATION.md) | Agent training and coordination from constraint-ranch |
| [Ecosystem Guide](./ECOSYSTEM.md) | Full ecosystem integration and cross-repo examples |

### API & Integration

| Document | Description |
|----------|-------------|
| [Error Codes](./ERROR_CODES.md) | Standardized error codes across all connectors |
| [Deprecation Policy](./DEPRECATION_POLICY.md) | API versioning and deprecation process |

### Security & Operations

| Document | Description |
|----------|-------------|
| [Security Documentation](./SECURITY.md) | Security best practices, audit procedures, and compliance |
| [Production Readiness](./PRODUCTION.md) | Rate limiting, retry patterns, and monitoring |
| [Enterprise Integration](./ENTERPRISE.md) | SSO, audit logging, compliance, and disaster recovery |
| [Deployment Runbooks](./DEPLOYMENT_RUNBOOKS.md) | Operational runbooks for deployment and incident response |

## Quick Reference

### Workflow Definition

```typescript
import { defineWorkflow } from 'constraint-flow';

const workflow = defineWorkflow({
  name: 'my-workflow',
  version: '1.0.0',
  
  steps: [
    {
      id: 'step-1',
      connector: 'slack',
      operation: 'sendMessage',
      input: { channel: '#general', text: 'Hello!' }
    }
  ],
  
  constraints: [
    { type: 'time_limit', config: { milliseconds: 30000 } }
  ]
});
```

### Constraint Types

| Category | Types |
|----------|-------|
| **Value** | `amount_limit`, `amount_range`, `exact_precision`, `category_validation` |
| **Temporal** | `time_limit`, `business_hours`, `weekdays_only`, `sla` |
| **Approval** | `approval_required`, `multi_approval`, `conditional_approval`, `escalation_path` |
| **Geometric** | `balanced_workload`, `no_cycles`, `min_parallelism`, `max_latency` |
| **Compliance** | `audit_trail`, `hipaa_compliant`, `data_locality`, `compliance_check` |
| **System** | `rate_limit`, `idempotency`, `circuit_breaker` |

### Available Connectors

| Connector | Description | Key Operations |
|-----------|-------------|----------------|
| `slack` | Slack workspace integration | sendMessage, listChannels, addReaction |
| `github` | GitHub repository management | createIssue, createPullRequest, triggerWorkflow |
| `jira` | Jira issue tracking | createIssue, transitionIssue, searchIssues |

### Error Handling

```typescript
const workflow = defineWorkflow({
  name: 'error-handling-example',
  
  errorHandling: {
    strategy: 'compensate',
    
    onError: [
      {
        error: 'RATE_LIMITED',
        retry: { maxAttempts: 3, backoff: 'exponential' }
      }
    ]
  },
  
  compensation: {
    'step-id': {
      connector: 'connector',
      operation: 'undo',
      input: { /* ... */ }
    }
  }
});
```

## External Resources

- [constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core) - Exact arithmetic engine
- [constraint-ranch](https://github.com/SuperInstance/constraint-ranch) - Agent training platform
- [constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python) - Python bindings

## Support

- 📖 [Documentation](https://docs.constraint-flow.ai)
- 💬 [GitHub Discussions](https://github.com/SuperInstance/constraint-flow/discussions)
- 🐛 [Issue Tracker](https://github.com/SuperInstance/constraint-flow/issues)
- 📧 [Email Support](mailto:support@constraint-flow.ai)

---

**Last Updated**: 2025-01-27
