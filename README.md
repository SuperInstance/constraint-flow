# Constraint Flow 💼

> **Enterprise automation with exact guarantees. Zero drift. Deterministic workflows.**

[![GitHub stars](https://img.shields.io/github/stars/SuperInstance/constraint-flow?style=social)](https://github.com/SuperInstance/constraint-flow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/SuperInstance/constraint-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/SuperInstance/constraint-flow/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-constraint--flow.ai-blue)](https://docs.constraint-flow.ai)

🌐 **Platform:** [constraint-theory-web.pages.dev](https://constraint-theory-web.pages.dev)

---

## 💥 The $40,000 Bug You've Never Caught

```python
# Your financial spreadsheet:
total = 0.1 + 0.2
print(total)  # 0.30000000000000004

# At 1 billion transactions:
# $0.00000000000004 × 1,000,000,000 = $40,000 unaccounted
```

**Constraint Flow eliminates an entire class of financial bugs.**

---

## 🎯 What Is This?

A **business automation platform** combining spreadsheet interface, multi-agent orchestration, and constraint-based workflow guarantees. Built on [Constraint Theory](https://github.com/SuperInstance/constraint-theory-core) for exact financial calculations and deterministic agent coordination.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Traditional:  =A1 * 1.1          →  floating-point drift │
│   Constraint:   =CT_MUL(A1, 1.1)   →  EXACT. Forever.      │
│                                                             │
│   $0.00000000000004 error × 1B transactions = $40K gone    │
│                                                             │
│   Constraint Flow: Every cent accounted for. Audit-ready.  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (2 Minutes)

**Prerequisites:** Node.js 18+, npm 9+, Docker (optional)

```bash
# Install CLI globally
npm install -g @constraint-flow/cli

# Create new workflow project
constraint-flow init invoice-processing

# Start local development server
cd invoice-processing && constraint-flow dev

# Open http://localhost:3000
```

**Alternative: Use without global install**
```bash
# Using npx (no global install needed)
npx @constraint-flow/cli init invoice-processing
cd invoice-processing
npx constraint-flow dev
```

**Verify installation:**
```bash
constraint-flow doctor
# ✓ Node.js 18+ installed
# ✓ npm 9+ installed
# ✓ Docker available (optional)
# ✓ Ready to flow!
```

**Common Issues:**
```bash
# Port 3000 in use?
constraint-flow dev --port 3001

# Permission issues on macOS/Linux?
sudo npm install -g @constraint-flow/cli

# Node version too old?
nvm install 18
nvm use 18
```

---

## ✨ Core Features

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

---

## 💼 Business Use Cases

### 🧭 Decision Tree: Is This For You?

```
                    ┌─────────────────────────────────┐
                    │   Do you process financial data?│
                    └─────────────┬───────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
    ┌────▼────┐              ┌────▼────┐             ┌────▼────┐
    │ FINTECH │              │ HEALTH  │             │ MFG     │
    └────┬────┘              └────┬────┘             └────┬────┘
         │                        │                        │
         ▼                        ▼                        ▼
    ┌─────────┐             ┌──────────┐            ┌──────────┐
    │ ✓ Exact │             │ ✓ HIPAA  │            │ ✓ Supply │
    │ amounts │             │ audit    │            │ chain    │
    └─────────┘             └──────────┘            └──────────┘
```

### Financial Services

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

### Healthcare

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

### Manufacturing

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

---

## 🏗️ Technical Architecture

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

## 📋 API Reference

### Exact Arithmetic Functions

Constraint Flow uses exact arithmetic powered by [constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core) to eliminate floating-point errors in financial calculations.

```typescript
// Basic operations - no floating-point drift
CT_ADD(a, b): ExactNumber        // Exact addition: CT_ADD(0.1, 0.2) = 0.3 (exact!)
CT_SUB(a, b): ExactNumber        // Exact subtraction
CT_MUL(a, b): ExactNumber        // Exact multiplication: CT_MUL(0.1, 3) = 0.3 (exact!)
CT_DIV(a, b): ExactNumber        // Exact division with remainder tracking

// Aggregations - zero cumulative error
CT_SUM(range): ExactNumber       // Sum without accumulating errors
CT_AVERAGE(range): ExactNumber   // Precise average
CT_FINANCIAL_SUM(range): ExactNumber  // Regulatory-compliant sum

// Rounding - auditor-approved
CT_ROUND(value, precision): ExactNumber   // Round to specified precision
CT_ROUND_TO_CENTS(value): ExactNumber     // Round to 2 decimal places
CT_ROUND_TO_UNITS(value): ExactNumber     // Round to whole units
CT_ROUND_HALF_EVEN(value, precision): ExactNumber  // Banker's rounding
```

**Why this matters:**
```typescript
// Traditional JavaScript
const total = 0.1 + 0.2;  // 0.30000000000000004 ❌

// Constraint Flow exact arithmetic
const total = CT_ADD(0.1, 0.2);  // 0.3 EXACTLY ✓

// Large aggregations
const sum = CT_SUM([0.1, 0.1, 0.1, 0.1, 0.1]);  // 0.5 EXACTLY ✓
// vs JavaScript: 0.49999999999999994 ❌
```

### Constraint Types Reference

| Type | Description | Example |
|------|-------------|----------|
| `amount_limit` | Maximum value constraint | `{ type: 'amount_limit', max: 10000 }` |
| `amount_range` | Min/max value bounds | `{ type: 'amount_range', min: 100, max: 50000 }` |
| `exact_precision` | Force exact arithmetic | `{ type: 'exact_precision', precision: 'cents' }` |
| `time_limit` | SLA time constraint | `{ type: 'time_limit', maxHours: 24 }` |
| `business_hours` | Only execute 9-5 | `{ type: 'business_hours' }` |
| `weekdays_only` | No weekend execution | `{ type: 'weekdays_only' }` |
| `approval_required` | Always need approval | `{ type: 'approval_required' }` |
| `conditional_approval` | Approval based on condition | `{ type: 'conditional_approval', when: { '>': 5000 } }` |
| `multi_approval` | Multiple approvers needed | `{ type: 'multi_approval', count: 2 }` |
| `balanced_workload` | Distribute work evenly | `{ type: 'balanced_workload' }` |
| `no_cycles` | Prevent circular dependencies | `{ type: 'no_cycles' }` |
| `min_parallelism` | Minimum parallel tasks | `{ type: 'min_parallelism', n: 3 }` |
| `max_latency` | Maximum response time | `{ type: 'max_latency', ms: 5000 }` |
| `audit_trail` | Immutable audit log | `{ type: 'audit_trail', required: true }` |
| `hipaa_compliant` | HIPAA data handling | `{ type: 'hipaa_compliant', required: true }` |
| `data_locality` | Regional data storage | `{ type: 'data_locality', region: 'US' }` |

### Workflow Functions

```typescript
defineWorkflow(config: WorkflowConfig): Workflow
validateStep(workflow, step): ValidationResult
getConstraintStatus(workflow): ConstraintStatus[]
routeTask(task: Task): AgentAssignment
```

---

## 🚢 Deployment

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
constraint-flow deploy --provider=aws
constraint-flow deploy --provider=gcp
constraint-flow deploy --provider=azure
```

---

## 💼 Enterprise Features

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
| SOC 2 Compliance | ❌ | ✅ |
| HIPAA Compliance | ❌ | ✅ |

---

## 🌟 Ecosystem

| Repo | What It Does |
|------|--------------|
| **[constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core)** | Rust crate - exact arithmetic, Pythagorean snapping, deterministic geometry |
| **[constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python)** | Python bindings - PyTorch integration, ML quantization |
| **[constraint-ranch](https://github.com/SuperInstance/constraint-ranch)** | Gamified AI training - puzzle-based agent coordination |
| **[constraint-flow](https://github.com/SuperInstance/constraint-flow)** | This repo - Enterprise workflow automation with exact guarantees |
| **[constraint-theory-web](https://github.com/SuperInstance/constraint-theory-web)** | Interactive demos - 49 visual experiments |
| **[constraint-theory-research](https://github.com/SuperInstance/constraint-theory-research)** | Research papers - mathematical foundations |

### Ecosystem Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONSTRAINT ECOSYSTEM INTEGRATION                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  constraint-theory-core (Rust)                                           │
│       │                                                                  │
│       │ Exact arithmetic, Pythagorean snapping, holonomy checking       │
│       ▼                                                                  │
│  constraint-theory-python ◄───► constraint-flow                          │
│       │                            │                                     │
│       │ PyTorch integration        │ TypeScript workflows                │
│       │ ML quantization            │ Business automation                 │
│       ▼                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                    constraint-ranch                          │        │
│  │         Gamified training for constraint-aware agents        │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Quick Reference

| What You Need | Where to Go |
|---------------|-------------|
| Exact arithmetic | `CT_ADD()`, `CT_SUM()` from constraint-theory-core |
| Agent training | [constraint-ranch](https://github.com/SuperInstance/constraint-ranch) |
| ML integration | [constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python) |
| Workflow patterns | [WORKFLOW_PATTERNS.md](docs/WORKFLOW_PATTERNS.md) |
| Enterprise features | [ENTERPRISE.md](docs/ENTERPRISE.md) |
| Ecosystem guide | [ECOSYSTEM.md](docs/ECOSYSTEM.md) |

### Integration Examples

**Using constraint-theory-core from Constraint Flow:**
```typescript
import { PythagoreanManifold, snap } from '@constraint-flow/core';

// These are powered by constraint-theory-core under the hood
const manifold = new PythagoreanManifold(200);
const [exact, noise] = manifold.snap([0.577, 0.816]);
// exact = [0.6, 0.8] = (3/5, 4/5) - EXACT PYTHAGOREAN TRIPLE
```

---

## 🤝 Contributing

**[Good First Issues](https://github.com/SuperInstance/constraint-flow/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)** · **[CONTRIBUTING.md](CONTRIBUTING.md)** · **[ONBOARDING.md](ONBOARDING.md)**

Enterprise-grade contributions welcome:

- 🔌 **Integrations** - SAP, Salesforce, QuickBooks
- 🌐 **Connectors** - More data sources
- 📊 **Reports** - Compliance templates
- 🌍 **Translations** - Global business
- 🧪 **Test Coverage** - Edge cases, integration tests
- 📚 **Documentation** - Tutorials, API reference

### Development Setup

```bash
git clone https://github.com/SuperInstance/constraint-flow.git
cd constraint-flow
npm install
npm run build
npm test
```

---

## 📜 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

**Regulatory compliance requires exact arithmetic.**

**[Star this repo](https://github.com/SuperInstance/constraint-flow)** · **[Try the platform](https://constraint-theory-web.pages.dev)** · **[Read the docs](https://docs.constraint-flow.ai)**

</div>
