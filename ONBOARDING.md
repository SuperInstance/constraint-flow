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
  // ========================================
  // TEMPORAL CONSTRAINTS
  // ========================================
  Constraint.timeLimit(3600000),       // 1 hour max
  Constraint.businessHours(),          // Only 9-5
  Constraint.weekdaysOnly(),           // No weekends
  Constraint.sla({                     // SLA with escalation
    responseTime: { critical: 15, high: 60, medium: 240, low: 1440 },
    onBreach: { notify: ['#ops'], escalate: true }
  }),
  
  // ========================================
  // VALUE CONSTRAINTS
  // ========================================
  Constraint.amountLimit(10000),       // Max $10,000
  Constraint.amountRange(100, 50000),  // Min $100, max $50,000
  Constraint.exactPrecision('cents'),  // Use exact arithmetic
  Constraint.categoryValidation({      // Validate against allowed values
    field: 'input.category',
    allowed: ['travel', 'meals', 'equipment', 'software']
  }),
  
  // ========================================
  // APPROVAL CONSTRAINTS
  // ========================================
  Constraint.approvalRequired(),       // Always need approval
  Constraint.multiApproval(2),         // 2 approvers needed
  Constraint.conditionalApproval({
    if: { amount: { '>': 5000 } },
    then: { approvals: 2 },
    escalateAfter: '24h'
  }),
  Constraint.escalationPath(['oncall', 'manager', 'director']),
  
  // ========================================
  // GEOMETRIC CONSTRAINTS (from constraint-theory-core)
  // ========================================
  Constraint.balancedWorkload(),       // Distribute work evenly
  Constraint.noCycles(),               // Prevent circular dependencies
  Constraint.minParallelism(3),        // Minimum 3 parallel tasks
  Constraint.maxLatency(5000),         // Max 5 second response time
  
  // ========================================
  // COMPLIANCE CONSTRAINTS
  // ========================================
  Constraint.auditTrail({              // Immutable audit log
    required: true,
    retentionDays: 2555               // 7 years (SOX requirement)
  }),
  Constraint.hipaaCompliant(),        // HIPAA data handling
  Constraint.dataLocality('US'),       // Regional data storage
  Constraint.complianceCheck(['COPPA', 'GDPR']),
];
```

#### Constraint Categories

| Category | Types | Use Case |
|----------|-------|----------|
| **Temporal** | `time_limit`, `business_hours`, `weekdays_only`, `sla` | SLA enforcement, scheduling |
| **Value** | `amount_limit`, `amount_range`, `exact_precision`, `category_validation` | Financial bounds, data validation |
| **Approval** | `approval_required`, `multi_approval`, `conditional_approval`, `escalation_path` | Authorization workflows |
| **Geometric** | `balanced_workload`, `no_cycles`, `min_parallelism`, `max_latency` | Agent coordination, routing |
| **Compliance** | `audit_trail`, `hipaa_compliant`, `data_locality`, `compliance_check` | Regulatory requirements |


### 2. Exact Arithmetic

Financial calculations use exact arithmetic to avoid floating-point errors. This is powered by [constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core) for deterministic, cross-platform results.

```typescript
import { ExactNumber, ExactArithmetic } from 'constraint-flow';

// Create exact numbers
const a = ExactNumber.fromFloat(0.1);
const b = ExactNumber.fromFloat(0.2);

// Exact addition (no floating-point errors!)
const sum = a.add(b);
console.log(sum.toFloat());  // 0.3 (exact!)

// Compare with traditional JavaScript:
// 0.1 + 0.2 = 0.30000000000000004 ❌
// ExactNumber.add(0.1, 0.2) = 0.3 ✓

// Batch operations - no cumulative error
const payments = [0.1, 0.1, 0.1, 0.1, 0.1];
const total = ExactArithmetic.sum(payments);
console.log(total.toFloat());  // 0.5 (not 0.49999999999999994)

// Currency operations
const price = ExactNumber.fromCurrency('$12.34');
const tax = price.multiply(0.08);  // 8% tax
const total = price.add(tax);
console.log(total.toCurrency());  // '$13.33'

// Regulatory-compliant rounding
const rounded = ExactNumber.roundToCents(123.4567);  // 123.46
const bankerRounding = ExactNumber.roundHalfEven(123.455, 2);  // 123.46 (banker's rounding)
```

#### Why Exact Arithmetic Matters

```
┌─────────────────────────────────────────────────────────────┐
│                    THE FLOATING-POINT PROBLEM                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Traditional JavaScript:                                      │
│  0.1 + 0.2 = 0.30000000000000004                              │
│                                                               │
│  At scale:                                                    │
│  $0.00000000000004 × 1,000,000,000 transactions = $40,000    │
│                                                               │
│  Constraint Flow:                                             │
│  CT_ADD(0.1, 0.2) = 0.3 EXACTLY                               │
│                                                               │
│  Every cent accounted for. Audit-ready.                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Underlying Technology

The exact arithmetic system is built on [constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core)'s Pythagorean geometry:

- **Rational number representation** - All values stored as exact fractions
- **Pythagorean triples** - Directions encoded as integer ratios (3/5, 4/5)
- **Zero drift** - Same result on every machine, every time
- **O(log n) lookup** - Fast KD-tree based snapping

Read more: [constraint-theory-core documentation](https://github.com/SuperInstance/constraint-theory-core#readme)

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

## Multi-Agent Coordination Patterns

Constraint Flow's agent coordination is powered by geometric routing algorithms from [constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core). This enables deterministic, explainable agent selection.

### Agent Types

Constraint Flow uses a "farm animal" taxonomy for different agent capabilities:

| Agent | Capabilities | Use Case |
|-------|--------------|----------|
| **Cattle** | Reasoning, extraction, classification | Bulk processing, content analysis |
| **Duck** | APIs, HTTP, network calls | External integrations, webhooks |
| **Sheep** | Consensus, voting, aggregation | Multi-party approvals, voting |
| **Goat** | Debugging, analysis, forensics | Error investigation, root cause |
| **Horse** | Pipelines, ETL, data flow | Data transformation, batch jobs |
| **Eagle** | Sync, coordination, oversight | Master orchestration, monitoring |
| **Chicken** | Monitoring, alerts, observability | Health checks, notifications |
| **Hog** | Hardware, GPU, compute | ML inference, heavy computation |

### Geometric Routing

Agent selection uses constraint satisfaction based on geometric properties:

```typescript
import { GeometricRouter, AgentCapabilities } from 'constraint-flow';

const router = new GeometricRouter({
  agents: [
    {
      name: 'cattle-email',
      capabilities: ['email', 'triage', 'reasoning'],
      capacity: 10,
      latency: 500,
      cost: 0.001,
    },
    {
      name: 'duck-api',
      capabilities: ['api', 'network', 'fetch'],
      capacity: 100,
      latency: 50,
      cost: 0.0001,
    },
  ],
});

// The router uses KD-tree based spatial indexing (from constraint-theory-core)
// to find optimal agent assignments in O(log n) time
const assignment = router.route({
  type: 'email',
  subtype: 'triage',
  constraints: { responseTime: 1000 },
});

console.log(assignment.agent);      // 'cattle-email'
console.log(assignment.confidence); // 0.95
console.log(assignment.explanation); // 'Selected based on capability match (email, triage) and latency constraint'
```

### Coordination Patterns

#### 1. Master-Worker (Border Collie Pattern)

```typescript
const masterWorkerWorkflow = defineWorkflow({
  name: 'master-worker-coordination',
  
  orchestration: {
    strategy: 'master-worker',
    masterAgent: 'eagle-coordinator',
    workerPool: ['cattle-processor-1', 'cattle-processor-2', 'cattle-processor-3'],
    loadBalancing: 'least-loaded',
    maxConcurrentPerWorker: 5,
  },
  
  steps: [
    {
      id: 'distribute-work',
      agent: 'eagle-coordinator',
      action: 'partition',
      input: { data: '${input.items}', strategy: 'equal-shares' },
    },
    {
      id: 'process-parallel',
      type: 'parallel',
      branches: '${distribute-work.partitions.map((p, i) => ({
        agent: `cattle-processor-${i % 3}`,
        input: { partition: p },
      }))}',
    },
    {
      id: 'aggregate-results',
      agent: 'sheep-aggregator',
      action: 'consensus',
      input: { results: '${process-parallel.results}' },
    },
  ],
});
```

#### 2. Pipeline Pattern

```typescript
const pipelineWorkflow = defineWorkflow({
  name: 'data-pipeline',
  
  orchestration: {
    strategy: 'pipeline',
    stages: [
      { agent: 'duck-fetcher', stage: 'extract' },
      { agent: 'horse-transformer', stage: 'transform' },
      { agent: 'cattle-validator', stage: 'validate' },
      { agent: 'duck-loader', stage: 'load' },
    ],
    backpressure: {
      maxQueueSize: 1000,
      strategy: 'block',
    },
  },
});
```

#### 3. Consensus Pattern

```typescript
const consensusWorkflow = defineWorkflow({
  name: 'multi-party-approval',
  
  orchestration: {
    strategy: 'consensus',
    requiredQuorum: 0.6,  // 60% must agree
    timeout: 3600000,     // 1 hour
    agents: [
      'sheep-voter-1',
      'sheep-voter-2',
      'sheep-voter-3',
      'sheep-voter-4',
      'sheep-voter-5',
    ],
  },
  
  steps: [
    {
      id: 'collect-votes',
      type: 'parallel',
      branches: [
        { agent: 'sheep-voter-1', action: 'vote' },
        { agent: 'sheep-voter-2', action: 'vote' },
        { agent: 'sheep-voter-3', action: 'vote' },
        { agent: 'sheep-voter-4', action: 'vote' },
        { agent: 'sheep-voter-5', action: 'vote' },
      ],
    },
    {
      id: 'tally-votes',
      agent: 'sheep-aggregator',
      action: 'consensus',
      input: { votes: '${collect-votes.results}' },
    },
  ],
});
```

### Integration with constraint-ranch

For training agents on constraint-aware tasks, use [constraint-ranch](https://github.com/SuperInstance/constraint-ranch):

```typescript
import { RanchTrainer, PuzzleLoader } from 'constraint-ranch';
import { GeometricRouter } from 'constraint-flow';

// Load spatial puzzles from constraint-ranch
const trainer = new RanchTrainer({
  puzzles: PuzzleLoader.loadSpatial(),
  router: new GeometricRouter(/* ... */),
});

// Train agents on coordination tasks
const trainedAgents = await trainer.train({
  episodes: 10000,
  rewardFunction: 'constraint-satisfaction',
});

// Use trained agents in production
const workflow = defineWorkflow({
  agents: trainedAgents,
  // ...
});
```

---

## Research Foundations

Constraint Flow builds on decades of research in constraint satisfaction, geometric algebra, and multi-agent systems. Key references:

### Constraint Satisfaction

- **Dechter, R. (2003).** "Constraint Processing" - Foundational CSP algorithms
- **Mackworth, A. K. (1977).** "Consistency in Networks of Relations" - Arc consistency
- **Rossi, F., et al. (2006).** "Handbook of Constraint Programming" - Modern CSP techniques

### Geometric Algebra

- **Hestenes, D. (1966).** "Space-Time Algebra" - Geometric algebra foundations
- **Dorst, L., et al. (2007).** "Geometric Algebra for Computer Science" - Practical applications

### Spatial Indexing

- **Bentley, J. L. (1975).** "Multidimensional Binary Search Trees" - KD-tree foundations
- **Guttman, A. (1984).** "R-Trees: A Dynamic Index Structure" - Spatial data structures

### Agent-Based Systems

- **Wooldridge, M. & Jennings, N. R. (1995).** "Intelligent Agents: Theory and Practice" - Agent architectures
- **Bonabeau, E. (2002).** "Agent-Based Modeling" - Multi-agent coordination

For a complete bibliography, see [constraint-theory-research Research Papers](https://github.com/SuperInstance/constraint-theory-research/blob/main/guides/RESEARCH_PAPERS.md).

---

## Resources

### Documentation

- [Workflow Patterns](./docs/WORKFLOW_PATTERNS.md)
- [Connectors](./docs/CONNECTORS.md)

### Related

- [constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core) - Exact arithmetic and geometric routing
- [constraint-ranch](https://github.com/SuperInstance/constraint-ranch) - Agent training puzzles
- [constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python) - Python bindings
- [constraint-theory-research](https://github.com/SuperInstance/constraint-theory-research) - Research papers

---

## Troubleshooting

### Common Issues

#### 1. Floating-Point Precision Errors

**Problem:** Calculations produce unexpected results like `0.30000000000000004`.

**Solution:** Use Constraint Flow's exact arithmetic functions:
```typescript
// Instead of:
const total = 0.1 + 0.2;  // 0.30000000000000004

// Use:
import { CT_ADD } from 'constraint-flow';
const total = CT_ADD(0.1, 0.2);  // 0.3 (exact!)
```

#### 2. Constraint Violation Not Caught

**Problem:** Constraints are not being enforced.

**Solution:** Ensure constraints are defined at the workflow level:
```typescript
const workflow = defineWorkflow({
  name: 'my-workflow',
  constraints: [
    { type: 'amount_limit', max: 10000 }  // Define here
  ],
  steps: [/* ... */]
});
```

#### 3. Agent Not Found

**Problem:** Error "Agent 'cattle-email' not found".

**Solution:** Register agents with the engine:
```typescript
const engine = new WorkflowEngine({
  agents: {
    'cattle-email': new CattleAgent(),  // Register here
    'duck-api': new DuckAgent(),
  },
});
```

#### 4. Timeout Errors

**Problem:** Workflows timing out unexpectedly.

**Solution:** Increase timeout or add time constraints:
```typescript
const workflow = defineWorkflow({
  constraints: [
    Constraint.timeLimit(300000),  // 5 minutes
  ],
  // ...
});

// Or at the step level:
steps: [
  {
    id: 'slow-operation',
    timeout: 60000,  // 1 minute for this step
  }
]
```

#### 5. Circular Dependency Detected

**Problem:** Error "Workflow contains circular dependencies".

**Solution:** Check step `dependsOn` chains:
```typescript
// Bad - circular dependency
steps: [
  { id: 'a', dependsOn: ['b'] },
  { id: 'b', dependsOn: ['c'] },
  { id: 'c', dependsOn: ['a'] },  // Creates cycle
]

// Good - no cycles
steps: [
  { id: 'a' },
  { id: 'b', dependsOn: ['a'] },
  { id: 'c', dependsOn: ['b'] },
]
```

#### 6. Connector Authentication Failed

**Problem:** "Authentication failed" for Slack/Jira/GitHub.

**Solution:** Check environment variables:
```bash
# Slack
export SLACK_TOKEN="xoxb-your-token"
export SLACK_SIGNING_SECRET="your-secret"

# GitHub
export GITHUB_TOKEN="ghp-your-token"

# Jira
export JIRA_EMAIL="your-email@example.com"
export JIRA_TOKEN="your-api-token"
```

#### 7. Port Already in Use

**Problem:** "Port 3000 is already in use".

**Solution:** Use a different port:
```bash
constraint-flow dev --port 3001
```

#### 8. TypeScript Compilation Errors

**Problem:** TypeScript errors in workflow definitions.

**Solution:** Ensure correct types:
```typescript
// Check TypeScript version
npm list typescript  // Should be 5.0+

// Import types correctly
import type { Workflow, Constraint, Step } from 'constraint-flow';
```

### Debugging Tips

#### Enable Verbose Logging

```typescript
import { setLogLevel } from 'constraint-flow';

setLogLevel('debug');  // Enable debug logging

// Or in environment
process.env.CONSTRAINT_FLOW_LOG = 'debug';
```

#### Inspect Workflow State

```typescript
const engine = new WorkflowEngine(/* ... */);

// Get execution status
const status = await engine.getStatus(executionId);
console.log('Current step:', status.currentStep);
console.log('Completed steps:', status.completedSteps);
console.log('Constraint status:', status.constraints);
```

#### Test Constraints Independently

```typescript
import { WorkflowValidator } from 'constraint-flow';

const validator = new WorkflowValidator(workflow);
const result = validator.validateConstraints(input);

if (!result.valid) {
  console.log('Violations:', result.violations);
}
```

---

## Version Compatibility

### Supported Versions

| Constraint Flow | Node.js | TypeScript | constraint-theory-core |
|-----------------|---------|------------|------------------------|
| 0.2.x | 18.x, 20.x, 22.x | 5.0+ | 0.6.x |
| 0.1.x | 18.x, 20.x | 5.0+ | 0.5.x |

### Breaking Changes

#### v0.2.0

- Changed `ExactNumber.from()` to `ExactNumber.fromFloat()`
- Renamed `Constraint.timeLimit()` parameter from `ms` to `milliseconds`
- Added required `version` field to workflow definitions

#### v0.1.0

- Initial release

### Upgrade Guide

```bash
# Upgrade to latest
npm update constraint-flow

# Or install specific version
npm install constraint-flow@0.2.0
```

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
