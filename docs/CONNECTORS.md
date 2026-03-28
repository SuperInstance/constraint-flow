# Connector Development Guide

This guide explains how to create, configure, and use connectors in Constraint Flow. Connectors provide standardized interfaces to external systems like Slack, Jira, GitHub, databases, and APIs.

## Table of Contents

- [What is a Connector?](#what-is-a-connector)
- [Connector Anatomy](#connector-anatomy)
- [Creating a New Connector](#creating-a-new-connector)
- [Authentication](#authentication)
- [Operations](#operations)
- [Events (Webhooks)](#events-webhooks)
- [Constraints](#constraints)
- [Helper Methods](#helper-methods)
- [Testing Connectors](#testing-connectors)
- [Best Practices](#best-practices)

---

## What is a Connector?

A connector is a typed, validated interface between Constraint Flow workflows and external systems. It provides:

- **Standardized operations** - Consistent API for common actions
- **Type safety** - Full TypeScript types for inputs and outputs
- **Authentication** - Secure credential management
- **Rate limiting** - Built-in protection against API limits
- **Retry logic** - Automatic error recovery
- **Webhook events** - Real-time triggers from external systems

### Built-in Connectors

| Connector | Description | Key Operations |
|-----------|-------------|----------------|
| `slack` | Slack workspace integration | sendMessage, listChannels, addReaction |
| `jira` | Jira issue tracking | createIssue, transitionIssue, searchIssues |
| `github` | GitHub repository management | createIssue, createPullRequest, triggerWorkflow |

---

## Connector Anatomy

Every connector follows this structure:

```typescript
export const myConnector: Connector<MyConfig> = {
  // Required metadata
  name: 'my-connector',
  version: '1.0.0',
  description: 'Description of what this connector does',
  
  // Authentication configuration
  auth: { ... },
  
  // Rate limiting configuration
  rateLimits: { ... },
  
  // Retry configuration
  retry: { ... },
  
  // Available operations
  operations: { ... },
  
  // Webhook events
  events: { ... },
  
  // Constraints enforced by connector
  constraints: [ ... ],
  
  // Helper methods
  helpers: { ... }
};
```

---

## Creating a New Connector

### Step 1: Define Types

```typescript
// Configuration type for the connector
export interface MyConnectorConfig extends ConnectorConfig {
  baseUrl: string;
  auth: {
    type: 'api-key' | 'oauth2';
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
  };
  defaultTimeout?: number;
}

// Response types for operations
export interface MyResource {
  id: string;
  name: string;
  createdAt: string;
  // ... other fields
}
```

### Step 2: Create the Connector

```typescript
import type { Connector } from '../src/types';

export const myConnector: Connector<MyConnectorConfig> = {
  name: 'my-connector',
  version: '1.0.0',
  description: 'Integration with My Service',
  
  // Continue with other sections...
};
```

### Step 3: Define Authentication

```typescript
auth: {
  type: 'oauth2',
  grantType: 'authorization_code',
  scopes: ['read', 'write'],
  tokenUrl: 'https://api.myservice.com/oauth/token',
  authorizeUrl: 'https://api.myservice.com/oauth/authorize',
  refreshUrl: 'https://api.myservice.com/oauth/refresh',
  docs: 'https://docs.myservice.com/authentication'
}
```

### Step 4: Define Operations

```typescript
operations: {
  listResources: {
    name: 'listResources',
    description: 'List all resources',
    
    input: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 50 },
        filter: { type: 'string' }
      }
    },
    
    output: {
      type: 'object',
      properties: {
        items: { 
          type: 'array',
          items: { $ref: '#/components/schemas/MyResource' }
        },
        total: { type: 'number' }
      }
    },
    
    examples: [
      {
        name: 'List all resources',
        input: { limit: 100 }
      }
    ]
  },
  
  createResource: {
    name: 'createResource',
    description: 'Create a new resource',
    
    input: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' }
      }
    },
    
    output: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        createdAt: { type: 'string' }
      }
    }
  }
}
```

---

## Authentication

Constraint Flow supports multiple authentication methods:

### API Key

```typescript
auth: {
  type: 'api-key',
  headerName: 'X-API-Key',
  description: 'API key from your account settings'
}
```

### OAuth2

```typescript
auth: {
  type: 'oauth2',
  grantType: 'authorization_code',
  scopes: ['read', 'write'],
  tokenUrl: 'https://api.example.com/oauth/token',
  authorizeUrl: 'https://api.example.com/oauth/authorize'
}
```

### Basic Auth

```typescript
auth: {
  type: 'basic',
  description: 'Username and password authentication'
}
```

### Custom Auth

```typescript
auth: {
  type: 'custom',
  handler: async (config) => {
    // Custom authentication logic
    return {
      headers: { 'X-Custom-Auth': generateToken(config) }
    };
  }
}
```

---

## Operations

Operations define the actions a connector can perform.

### Input Schema

Use JSON Schema to define inputs:

```typescript
input: {
  type: 'object',
  required: ['resourceId'],
  properties: {
    resourceId: { 
      type: 'string',
      description: 'Unique identifier of the resource'
    },
    options: {
      type: 'object',
      properties: {
        includeDeleted: { type: 'boolean', default: false },
        expand: { type: 'array', items: { type: 'string' } }
      }
    }
  }
}
```

### Output Schema

```typescript
output: {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    status: { 
      type: 'string',
      enum: ['active', 'inactive', 'pending']
    }
  }
}
```

### Examples

Provide usage examples:

```typescript
examples: [
  {
    name: 'Get active resources',
    input: {
      resourceId: 'res_123',
      options: { includeDeleted: false }
    }
  },
  {
    name: 'Get with expansion',
    input: {
      resourceId: 'res_123',
      options: { expand: ['owner', 'metadata'] }
    }
  }
]
```

---

## Events (Webhooks)

Define webhook events that the connector can receive:

```typescript
events: {
  resource_created: {
    name: 'resource_created',
    description: 'Triggered when a resource is created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        createdAt: { type: 'string' }
      }
    }
  },
  
  resource_updated: {
    name: 'resource_updated',
    description: 'Triggered when a resource is updated',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        changes: { type: 'object' },
        updatedBy: { type: 'string' }
      }
    }
  }
}
```

### Using Events in Workflows

```typescript
const workflow = defineWorkflow({
  name: 'handle-resource-events',
  trigger: {
    type: 'webhook',
    connector: 'my-connector',
    event: 'resource_created'
  },
  steps: [
    {
      id: 'process',
      connector: 'slack',
      operation: 'sendMessage',
      input: {
        channel: '#notifications',
        text: 'New resource created: ${trigger.name}'
      }
    }
  ]
});
```

---

## Constraints

Define constraints that the connector enforces:

```typescript
constraints: [
  {
    type: 'rate-limit',
    description: 'API rate limits',
    config: { maxPerMinute: 100 }
  },
  {
    type: 'payload-size',
    description: 'Maximum request payload size',
    config: { maxSizeBytes: 10 * 1024 * 1024 } // 10MB
  },
  {
    type: 'required-scopes',
    description: 'Required OAuth scopes',
    config: { scopes: ['read', 'write'] }
  }
]
```

---

## Helper Methods

Helper methods provide utility functions for working with the connector:

```typescript
helpers: {
  /**
   * Format a resource for display
   */
  formatResource(resource: MyResource): string {
    return `[${resource.id}] ${resource.name}`;
  },
  
  /**
   * Build a query string from filters
   */
  buildQuery(filters: Record<string, any>): string {
    return Object.entries(filters)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
  },
  
  /**
   * Validate a resource ID
   */
  validateResourceId(id: string): boolean {
    return /^res_[a-zA-Z0-9]+$/.test(id);
  }
}
```

### Using Helpers in Workflows

```typescript
import { myConnector } from './connectors/my-connector';

// In a workflow step
const formattedName = myConnector.helpers.formatResource(resource);
```

---

## Testing Connectors

### Unit Tests

```typescript
import { myConnector } from './my-connector';

describe('my-connector', () => {
  it('should have required metadata', () => {
    expect(myConnector.name).toBe('my-connector');
    expect(myConnector.version).toBeDefined();
  });
  
  it('should define required operations', () => {
    expect(myConnector.operations.listResources).toBeDefined();
    expect(myConnector.operations.createResource).toBeDefined();
  });
  
  it('should validate input schemas', () => {
    const operation = myConnector.operations.createResource;
    const validInput = { name: 'Test' };
    // Validate using JSON Schema validator
    expect(validate(operation.input, validInput)).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('my-connector integration', () => {
  let connector: ConnectorInstance<MyConnectorConfig>;
  
  beforeAll(async () => {
    connector = await initializeConnector(myConnector, {
      baseUrl: process.env.TEST_API_URL,
      auth: { type: 'api-key', apiKey: process.env.TEST_API_KEY }
    });
  });
  
  it('should list resources', async () => {
    const result = await connector.operations.listResources({ limit: 10 });
    expect(result.items).toBeDefined();
    expect(result.items.length).toBeLessThanOrEqual(10);
  });
  
  it('should create a resource', async () => {
    const result = await connector.operations.createResource({
      name: 'Test Resource'
    });
    expect(result.id).toBeDefined();
  });
});
```

---

## Best Practices

### 1. Comprehensive Type Definitions

```typescript
// Good - Full type definitions
export interface CreateResourceInput {
  name: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// Avoid - Using 'any'
export interface CreateResourceInput {
  name: string;
  data?: any;
}
```

### 2. Clear Descriptions

```typescript
// Good
properties: {
  timeout: { 
    type: 'number',
    description: 'Request timeout in milliseconds. Default: 30000',
    default: 30000
  }
}

// Avoid
properties: {
  timeout: { type: 'number' }
}
```

### 3. Meaningful Examples

```typescript
examples: [
  {
    name: 'Basic usage',
    input: { name: 'My Resource' }
  },
  {
    name: 'With all options',
    input: {
      name: 'My Resource',
      description: 'A detailed description',
      tags: ['production', 'important'],
      metadata: { department: 'engineering' }
    }
  }
]
```

### 4. Error Handling

```typescript
// Define error types
export class MyConnectorError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
  }
}

// Use in operations
async executeOperation(input) {
  try {
    const response = await api.request(input);
    return response;
  } catch (error) {
    if (error.status === 401) {
      throw new MyConnectorError('Authentication failed', 'AUTH_ERROR', 401);
    }
    throw new MyConnectorError(
      `Operation failed: ${error.message}`,
      'OPERATION_ERROR',
      error.status
    );
  }
}
```

### 5. Rate Limiting

```typescript
rateLimits: {
  tier: 'standard',
  requestsPerMinute: 100,
  concurrentRequests: 5,
  burstLimit: 20
}
```

### 6. Retry Configuration

```typescript
retry: {
  maxAttempts: 3,
  backoff: 'exponential',
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryOn: [429, 500, 502, 503, 504],
  skipOn: [400, 401, 403, 404]
}
```

---

## Connector Registry

All connectors should be registered in the connector registry:

```typescript
// src/connectors/index.ts
export { slackConnector } from './slack';
export { jiraConnector } from './jira';
export { githubConnector } from './github';
export { myConnector } from './my-connector';

export const connectorRegistry = {
  slack: slackConnector,
  jira: jiraConnector,
  github: githubConnector,
  'my-connector': myConnector
};
```

---

## Publishing Connectors

### Package Structure

```
my-connector/
├── src/
│   ├── index.ts          # Main export
│   ├── types.ts          # Type definitions
│   ├── connector.ts      # Connector definition
│   └── helpers.ts        # Helper methods
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
└── README.md
```

### package.json

```json
{
  "name": "@constraint-flow/connector-my-service",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "@constraint-flow/core": "^1.0.0"
  }
}
```

---

## Need Help?

- 📖 [Workflow Patterns Guide](./WORKFLOW_PATTERNS.md)
- 🔌 [Example Connectors](../connectors/)
- 💬 [GitHub Discussions](https://github.com/SuperInstance/constraint-flow/discussions)
- 🐛 [Report Issues](https://github.com/SuperInstance/constraint-flow/issues)
