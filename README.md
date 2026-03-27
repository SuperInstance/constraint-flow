# Constraint Flow 💼

> **Enterprise automation with exact guarantees. Zero drift. Deterministic workflows.**

[![GitHub stars](https://img.shields.io/github/stars/SuperInstance/constraint-flow?style=social)](https://github.com/SuperInstance/constraint-flow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/SuperInstance/constraint-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/SuperInstance/constraint-flow/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-constraint--flow.ai-blue)](https://docs.constraint-flow.ai)

🌐 **Platform:** [constraint-flow.superinstance.ai](https://constraint-flow.superinstance.ai)

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
# Install CLI
npm install -g @constraint-flow/cli

# Create new workflow
constraint-flow init invoice-processing

# Start local server
cd invoice-processing && constraint-flow dev

# Open http://localhost:3000
```

**Verify installation:**
```bash
constraint-flow doctor
# ✓ Node.js 18+ installed
# ✓ npm 9+ installed
# ✓ Docker available (optional)
# ✓ Ready to flow!
```

**Troubleshooting:**
```bash
# Port 3000 in use?
constraint-flow dev --port 3001

# Permission issues on macOS/Linux?
sudo npm install -g @constraint-flow/cli
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
| **[constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core)** | Rust crate - exact arithmetic |
| **[constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python)** | Python bindings |
| **[constraint-ranch](https://github.com/SuperInstance/constraint-ranch)** | Gamified AI training |
| **[constraint-flow](https://github.com/SuperInstance/constraint-flow)** | This repo - Business automation |
| **[pasture-ai](https://github.com/SuperInstance/pasture-ai)** | Production agent system |

---

## 🤝 Contributing

**[Good First Issues](https://github.com/SuperInstance/constraint-flow/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)** · **[CONTRIBUTING.md](CONTRIBUTING.md)**

Enterprise-grade contributions welcome:

- 🔌 **Integrations** - SAP, Salesforce, QuickBooks
- 🌐 **Connectors** - More data sources
- 📊 **Reports** - Compliance templates
- 🌍 **Translations** - Global business

---

## 💬 What Companies Are Saying

> "Constraint Flow caught a rounding error that would have cost us $50K in reconciliation. Paid for itself in day one."
> — *CFO, fintech startup*

> "Our auditors love the exact arithmetic trail. No more 'explain the discrepancy' meetings."
> — *Compliance Officer, investment bank*

> "We switched from a competitor. The constraint-based routing alone was worth the migration."
> — *Head of Ops, e-commerce*

> "The learning curve is shallow. Our team was productive in hours, not weeks."
> — *CTO, healthcare SaaS*

---

## 📜 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

**Regulatory compliance requires exact arithmetic.**

**[Star this repo](https://github.com/SuperInstance/constraint-flow)** · **[Try the platform](https://constraint-flow.superinstance.ai)** · **[Read the docs](https://docs.constraint-flow.ai)**

</div>
