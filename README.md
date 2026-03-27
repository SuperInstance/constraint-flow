# Constraint Flow 💼

> **Enterprise automation with exact guarantees. Zero drift. Deterministic workflows.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/SuperInstance/constraint-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/SuperInstance/constraint-flow/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-constraint--flow.ai-blue)](https://docs.constraint-flow.ai)

🌐 **Platform:** [constraint-flow.superinstance.ai](https://constraint-flow.superinstance.ai)

---

## What Is This?

A **business automation platform** combining spreadsheet interface, multi-agent orchestration, and constraint-based workflow guarantees. Built on [Constraint Theory](https://github.com/SuperInstance/constraint-theory-core) for exact financial calculations and deterministic agent coordination.

---

## The Ah-Ha Moment

**Your financial spreadsheet:**
```
=0.1 + 0.2
Result: 0.30000000000000004  // Close enough for finance?
```

**Constraint Flow:**
```
=CT_ADD(0.1, 0.2)
Result: 0.3  // Exact. Forever. Auditable.
```

**$0.00000000000004 error × 1 billion transactions = $40,000 unaccounted.**

Constraint Flow eliminates an entire class of financial bugs.

---

## Quick Start (2 Minutes)

```bash
# Install CLI
npm install -g @constraint-flow/cli

# Create new workflow
constraint-flow init invoice-processing

# Start local server
cd invoice-processing && constraint-flow dev

# Open http://localhost:3000
# Your automation workspace awaits!
```

---

## Core Features

### 1. Exact Financial Calculations

```excel
# Traditional spreadsheets
=A1 * 1.1          // Floating-point errors accumulate
=SUM(B1:B10000)    // Cumulative rounding errors

# Constraint Flow
=CT_MUL(A1, 1.1)           // Exact multiplication
=CT_FINANCIAL_SUM(B1:B10000)  // Zero cumulative error
=CT_ROUND(value, "cents")  // Regulatory-compliant rounding
```

### 2. Constraint-Based Workflow Validation

```typescript
const workflow = defineWorkflow({
  name: "Invoice Processing",
  steps: [
    { agent: "cattle-extract", action: "extract_invoice_data" },
    { agent: "duck-validate", action: "validate_with_accounting" },
    { agent: "sheep-approve", action: "consensus_approval" }
  ],
  constraints: [
    { type: "amount_limit", max: 10000 },           // Invariant
    { type: "approval_required", when: { ">": 5000 } },  // Conditional
    { type: "sla", maxHours: 24 },                  // SLA
    { type: "audit_trail", required: true }         // Compliance
  ]
});

// Every step validated against constraints
// Invalid states impossible by construction
```

### 3. Multi-Agent Task Routing

```
┌─────────────────────────────────────────────────────┐
│              CONSTRAINT ROUTING ENGINE               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Incoming Task ────► Constraint Solver               │
│                           │                          │
│         ┌─────────────────┼─────────────────┐       │
│         │                 │                 │       │
│    📧 Email Tasks    🌐 API Tasks    📊 Data Tasks │
│         │                 │                 │       │
│         ▼                 ▼                 ▼       │
│    🐄 Cattle Agent   🦆 Duck Agent   🐴 Horse Agent│
│                                                      │
│  Deterministic routing: Same input → Same agent     │
│  Explainable decisions: Why this agent? Constraints │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 4. Spreadsheet as Workflow Dashboard

```
┌────────────────────────────────────────────────────────────────┐
│                    WORKFLOW CONTROL CENTER                      │
├─────────────┬──────────┬───────────────────┬───────────────────┤
│ Workflow    │ Status   │ Constraints       │ Agent Chain       │
├─────────────┼──────────┼───────────────────┼───────────────────┤
│ INV-00123   │ ✓ DONE   │ 3/3 satisfied     │ 🐄→🦆→🐑          │
│ INV-00124   │ ⏳ STEP 2 │ 2/3 satisfied     │ 🐄✓→🦆→🐑         │
│ INV-00125   │ ⚠ BLOCKED│ FAILED: amount    │ Requires approval │
│ API-SYNC-01 │ ✓ DONE   │ 4/4 satisfied     │ 🦆→🐴             │
│ REPORT-W15  │ 📅 QUEUED │ Pre-check OK      │ Scheduled 9AM     │
└─────────────┴──────────┴───────────────────┴───────────────────┘

Real-time updates │ Audit trail │ Compliance reports
```

---

## Business Use Cases

### 🏦 Financial Services

```typescript
// Invoice processing with exact amounts
const invoiceWorkflow = {
  steps: [
    { agent: "cattle-extract", action: "parse_invoice" },
    { agent: "sheep-validate", action: "three_way_match" },
    { agent: "cattle-approve", action: "approve_if_valid" }
  ],
  constraints: [
    { type: "exact_amount", precision: "cents" },
    { type: "three_way_match", required: true },
    { type: "approval_chain", minSignatures: 2 }
  ]
};

// Every cent accounted for. Audit-ready.
```

### 🏥 Healthcare

```typescript
// Patient data routing with privacy constraints
const patientWorkflow = {
  constraints: [
    { type: "hipaa_compliant", required: true },
    { type: "data_locality", region: "US" },
    { type: "access_log", immutable: true }
  ]
};

// Privacy constraints enforced. Zero data leakage.
```

### 🏭 Manufacturing

```typescript
// Supply chain coordination
const supplyChain = {
  constraints: [
    { type: "inventory_exact", precision: "units" },
    { type: "lead_time", maxDays: 30 },
    { type: "quality_threshold", minScore: 0.95 }
  ]
};

// Exact inventory counts. No floating-point discrepancies.
```

### ⚖️ Legal

```typescript
// Document review workflow
const legalReview = {
  constraints: [
    { type: "confidentiality", level: "attorney-client" },
    { type: "review_chain", immutable: true },
    { type: "deadline", hard: true }
  ]
};

// Every action logged. Compliance guaranteed.
```

---

## Technical Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     CONSTRAINT FLOW                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   USER INTERFACE                         │  │
│  │  Spreadsheet │ Workflow Builder │ Dashboard │ CLI       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 CONSTRAINT LAYER                         │  │
│  │                                                          │  │
│  │  • Exact Arithmetic (Constraint Theory)                  │  │
│  │  • Workflow Invariants                                   │  │
│  │  • Routing Constraints                                   │  │
│  │  • Compliance Rules                                      │  │
│  │                                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   AGENT LAYER                            │  │
│  │                                                          │  │
│  │  🐄 Reasoning │ 🦆 APIs │ 🐐 Debug │ 🐑 Consensus       │  │
│  │  🐴 Pipelines │ 🦅 Sync │ 🐔 Monitor │ 🐗 Hardware      │  │
│  │                                                          │  │
│  │  Orchestrated by Border Collie with geometric routing   │  │
│  │                                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    DATA LAYER                            │  │
│  │  Spreadsheet Engine │ CRDT Memory │ Exact Snapshots     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## API Reference

### Exact Arithmetic Functions

```typescript
// Basic operations
CT_ADD(a, b): ExactNumber
CT_SUB(a, b): ExactNumber
CT_MUL(a, b): ExactNumber
CT_DIV(a, b): ExactNumber

// Aggregations
CT_SUM(range): ExactNumber
CT_AVERAGE(range): ExactNumber
CT_FINANCIAL_SUM(range): ExactNumber  // No cumulative error

// Rounding
CT_ROUND(value, precision): ExactNumber
CT_ROUND_TO_CENTS(value): ExactNumber
CT_ROUND_TO_UNITS(value): ExactNumber
```

### Workflow Functions

```typescript
// Define workflow
defineWorkflow(config: WorkflowConfig): Workflow

// Validate step
validateStep(workflow, step): ValidationResult

// Get constraint status
getConstraintStatus(workflow): ConstraintStatus[]

// Route task
routeTask(task: Task): AgentAssignment
```

### Agent Functions

```typescript
// Query agent
AGENT_QUERY(agentId: string, query: string): any

// Get agent status
AGENT_STATUS(agentId: string): AgentStatus

// Route to best agent
AGENT_ROUTE(task: Task): AgentAssignment
```

---

## Deployment

### Self-Hosted

```bash
# Docker
docker run -d -p 3000:3000 constraint-flow/server

# Kubernetes
kubectl apply -f https://constraint-flow.ai/k8s.yaml

# Binary
constraint-flow server --port 3000
```

### Cloud

```bash
# Deploy to your cloud
constraint-flow deploy --provider=aws
constraint-flow deploy --provider=gcp
constraint-flow deploy --provider=azure
```

---

## Enterprise Features

| Feature | Startup | Enterprise |
|---------|---------|------------|
| Exact Arithmetic | ✅ | ✅ |
| Multi-Agent Routing | ✅ | ✅ |
| Workflow Builder | ✅ | ✅ |
| SSO/SAML | ❌ | ✅ |
| Audit Logs | 7 days | Forever |
| SLA Guarantee | 99% | 99.99% |
| Support | Community | Priority |
| Custom Agents | ❌ | ✅ |

---

## Ecosystem

| Repo | What It Does |
|------|--------------|
| **[constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core)** | Rust crate - exact arithmetic |
| **[constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python)** | Python bindings |
| **[constraint-ranch](https://github.com/SuperInstance/constraint-ranch)** | Gamified AI training |
| **[constraint-flow](https://github.com/SuperInstance/constraint-flow)** | This repo - Business automation |
| **[pasture-ai](https://github.com/SuperInstance/pasture-ai)** | Production agent system |

---

## Why Constraint Theory?

Traditional business automation has floating-point bugs:

```python
# Traditional
total = 0.0
for item in invoice_items:
    total += item.price * item.quantity
# total might be 1000.000000001 or 999.999999999

# After rounding
final_total = round(total, 2)  # Which way? Implementation-dependent
```

**Constraint Flow:**

```python
# Constraint Flow
total = CT_ZERO  # Exact zero
for item in invoice_items:
    total = CT_ADD(total, CT_MUL(item.price, item.quantity))
# total is EXACTLY correct. No rounding needed until display.
```

**Regulatory compliance requires exact arithmetic.**

---

## Contributing

Enterprise-grade contributions welcome:

- 🔌 **Integrations** - SAP, Salesforce, QuickBooks
- 🌐 **Connectors** - More data sources
- 📊 **Reports** - Compliance templates
- 🌍 **Translations** - Global business

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## License

MIT — see [LICENSE](LICENSE).

---

**Ready for exact automation? Let's flow! 💼**
