# Onboarding Guide: constraint-flow

**Repository:** https://github.com/SuperInstance/constraint-flow
**Language:** TypeScript
**Version:** 0.2.0
**Last Updated:** 2025-01-27

---

## Welcome to Constraint Flow

**Constraint Flow** is a business automation platform combining workflow orchestration, constraint-based validation, and exact arithmetic guarantees. It enables deterministic, verifiable business processes.

### What You'll Learn

1. Installation and setup
2. Creating workflows with constraints
3. Multi-agent task routing
4. Exact financial calculations
5. Integration with external systems

---

## Prerequisites

### Required

- **Node.js 18+**
- **npm** or **yarn** or **pnpm**
- **TypeScript 5.0+**

### Optional

- **Docker** (for connectors)
- **Redis** (for state management)

---

## Installation

```bash
# Clone repository
git clone https://github.com/SuperInstance/constraint-flow.git
cd constraint-flow

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

---

## Quick Start (5 Minutes)

### 1. Define a Workflow

```typescript
import { Workflow, Constraint, Step } from 'constraint-flow';

// Define a simple invoice approval workflow
const invoiceWorkflow = new Workflow({
  name: 'Invoice Approval',
  description: 'Process and approve invoices with constraints',
  
  steps: [
    {
      id: 'extract',
      agent: 'duck-api',
      action: 'extract_invoice_data',
      timeout: 30000,
    },
    {
      id: 'validate',
      agent: 'cattle-reasoning',
      action: 'validate_invoice',
      dependsOn: ['extract'],
    },
    {
      id: 'approve',
      agent: 'sheep-consensus',
      action: 'approve_if_consensus',
      dependsOn: ['validate'],
    },
  ],
  
  constraints: [
    // Business constraints
    Constraint.amountLimit(10000),          // Max $10,000
    Constraint.approvalRequiredAbove(5000), // 2 approvals for >$5,000
    Constraint.timeLimit(24 * 60 * 60 * 1000), // 24-hour SLA
    
    // Geometric constraints (exact)
    Constraint.balancedWorkload(),          // Distribute evenly
    Constraint.noCycles(),                  // Prevent circular deps
  ],
});
```

### 2. Execute the Workflow

```typescript
import { WorkflowEngine } from 'constraint-flow';

// Create engine
const engine = new WorkflowEngine({
  agents: {
    'duck-api': new DuckAgent(),
    'cattle-reasoning': new CattleAgent(),
    'sheep-consensus': new SheepAgent(),
  },
});

// Execute workflow
const result = await engine.execute(invoiceWorkflow, {
  invoiceId: 'INV-2024-001',
  amount: 7500,
  vendor: 'Acme Corp',
});

console.log(result.status);  // 'approved' | 'rejected' | 'pending'
console.log(result.trace);   // Full execution trace
```

### 3. Monitor Progress

```typescript
// Real-time monitoring
engine.on('step:start', (event) => {
  console.log(`Step ${event.stepId} started on ${event.agent}`);
});

engine.on('step:complete', (event) => {
  console.log(`Step ${event.stepId} completed in ${event.duration}ms`);
});

engine.on('constraint:violation', (event) => {
  console.warn(`Constraint violated: ${event.constraint}`);
});
```

---

## Core Concepts

### 1. Constraints

Constraints are the heart of Constraint Flow. They ensure workflows meet business requirements exactly.

```typescript
import { Constraint } from 'constraint-flow';

// Built-in constraint types
const constraints = [
  // Temporal constraints
  Constraint.timeLimit(3600000),       // 1 hour max
  Constraint.businessHours(),          // Only 9-5
  Constraint.weekdaysOnly(),           // No weekends
  
  // Value constraints
  Constraint.amountLimit(10000),
  Constraint.amountRange(100, 50000),
  Constraint.exactPrecision('cents'),  // Use exact arithmetic
  
  // Approval constraints
  Constraint.approvalRequired(),
  Constraint.multiApproval(2),         // 2 approvers needed
  Constraint.conditionalApproval({
    if: { amount: { '>': 5000 } },
    then: { approvals: 2 },
  }),
  
  // Geometric constraints
  Constraint.balancedWorkload(),
  Constraint.minParallelism(3),
  Constraint.maxLatency(5000),
];
```

### 2. Exact Arithmetic

Financial calculations use exact arithmetic to avoid floating-point errors.

```typescript
import { ExactNumber, ExactArithmetic } from 'constraint-flow';

// Create exact numbers
const a = ExactNumber.fromFloat(0.1);
const b = ExactNumber.fromFloat(0.2);

// Exact addition (no floating-point errors!)
const sum = a.add(b);
console.log(sum.toFloat());  // 0.3 (exact!)

// Batch operations
const payments = [0.1, 0.1, 0.1, 0.1, 0.1];
const total = ExactArithmetic.sum(payments);
console.log(total.toFloat());  // 0.5 (not 0.49999999999999994)

// Currency operations
const price = ExactNumber.fromCurrency('$12.34');
const tax = price.multiply(0.08);  // 8% tax
const total = price.add(tax);
console.log(total.toCurrency());  // '$13.33'
```

### 3. Geometric Routing

Task routing uses constraint satisfaction for deterministic agent selection.

```typescript
import { GeometricRouter, Intent } from 'constraint-flow';

const router = new GeometricRouter({
  agents: {
    'cattle-email': {
      capabilities: ['email', 'triage', 'reasoning'],
      capacity: 10,
      latency: 500,
    },
    'duck-api': {
      capabilities: ['api', 'network', 'fetch'],
      capacity: 100,
      latency: 50,
    },
    'goat-debug': {
      capabilities: ['debug', 'navigation', 'analysis'],
      capacity: 5,
      latency: 2000,
    },
  },
});

// Route an intent
const intent: Intent = {
  type: 'email',
  subtype: 'triage',
  priority: 'high',
  constraints: {
    responseTime: 1000,
    reasoning: true,
  },
};

const assignment = router.route(intent);
console.log(assignment.agent);  // 'cattle-email'
console.log(assignment.confidence);  // 0.95
console.log(assignment.explanation);  // Why this agent was selected
```

### 4. Holonomy Verification

Ensure workflows are globally consistent.

```typescript
import { HolonomyChecker } from 'constraint-flow';

const checker = new HolonomyChecker();

// Check workflow for cycles and inconsistencies
const issues = checker.verify(invoiceWorkflow);

if (issues.length === 0) {
  console.log('Workflow is globally consistent');
} else {
  for (const issue of issues) {
    console.error(`Issue: ${issue.type} at ${issue.location}`);
    console.error(`  ${issue.message}`);
  }
}
```

---

## Integration Examples

### Slack Integration

```typescript
import { SlackConnector } from 'constraint-flow/connectors/slack';

const slack = new SlackConnector({
  token: process.env.SLACK_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Use in workflow
const workflow = new Workflow({
  steps: [
    {
      id: 'notify',
      connector: slack,
      action: 'postMessage',
      params: {
        channel: '#approvals',
        text: 'New invoice requires approval',
      },
    },
    {
      id: 'collect-approval',
      connector: slack,
      action: 'waitForReaction',
      params: {
        channel: '#approvals',
        reactions: ['white_check_mark', 'x'],
        timeout: 3600000,
      },
    },
  ],
});
```

### GitHub Integration

```typescript
import { GitHubConnector } from 'constraint-flow/connectors/github';

const github = new GitHubConnector({
  token: process.env.GITHUB_TOKEN,
  owner: 'SuperInstance',
  repo: 'constraint-flow',
});

// Create PR approval workflow
const prWorkflow = new Workflow({
  steps: [
    {
      id: 'analyze',
      connector: github,
      action: 'analyzePR',
    },
    {
      id: 'require-review',
      connector: github,
      action: 'requestReview',
      params: { reviewers: ['team:core'] },
    },
    {
      id: 'merge-if-approved',
      connector: github,
      action: 'mergePR',
      condition: { approvals: { '>=': 2 } },
    },
  ],
});
```

### Jira Integration

```typescript
import { JiraConnector } from 'constraint-flow/connectors/jira';

const jira = new JiraConnector({
  host: 'company.atlassian.net',
  email: process.env.JIRA_EMAIL,
  apiToken: process.env.JIRA_TOKEN,
});

// Ticket management workflow
const ticketWorkflow = new Workflow({
  steps: [
    {
      id: 'create',
      connector: jira,
      action: 'createIssue',
      params: {
        project: 'PROJ',
        type: 'Task',
        summary: 'Process invoice',
      },
    },
    {
      id: 'transition',
      connector: jira,
      action: 'transition',
      params: { status: 'In Progress' },
    },
  ],
});
```

---

## Workflow Templates

### Incident Response

```typescript
import { incidentResponseTemplate } from 'constraint-flow/templates';

const incident = incidentResponseTemplate({
  severity: 'P1',
  team: 'platform',
  channels: ['#incidents', '#platform-ops'],
  
  constraints: [
    Constraint.timeLimit(15 * 60 * 1000),  // 15 min response
    Constraint.escalationPath(['oncall', 'manager', 'director']),
  ],
});
```

### Invoice Approval

```typescript
import { invoiceApprovalTemplate } from 'constraint-flow/templates';

const invoice = invoiceApprovalTemplate({
  company: 'Acme Corp',
  erp: 'sap',
  
  constraints: [
    Constraint.amountLimit(50000),
    Constraint.multiApproval(2),
    Constraint.exactPrecision('cents'),
  ],
});
```

### Content Review

```typescript
import { contentReviewTemplate } from 'constraint-flow/templates';

const content = contentReviewTemplate({
  platform: 'youtube',
  
  constraints: [
    Constraint.complianceCheck(['COPPA', 'GDPR']),
    Constraint.contentPolicy('community-guidelines'),
  ],
});
```

---

## API Reference

### Workflow

```typescript
class Workflow {
  constructor(config: WorkflowConfig);
  
  // Add steps
  addStep(step: StepConfig): void;
  removeStep(stepId: string): void;
  
  // Add constraints
  addConstraint(constraint: Constraint): void;
  
  // Validation
  validate(): ValidationResult;
  
  // Export
  toJSON(): object;
  static fromJSON(json: object): Workflow;
}
```

### WorkflowEngine

```typescript
class WorkflowEngine {
  constructor(config: EngineConfig);
  
  // Execute
  execute(workflow: Workflow, input: object): Promise<ExecutionResult>;
  executeAsync(workflow: Workflow, input: object): Promise<string>;  // Returns execution ID
  
  // Status
  getStatus(executionId: string): Promise<ExecutionStatus>;
  cancel(executionId: string): Promise<void>;
  
  // Events
  on(event: WorkflowEvent, handler: EventHandler): void;
}
```

### Constraint

```typescript
class Constraint {
  // Temporal
  static timeLimit(ms: number): Constraint;
  static businessHours(): Constraint;
  static weekdaysOnly(): Constraint;
  
  // Value
  static amountLimit(max: number): Constraint;
  static amountRange(min: number, max: number): Constraint;
  static exactPrecision(mode: 'cents' | 'micros'): Constraint;
  
  // Approval
  static approvalRequired(): Constraint;
  static multiApproval(count: number): Constraint;
  static conditionalApproval(config: ConditionalConfig): Constraint;
  
  // Geometric
  static balancedWorkload(): Constraint;
  static noCycles(): Constraint;
  static minParallelism(n: number): Constraint;
}
```

### ExactNumber

```typescript
class ExactNumber {
  // Creation
  static fromFloat(n: number): ExactNumber;
  static fromString(s: string): ExactNumber;
  static fromCurrency(s: string): ExactNumber;
  
  // Operations
  add(other: ExactNumber): ExactNumber;
  subtract(other: ExactNumber): ExactNumber;
  multiply(other: ExactNumber | number): ExactNumber;
  divide(other: ExactNumber | number): ExactNumber;
  
  // Output
  toFloat(): number;
  toString(): string;
  toCurrency(): string;
}
```

---

## Performance

### Benchmarks

| Operation | Time |
|-----------|------|
| Workflow validation | ~1ms |
| Constraint check | ~0.1ms |
| Exact sum (1000 values) | ~0.5ms |
| Geometric routing | ~2ms |
| Holonomy verification | ~5ms |

### Scalability

| Workflows | Memory | Latency |
|-----------|--------|---------|
| 100 | ~50MB | ~10ms |
| 1,000 | ~200MB | ~20ms |
| 10,000 | ~500MB | ~50ms |

---

## Examples

```bash
# Run examples
npm run example:simple-workflow
npm run example:multi-agent
npm run example:financial
npm run example:incident-response
```

---

## Resources

### Documentation

- [Workflow Patterns](./docs/WORKFLOW_PATTERNS.md)
- [Connectors](./docs/CONNECTORS.md)

### Related

- [constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core)
- [constraint-ranch](https://github.com/SuperInstance/constraint-ranch)

---

## License

MIT License - See [LICENSE](./LICENSE) for details.

---

## Next Steps

1. ✅ Install and build
2. ✅ Run the simple workflow example
3. 📖 Read the [Workflow Patterns](./docs/WORKFLOW_PATTERNS.md)
4. 🚀 Create your first workflow!

**Automate with confidence!** 🎉
