# Contributing to Constraint Flow

Thank you for your interest in contributing to Constraint Flow!

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/constraint-flow.git`
3. Install dependencies: `npm install`
4. Build the project: `npm run build`
5. Run tests: `npm test`

## Development Setup

### Prerequisites

- Node.js 18+ (20 recommended)
- npm 9+
- TypeScript 5+

### Installation

```bash
git clone https://github.com/SuperInstance/constraint-flow.git
cd constraint-flow
npm install
npm run build
```

## Making Changes

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or modifying tests

### Commit Messages

Follow conventional commits:

```
feat: add Salesforce connector
fix: handle timeout in constraint validation
docs: update API reference
test: add integration tests for workflow engine
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/workflow/tests/validation.test.ts
```

### Writing Tests

- Place tests in `tests/` directory alongside source files
- Name test files with `.test.ts` suffix
- Use descriptive test names
- Mock external services

## Pull Request Process

1. **Update Documentation**: Ensure README.md and JSDoc comments are updated
2. **Add Tests**: New features need tests
3. **Run Tests**: All tests must pass
4. **Check Examples**: Ensure example scripts still work
5. **Submit PR**: Use the PR template

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added and passing
- [ ] No new warnings introduced

## Style Guidelines

### TypeScript

- Use strict mode
- Prefer `interface` over `type` for object shapes
- Use `const` for constants, `readonly` where possible
- Document public APIs with JSDoc

```typescript
/**
 * Validates a workflow against all defined constraints.
 * 
 * @param workflow - The workflow to validate
 * @returns Validation result with any constraint violations
 */
export function validateWorkflow(workflow: Workflow): ValidationResult {
  // Implementation
}
```

### Code Structure

```
constraint-flow/
├── src/
│   ├── types/          # Type definitions
│   ├── workflow/       # Core workflow engine
│   └── index.ts        # Main exports
├── connectors/         # Connector implementations
├── templates/          # Workflow templates
├── examples/           # Example workflows
└── docs/               # Documentation
```

## Adding New Connectors

Connectors bridge Constraint Flow with external systems. See [docs/CONNECTORS.md](docs/CONNECTORS.md) for details.

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
  
  async connect(): Promise<void> { /* ... */ }
  async disconnect(): Promise<void> { /* ... */ }
  async execute<T>(operation: string, input: unknown): Promise<ConnectorResult<T>> { /* ... */ }
}
```

## Questions?

- Open a [Discussion](https://github.com/SuperInstance/constraint-flow/discussions)
- Check existing [Issues](https://github.com/SuperInstance/constraint-flow/issues)

Thank you for contributing!
