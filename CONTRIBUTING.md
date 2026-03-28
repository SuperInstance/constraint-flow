# Contributing to Constraint-Flow

Thank you for your interest in contributing to Constraint-Flow! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Adding New Connectors](#adding-new-connectors)
- [Adding New Integrations](#adding-new-integrations)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/constraint-flow.git`
3. Install dependencies: `npm install`
4. Build the project: `npm run build`
5. Run tests: `npm test`

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- TypeScript 5.x

### Installation

```bash
git clone https://github.com/SuperInstance/constraint-flow.git
cd constraint-flow
npm install
```

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/SuperInstance/constraint-flow/issues)
2. If not, create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details

### Suggesting Features

1. Open a discussion in [GitHub Discussions](https://github.com/SuperInstance/constraint-flow/discussions)
2. Describe the feature and its use case
3. Explain how it fits with Constraint-Flow's philosophy of guaranteed execution

## Adding New Connectors

Connectors are the bridge between Constraint-Flow and external systems.

### Connector Template

```typescript
import { Connector, ConnectorConfig, ConnectorResult } from '@constraint-flow/core';

export interface MyConnectorConfig extends ConnectorConfig {
  apiKey: string;
  endpoint?: string;
}

export class MyConnector extends Connector {
  readonly name = 'my-connector';
  readonly version = '1.0.0';
  
  constructor(config: MyConnectorConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    // Initialize connection
  }

  async disconnect(): Promise<void> {
    // Cleanup connection
  }

  async execute<T>(operation: string, input: unknown): Promise<ConnectorResult<T>> {
    // Execute operation with constraint validation
    return {
      success: true,
      data: {} as T,
      constraints: {
        satisfied: true,
        details: []
      }
    };
  }
}
```

### Connector Requirements

1. **Constraint-aware**: Must validate constraints before/after execution
2. **Retryable**: Must support retry with backoff
3. **Observable**: Must emit events for monitoring
4. **Documented**: Must include JSDoc comments

## Adding New Integrations

Integrations combine multiple connectors into cohesive workflows.

### Integration Template

```typescript
import { Integration, Workflow } from '@constraint-flow/core';
import { SlackConnector, JiraConnector } from '@constraint-flow/connectors';

export class DevOpsIntegration extends Integration {
  readonly name = 'devops-alerting';
  readonly version = '1.0.0';

  async setup(): Promise<void> {
    this.addConnector('slack', new SlackConnector(this.config.slack));
    this.addConnector('jira', new JiraConnector(this.config.jira));
  }

  getWorkflows(): Workflow[] {
    return [
      this.createAlertWorkflow(),
      this.createIncidentWorkflow(),
    ];
  }

  private createAlertWorkflow(): Workflow {
    return {
      name: 'alert-on-failure',
      triggers: ['webhook', 'schedule'],
      steps: [
        { connector: 'jira', operation: 'createIssue' },
        { connector: 'slack', operation: 'sendMessage' }
      ],
      constraints: [
        { type: 'time', maxDuration: 5000 },
        { type: 'retry', maxAttempts: 3 }
      ]
    };
  }
}
```

## Pull Request Process

1. **Create a feature branch**: `git checkout -b feature/my-feature`
2. **Make your changes**: Follow the style guidelines
3. **Add tests**: All new code must have tests
4. **Update documentation**: Update README.md if needed
5. **Run the test suite**: `npm test`
6. **Commit changes**: Use conventional commits

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(connectors): add Salesforce connector`
- `fix(core): handle timeout in constraint validation`
- `docs(integrations): add ERP integration example`

## Style Guidelines

### TypeScript

- Use strict mode
- Prefer `interface` over `type` for object shapes
- Use `const` for constants, `readonly` where possible
- Document public APIs with JSDoc

### Code Structure

```
constraint-flow/
├── packages/
│   ├── core/           # Core engine
│   ├── connectors/     # Connector implementations
│   ├── integrations/   # Integration templates
│   └── cli/            # CLI tools*├── examples/           # Example workflows
└── docs/              # Documentation
```

## Getting Help

- 📖 [Documentation](https://constraint-flow.superinstance.ai)
- 💬 [Discussions](https://github.com/SuperInstance/constraint-flow/discussions)
- 🐛 [Issue Tracker](https://github.com/SuperInstance/constraint-flow/issues)

---

Thank you for contributing to Constraint-Flow! 🚀
