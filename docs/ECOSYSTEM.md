# Ecosystem Integration Guide

This document provides a comprehensive overview of the Constraint Theory ecosystem and how to integrate all components together.

## Table of Contents

- [Ecosystem Overview](#ecosystem-overview)
- [Component Relationships](#component-relationships)
- [Cross-Repo Integration Examples](#cross-repo-integration-examples)
- [Unified Quick Reference](#unified-quick-reference)
- [Getting Started Paths](#getting-started-paths)

---

## Ecosystem Overview

The Constraint Theory ecosystem consists of interconnected libraries and platforms that work together to provide exact computation, agent coordination, and workflow automation.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONSTRAINT THEORY ECOSYSTEM                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    FOUNDATION LAYER                               │   │
│  │                                                                   │   │
│  │  ┌─────────────────────┐                                        │   │
│  │  │ constraint-theory-  │  Rust crate                            │   │
│  │  │ core                │  • Exact arithmetic                    │   │
│  │  │                     │  • Pythagorean geometry                │   │
│  │  │                     │  • Holonomy checking                   │   │
│  │  │                     │  • KD-tree spatial indexing            │   │
│  │  └─────────────────────┘                                        │   │
│  │            │                                                      │   │
│  │            │ WASM / FFI                                          │   │
│  │            ▼                                                      │   │
│  │  ┌─────────────────────┐     ┌─────────────────────┐           │   │
│  │  │ constraint-theory-  │     │ constraint-flow     │           │   │
│  │  │ python              │     │                     │           │   │
│  │  │                     │     │ TypeScript          │           │   │
│  │  │ Python bindings     │     │ • Workflow engine   │           │   │
│  │  │ • PyTorch hooks     │     │ • Multi-agent       │           │   │
│  │  │ • ML quantization   │     │ • Connectors        │           │   │
│  │  │ • NumPy integration │     │ • Exact arithmetic  │           │   │
│  │  └─────────────────────┘     └─────────────────────┘           │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    APPLICATION LAYER                              │   │
│  │                                                                   │   │
│  │  ┌─────────────────────┐     ┌─────────────────────┐           │   │
│  │  │ constraint-ranch    │     │ constraint-theory-  │           │   │
│  │  │                     │     │ web                 │           │   │
│  │  │ Gamified Training   │     │                     │           │   │
│  │  │ • Puzzle engine     │     │ Interactive demos   │           │   │
│  │  │ • Breeding arena    │     │ • 49 experiments    │           │   │
│  │  │ • Score tracking    │     │ • Visualizations    │           │   │
│  │  └─────────────────────┘     └─────────────────────┘           │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    RESEARCH LAYER                                 │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ constraint-theory-research                               │   │   │
│  │  │                                                           │   │   │
│  │  │ • Mathematical foundations                               │   │   │
│  │  │ • Research papers                                        │   │   │
│  │  │ • Algorithm proofs                                       │   │   │
│  │  │ • Bibliography                                           │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Repository Links

| Repository | URL | Purpose |
|------------|-----|---------|
| **constraint-theory-core** | [github.com/SuperInstance/constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core) | Rust foundation |
| **constraint-theory-python** | [github.com/SuperInstance/constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python) | Python bindings |
| **constraint-flow** | [github.com/SuperInstance/constraint-flow](https://github.com/SuperInstance/constraint-flow) | Workflow automation |
| **constraint-ranch** | [github.com/SuperInstance/constraint-ranch](https://github.com/SuperInstance/constraint-ranch) | Agent training |
| **constraint-theory-web** | [github.com/SuperInstance/constraint-theory-web](https://github.com/SuperInstance/constraint-theory-web) | Interactive demos |
| **constraint-theory-research** | [github.com/SuperInstance/constraint-theory-research](https://github.com/SuperInstance/constraint-theory-research) | Research papers |

---

## Component Relationships

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW BETWEEN COMPONENTS                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  constraint-theory-core (Rust)                                          │
│       │                                                                  │
│       │ Exact arithmetic results, geometric calculations                │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────┐                      │
│  │                                              │                       │
│  │  constraint-theory-python    constraint-flow │                      │
│  │         │                         │          │                       │
│  │         │ ML models              │ Workflows │                       │
│  │         ▼                         ▼          │                       │
│  │  ┌─────────────┐           ┌─────────────┐  │                       │
│  │  │ Trained     │──────────▶│ Production  │  │                       │
│  │  │ Agents      │           │ Agents      │  │                       │
│  │  └─────────────┘           └─────────────┘  │                       │
│  │         ▲                         │          │                       │
│  │         │                         │          │                       │
│  │  constraint-ranch            Execution     │                       │
│  │         │                    Metrics        │                       │
│  │         │                                   │                       │
│  │         ▼                                   │                       │
│  │  ┌─────────────┐                           │                       │
│  │  │ Puzzle      │◀──────── Feedback ────────┘                       │
│  │  │ Generation  │                                                    │
│  │  └─────────────┘                                                    │
│  │                                              │                       │
│  └──────────────────────────────────────────────┘                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### API Contracts

#### constraint-theory-core → constraint-flow

```typescript
// WASM exports used by constraint-flow
interface CoreAPI {
  // Exact arithmetic
  ct_add(a: number, b: number): ExactResult;
  ct_sub(a: number, b: number): ExactResult;
  ct_mul(a: number, b: number): ExactResult;
  ct_div(a: number, b: number): ExactResult;
  ct_sum(values: number[]): ExactResult;
  
  // Geometric routing
  snap_to_manifold(point: [number, number], manifoldSize: number): SnapResult;
  find_nearest_direction(point: [number, number]): DirectionResult;
  
  // Holonomy
  check_holonomy(workflow: WorkflowGraph): HolonomyResult;
}

interface ExactResult {
  numerator: bigint;
  denominator: bigint;
  float: number;
  exact: boolean;
}
```

#### constraint-ranch → constraint-flow

```typescript
// Training exports used by constraint-flow
interface RanchAPI {
  // Agent export
  export_trained_agent(config: ExportConfig): TrainedAgent;
  
  // Score sync
  get_agent_scores(): AgentScore[];
  
  // Strategy export
  export_strategies(config: StrategyExportConfig): Strategy[];
}

interface TrainedAgent {
  id: string;
  type: AgentType;
  weights: ArrayBuffer;
  scores: AgentScore;
  metadata: TrainingMetadata;
}
```

#### constraint-theory-python → constraint-flow

```typescript
// ML integration exports
interface PythonAPI {
  // Model quantization
  quantize_model(model: ArrayBuffer, precision: Precision): QuantizedModel;
  
  // Feature extraction
  extract_features(data: unknown[]): Features;
  
  // Inference
  run_inference(model: QuantizedModel, input: Features): InferenceResult;
}
```

---

## Cross-Repo Integration Examples

### Example 1: Full-Stack Financial Workflow

This example shows how all ecosystem components work together for a financial workflow.

```typescript
// 1. constraint-flow: Define the workflow
import { defineWorkflow, CT_SUM, CT_ROUND } from '@constraint-flow/core';
import { GeometricRouter } from '@constraint-flow/ranch-bridge';

const invoiceWorkflow = defineWorkflow({
  name: 'invoice-processing',
  
  constraints: [
    { type: 'exact_precision', precision: 'cents' },
    { type: 'amount_limit', max: 100000 },
    { type: 'audit_trail', required: true },
  ],
  
  steps: [
    // 2. constraint-ranch: Use trained agent for extraction
    {
      id: 'extract-invoice',
      agent: 'cattle-invoice-extractor',  // Trained in constraint-ranch
      action: 'extract',
      input: { document: '${input.document}' },
    },
    
    // 3. constraint-theory-core: Exact arithmetic
    {
      id: 'calculate-totals',
      action: 'calculate',
      input: {
        lineItems: '${steps.extract-invoice.result.lineItems}',
        taxRate: '${input.taxRate}',
      },
      operations: {
        subtotal: () => CT_SUM('${lineItems.map(i => i.amount)}'),
        tax: () => CT_MUL('${subtotal}', '${taxRate}'),
        total: () => CT_SUM(['${subtotal}', '${tax}']),
        rounded: () => CT_ROUND('${total}', 'cents'),
      },
    },
    
    // 4. constraint-flow: Approval workflow
    {
      id: 'request-approval',
      connector: 'slack',
      operation: 'sendMessage',
      condition: '${steps.calculate-totals.result.total > 10000}',
      input: {
        channel: '#finance-approvals',
        text: 'Invoice requires approval: ${steps.calculate-totals.result.total}',
      },
    },
  ],
});
```

### Example 2: ML Pipeline with Exact Arithmetic

```python
# constraint-theory-python: ML preprocessing
from constraint_theory import ExactTensor, quantize_model
import torch

# Create model with exact arithmetic
model = MyModel()

# Quantize using constraint-theory-core algorithms
quantized = quantize_model(model, precision='int8')

# Export to constraint-flow
quantized.export_for_flow('model.cflow')
```

```typescript
// constraint-flow: Use quantized model
import { loadQuantizedModel } from '@constraint-flow/ml-bridge';

const mlWorkflow = defineWorkflow({
  name: 'ml-prediction',
  
  steps: [
    {
      id: 'load-model',
      action: 'load-model',
      input: { path: 'model.cflow' },
    },
    {
      id: 'predict',
      agent: 'hog-compute',  // GPU agent
      action: 'inference',
      input: {
        model: '${steps.load-model.result}',
        data: '${input.features}',
      },
    },
    {
      id: 'post-process',
      action: 'exact-rounding',
      input: {
        predictions: '${steps.predict.result}',
        precision: 'cents',
      },
    },
  ],
});
```

### Example 3: Agent Training Pipeline

```typescript
// constraint-ranch: Training configuration
import { TrainingPipeline, PuzzleLoader } from 'constraint-ranch';

const pipeline = new TrainingPipeline({
  puzzles: PuzzleLoader.load(['spatial', 'allocation', 'consensus']),
  episodes: 100000,
  
  // Use constraint-theory-core for routing decisions
  router: 'constraint-theory-core://geometric-router',
});

// Train and export
const agents = await pipeline.run();
await agents.exportToFlow('production');
```

```typescript
// constraint-flow: Use trained agents
import { importTrainedAgents } from '@constraint-flow/ranch-bridge';

const trainedAgents = await importTrainedAgents({
  source: 'ranch://training/spatial-routing-v5',
});

const routingWorkflow = defineWorkflow({
  name: 'intelligent-routing',
  
  orchestration: {
    agents: trainedAgents,
    strategy: 'geometric-routing',
  },
  
  steps: [
    {
      id: 'route-task',
      action: 'geometric-route',
      input: { task: '${input}' },
    },
  ],
});
```

### Example 4: Research to Production

```typescript
// constraint-theory-research: Algorithm implementation
// Based on research paper: "Holonomic Constraint Satisfaction"

// 1. Algorithm designed in research
// 2. Implemented in constraint-theory-core (Rust)
// 3. Exposed via WASM to constraint-flow

import { HolonomicSolver } from '@constraint-flow/core';

const solver = new HolonomicSolver({
  // Parameters from research paper
  algorithm: 'constraint-propagation',
  consistency: 'arc-consistency',
  parallelism: 4,
});

const researchWorkflow = defineWorkflow({
  name: 'research-backed-solver',
  
  steps: [
    {
      id: 'solve',
      action: 'holonomic-solve',
      solver: solver,
      input: {
        constraints: '${input.constraints}',
        variables: '${input.variables}',
      },
    },
  ],
});
```

---

## Unified Quick Reference

### Exact Arithmetic

| Language | Library | Function |
|----------|---------|----------|
| TypeScript | `@constraint-flow/core` | `CT_ADD(a, b)` |
| Python | `constraint_theory` | `exact_add(a, b)` |
| Rust | `constraint-theory-core` | `rational_add(a, b)` |

### Geometric Routing

| Use Case | Language | API |
|----------|----------|-----|
| Agent routing | TypeScript | `GeometricRouter.route(intent)` |
| ML direction | Python | `find_direction(point)` |
| Spatial query | Rust | `kd_tree.nearest(point)` |

### Constraint Types

| Type | Core | Flow | Python |
|------|------|------|--------|
| Value | `ValueConstraint` | `amount_limit` | `ValueConstraint` |
| Temporal | `TemporalConstraint` | `time_limit` | `TemporalConstraint` |
| Geometric | `GeometricConstraint` | `balanced_workload` | `GeometricConstraint` |
| Compliance | `ComplianceConstraint` | `audit_trail` | `ComplianceConstraint` |

### Agent Types

| Agent | Capabilities | Use In |
|-------|--------------|--------|
| Cattle | Reasoning, extraction | Flow, Ranch |
| Duck | APIs, HTTP | Flow |
| Sheep | Consensus, voting | Flow |
| Goat | Debugging, analysis | Flow, Ranch |
| Horse | Pipelines, ETL | Flow |
| Eagle | Coordination, oversight | Flow, Ranch |
| Chicken | Monitoring, alerts | Flow |
| Hog | GPU, compute | Flow, Python |

### Common Patterns

| Pattern | Description | Repos |
|---------|-------------|-------|
| Border Collie | Master-worker coordination | Flow, Ranch |
| Saga | Distributed transactions | Flow |
| Consensus | Multi-party approval | Flow, Ranch |
| Pipeline | ETL processing | Flow |
| Swarm | Collaborative decisions | Flow, Ranch |

---

## Getting Started Paths

### Path 1: Enterprise Automation (constraint-flow focus)

```
1. Install constraint-flow CLI
   npm install -g @constraint-flow/cli

2. Create first workflow
   constraint-flow init my-workflow

3. Add constraints
   constraints: [{ type: 'exact_precision', precision: 'cents' }]

4. Connect to ranch for trained agents
   constraint-flow ranch:import-agents

5. Deploy to production
   constraint-flow deploy --provider=aws
```

### Path 2: ML Integration (constraint-theory-python focus)

```
1. Install Python bindings
   pip install constraint-theory

2. Quantize your model
   from constraint_theory import quantize_model
   quantized = quantize_model(model)

3. Export to constraint-flow
   quantized.export_for_flow('model.cflow')

4. Use in workflow
   import { loadQuantizedModel } from '@constraint-flow/ml-bridge'
```

### Path 3: Agent Training (constraint-ranch focus)

```
1. Clone constraint-ranch
   git clone https://github.com/SuperInstance/constraint-ranch

2. Run training puzzles
   ranch train --puzzles=spatial --episodes=10000

3. Export to constraint-flow
   ranch export --target=flow --agents=all

4. Use in production
   constraint-flow use-agents ./trained-agents
```

### Path 4: Research (constraint-theory-research focus)

```
1. Read research papers
   constraint-theory-research/papers/

2. Understand algorithms
   constraint-theory-research/algorithms/

3. Reference implementations
   constraint-theory-core/src/

4. Apply in production
   constraint-flow constraint add --research-backed
```

---

## Version Compatibility Matrix

| constraint-flow | constraint-theory-core | constraint-ranch | constraint-theory-python |
|-----------------|------------------------|------------------|--------------------------|
| 0.2.x | 0.6.x | 0.4.x | 0.3.x |
| 0.1.x | 0.5.x | 0.3.x | 0.2.x |

---

## Related Documentation

- [Core Integration](./CORE_INTEGRATION.md) - Rust library details
- [Ranch Integration](./RANCH_INTEGRATION.md) - Agent training
- [Workflow Patterns](./WORKFLOW_PATTERNS.md) - Production patterns
- [Enterprise Guide](./ENTERPRISE.md) - SSO, compliance

---

**Last Updated**: 2025-01-27
**Document Version**: 1.0.0
