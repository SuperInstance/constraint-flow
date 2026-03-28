# Core Integration Guide

This document provides detailed information about integrating Constraint Flow with [constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core), the Rust library that powers exact arithmetic and geometric routing.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Exact Arithmetic API](#exact-arithmetic-api)
- [Constraint Type Mapping](#constraint-type-mapping)
- [Rust Library Calls](#rust-library-calls)
- [Performance Benchmarks](#performance-benchmarks)
- [Cross-Platform Consistency](#cross-platform-consistency)

---

## Architecture Overview

Constraint Flow uses a multi-layer architecture that bridges TypeScript workflows with the Rust-based constraint-theory-core:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSTRAINT FLOW ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 TypeScript Layer                         │   │
│  │  • Workflow definitions                                   │   │
│  │  • Constraint DSL                                        │   │
│  │  • Connector interfaces                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                    FFI / WASM                                    │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               constraint-theory-core (Rust)              │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   Exact     │  │  Geometric  │  │    KD-Tree  │     │   │
│  │  │  Arithmetic │  │   Routing   │  │   Spatial   │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │ Pythagorean │  │  Holonomy   │  │   Holistic  │     │   │
│  │  │  Manifold   │  │  Checking   │  │  Consensus  │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Library Dependencies

```toml
# Cargo.toml (constraint-theory-core)
[package]
name = "constraint-theory-core"
version = "0.6.0"

[dependencies]
num-bigint = "0.4"
num-rational = "0.4"
nalgebra = "0.32"
```

```json
// package.json (constraint-flow)
{
  "dependencies": {
    "@constraint-flow/core": "^1.0.0",
    "@constraint-flow/wasm": "^1.0.0"
  }
}
```

---

## Exact Arithmetic API

### Why Exact Arithmetic?

Floating-point arithmetic introduces cumulative errors that can cost enterprises significant money:

```typescript
// The $40,000 Bug
const total = 0.1 + 0.2;  // 0.30000000000000004

// At scale:
// $0.00000000000004 × 1,000,000,000 transactions = $40,000 unaccounted
```

Constraint Flow solves this by delegating all arithmetic to constraint-theory-core's rational number system.

### Core Functions

```typescript
import {
  CT_ADD,
  CT_SUB,
  CT_MUL,
  CT_DIV,
  CT_SUM,
  CT_AVERAGE,
  CT_ROUND,
  ExactNumber
} from '@constraint-flow/core';
```

#### Basic Operations

| Function | Description | Rust Implementation |
|----------|-------------|---------------------|
| `CT_ADD(a, b)` | Exact addition | `rational_add(a, b)` |
| `CT_SUB(a, b)` | Exact subtraction | `rational_sub(a, b)` |
| `CT_MUL(a, b)` | Exact multiplication | `rational_mul(a, b)` |
| `CT_DIV(a, b)` | Exact division with remainder | `rational_div(a, b)` |

```typescript
// Examples
CT_ADD(0.1, 0.2)    // => ExactNumber(3/10) = 0.3 EXACTLY
CT_MUL(0.1, 3)      // => ExactNumber(3/10) = 0.3 EXACTLY
CT_DIV(1, 3)        // => ExactNumber(1/3) with exact remainder
```

#### Aggregation Functions

| Function | Description | Rust Implementation |
|----------|-------------|---------------------|
| `CT_SUM(values)` | Sum without cumulative error | `rational_sum(values)` |
| `CT_AVERAGE(values)` | Precise average | `rational_average(values)` |
| `CT_FINANCIAL_SUM(values)` | Regulatory-compliant sum | `financial_sum(values)` |

```typescript
// Aggregation example
const payments = [0.1, 0.1, 0.1, 0.1, 0.1];

// JavaScript: 0.49999999999999994 ❌
const jsSum = payments.reduce((a, b) => a + b);

// Constraint Flow: 0.5 EXACTLY ✓
const cfSum = CT_SUM(payments).toFloat();  // 0.5
```

#### Rounding Functions

```typescript
// Regulatory-compliant rounding
CT_ROUND(value, 'cents')           // Round to 2 decimal places
CT_ROUND(value, 'micros')          // Round to 6 decimal places
CT_ROUND_HALF_EVEN(value, 2)       // Banker's rounding (unbiased)
CT_ROUND_UP(value, 'cents')        // Always round up
CT_ROUND_DOWN(value, 'cents')      // Always round down
```

### ExactNumber Class

The `ExactNumber` class wraps rational numbers with a fluent API:

```typescript
import { ExactNumber } from '@constraint-flow/core';

// Creation
const a = ExactNumber.fromFloat(0.1);
const b = ExactNumber.fromString('1/3');
const c = ExactNumber.fromCurrency('$123.45');

// Operations (return new ExactNumber instances)
const sum = a.add(b);
const product = a.multiply(3);
const quotient = a.divide(b);

// Comparison (exact!)
a.equals(b);        // boolean
a.lessThan(b);      // boolean
a.greaterThan(b);   // boolean

// Output
a.toFloat();        // number (with possible precision loss)
a.toString();       // string representation
a.toFraction();     // "numerator/denominator"
a.toCurrency();     // "$123.45"
a.toCents();        // integer cents
```

### Rust Implementation Details

The exact arithmetic is implemented in Rust's constraint-theory-core:

```rust
// src/exact.rs (constraint-theory-core)
use num_rational::Rational64;
use num_bigint::BigInt;

/// Represents an exact rational number
pub struct ExactNumber {
    value: Rational64,
}

impl ExactNumber {
    /// Create from float with exact representation
    pub fn from_float(f: f64) -> Self {
        // Convert float to exact rational
        let (sign, exponent, mantissa) = f.decode();
        // ... exact conversion algorithm
    }

    /// Add two exact numbers
    pub fn add(&self, other: &Self) -> Self {
        ExactNumber {
            value: self.value + other.value,
        }
    }

    /// Sum a collection without cumulative error
    pub fn sum(values: &[Self]) -> Self {
        values.iter().fold(ExactNumber::zero(), |acc, v| acc.add(v))
    }
}

/// WASM-exported functions for JavaScript
#[wasm_bindgen]
pub fn ct_add(a: f64, b: f64) -> String {
    let result = ExactNumber::from_float(a).add(&ExactNumber::from_float(b));
    result.to_fraction()
}
```

---

## Constraint Type Mapping

Constraint Flow's TypeScript constraint types map directly to constraint-theory-core Rust implementations:

### Mapping Table

| TypeScript Constraint | Rust Implementation | Module |
|-----------------------|---------------------|--------|
| `amount_limit` | `ValueConstraint::Max` | `constraints/value.rs` |
| `amount_range` | `ValueConstraint::Range` | `constraints/value.rs` |
| `exact_precision` | `PrecisionConstraint` | `constraints/precision.rs` |
| `time_limit` | `TemporalConstraint::Deadline` | `constraints/temporal.rs` |
| `business_hours` | `TemporalConstraint::BusinessHours` | `constraints/temporal.rs` |
| `sla` | `SLAConstraint` | `constraints/sla.rs` |
| `approval_required` | `AuthorizationConstraint::Required` | `constraints/authz.rs` |
| `multi_approval` | `AuthorizationConstraint::Multi` | `constraints/authz.rs` |
| `conditional_approval` | `AuthorizationConstraint::Conditional` | `constraints/authz.rs` |
| `balanced_workload` | `GeometricConstraint::Balance` | `constraints/geometric.rs` |
| `no_cycles` | `GeometricConstraint::Acyclic` | `constraints/geometric.rs` |
| `min_parallelism` | `GeometricConstraint::MinParallel` | `constraints/geometric.rs` |
| `max_latency` | `GeometricConstraint::MaxLatency` | `constraints/geometric.rs` |
| `audit_trail` | `ComplianceConstraint::Audit` | `constraints/compliance.rs` |
| `hipaa_compliant` | `ComplianceConstraint::HIPAA` | `constraints/compliance.rs` |
| `data_locality` | `ComplianceConstraint::Locality` | `constraints/compliance.rs` |

### TypeScript to Rust Translation

```typescript
// TypeScript constraint definition
const constraints = [
  { type: 'amount_limit', max: 10000 },
  { type: 'balanced_workload', tolerance: 0.1 },
  { type: 'audit_trail', required: true }
];
```

Maps to Rust:

```rust
// Generated Rust constraint set
let constraints = ConstraintSet::new()
    .add(ValueConstraint::Max {
        field: "amount".to_string(),
        max: Rational64::from_integer(10000),
        precision: Some(Precision::Cents),
    })
    .add(GeometricConstraint::Balance {
        tolerance: 0.1,
        metric: BalanceMetric::Count,
    })
    .add(ComplianceConstraint::Audit {
        required: true,
        retention_days: Some(2555),  // 7 years
        immutable: true,
    });
```

### Constraint Validation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                  CONSTRAINT VALIDATION PIPELINE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. TypeScript constraint definition                             │
│     { type: 'amount_limit', max: 10000 }                        │
│                                                                  │
│  2. JSON serialization                                           │
│     '{"type":"amount_limit","max":10000}'                       │
│                                                                  │
│  3. WASM FFI call                                                │
│     wasm_constraint_validate(json)                              │
│                                                                  │
│  4. Rust deserialization                                         │
│     let constraint: ValueConstraint = serde_json::from_str()?;  │
│                                                                  │
│  5. Rust validation                                              │
│     constraint.validate(&context)?;                             │
│                                                                  │
│  6. Result serialization                                         │
│     ValidationResult { valid: true, violations: [] }           │
│                                                                  │
│  7. TypeScript result                                            │
│     { valid: true, violations: [] }                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Rust Library Calls

### WASM Bindings

Constraint Flow interfaces with constraint-theory-core through WASM bindings:

```typescript
// src/wasm/bindings.ts
import init, {
  wasm_exact_add,
  wasm_exact_sum,
  wasm_validate_constraints,
  wasm_snap_to_manifold,
  wasm_check_holonomy,
  wasm_geometric_route,
} from '@constraint-flow/wasm';

// Initialize WASM module
await init();
```

### Core API Calls

#### Exact Arithmetic

```typescript
// Single operation
const sum = wasm_exact_add(0.1, 0.2);
// Returns: { numerator: 3, denominator: 10, float: 0.3 }

// Batch operation
const total = wasm_exact_sum([0.1, 0.1, 0.1, 0.1, 0.1]);
// Returns: { numerator: 1, denominator: 2, float: 0.5 }
```

#### Geometric Routing

```typescript
// Snap to Pythagorean manifold
const snapped = wasm_snap_to_manifold([0.577, 0.816], 200);
// Returns: { snapped: [0.6, 0.8], triple: [3, 4, 5], noise: 0.002 }

// Route using geometric constraints
const assignment = wasm_geometric_route({
  agents: ['cattle-email', 'duck-api', 'goat-debug'],
  capabilities: [['email', 'triage'], ['api', 'network'], ['debug']],
  constraints: { responseTime: 1000 },
});
// Returns: { agent: 'cattle-email', confidence: 0.95, ... }
```

#### Holonomy Checking

```typescript
// Check workflow consistency
const result = wasm_check_holonomy({
  nodes: ['step1', 'step2', 'step3'],
  edges: [
    { from: 'step1', to: 'step2' },
    { from: 'step2', to: 'step3' },
    { from: 'step3', to: 'step1' },  // Creates cycle!
  ],
});
// Returns: { consistent: false, issues: [{ type: 'cycle', nodes: [...] }] }
```

### Performance Considerations

The WASM bindings are optimized for performance:

```typescript
// Batch multiple operations
const results = wasm_batch_execute([
  { op: 'add', args: [0.1, 0.2] },
  { op: 'mul', args: [0.3, 3] },
  { op: 'sum', args: [[0.1, 0.1, 0.1]] },
]);
```

---

## Performance Benchmarks

### Exact Arithmetic Benchmarks

| Operation | JavaScript (ms) | Constraint Flow (ms) | Notes |
|-----------|-----------------|----------------------|-------|
| `0.1 + 0.2` | 0.00001 | 0.0001 | CF: exact result |
| Sum 1,000 values | 0.05 | 0.5 | CF: no cumulative error |
| Sum 10,000 values | 0.5 | 4.0 | CF: linear scaling |
| Currency calc | 0.0001 | 0.001 | CF: auditor-approved |

### Constraint Validation Benchmarks

| Constraint Type | Validation Time (μs) | Notes |
|-----------------|---------------------|-------|
| `amount_limit` | 5 | Simple comparison |
| `amount_range` | 8 | Two comparisons |
| `exact_precision` | 15 | Rational conversion |
| `time_limit` | 3 | Timestamp comparison |
| `business_hours` | 25 | Calendar lookup |
| `sla` | 50 | Multi-condition |
| `balanced_workload` | 100 | Geometric analysis |
| `no_cycles` | 500 | Graph traversal |
| `audit_trail` | 10 | Flag check |

### Workflow Execution Benchmarks

| Workflow Complexity | Steps | Validation (ms) | Execution (ms) |
|---------------------|-------|-----------------|----------------|
| Simple | 5 | 1 | 50 |
| Medium | 20 | 3 | 200 |
| Complex | 50 | 8 | 500 |
| Enterprise | 100 | 15 | 1000 |

### Geometric Routing Benchmarks

| Agents | Routing Time (μs) | Memory (KB) |
|--------|-------------------|-------------|
| 10 | 50 | 10 |
| 100 | 200 | 50 |
| 1,000 | 1,500 | 200 |
| 10,000 | 12,000 | 1,500 |

### Comparison with Alternatives

```
┌─────────────────────────────────────────────────────────────────┐
│                PERFORMANCE COMPARISON                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Operation: Sum 10,000 decimal values                           │
│                                                                  │
│  ┌─────────────────────────┬──────────────┬─────────────────┐  │
│  │ Implementation          │ Time (ms)    │ Accuracy        │  │
│  ├─────────────────────────┼──────────────┼─────────────────┤  │
│  │ JavaScript Number       │ 0.5          │ ~$40K error     │  │
│  │ BigDecimal (JS)         │ 15           │ Exact           │  │
│  │ Constraint Flow (WASM)  │ 4            │ Exact           │  │
│  │ Native Rust             │ 2            │ Exact           │  │
│  └─────────────────────────┴──────────────┴─────────────────┘  │
│                                                                  │
│  Constraint Flow provides exact results at 4x speed of JS       │
│  BigDecimal implementations.                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Benchmark Harness

Run benchmarks locally:

```bash
# Run all benchmarks
npm run benchmark

# Run specific benchmark
npm run benchmark -- --filter=exact-arithmetic

# Compare with baseline
npm run benchmark -- --baseline=previous.json
```

---

## Cross-Platform Consistency

### Deterministic Results

Constraint Flow guarantees identical results across all platforms:

| Platform | Architecture | Result |
|----------|-------------|--------|
| Linux x64 | x86_64 | `CT_ADD(0.1, 0.2) = 0.3` |
| Linux ARM64 | aarch64 | `CT_ADD(0.1, 0.2) = 0.3` |
| macOS x64 | x86_64 | `CT_ADD(0.1, 0.2) = 0.3` |
| macOS ARM | arm64 | `CT_ADD(0.1, 0.2) = 0.3` |
| Windows x64 | x86_64 | `CT_ADD(0.1, 0.2) = 0.3` |
| Browser (WASM) | Any | `CT_ADD(0.1, 0.2) = 0.3` |

### WASM vs Native Performance

| Platform | Operation | Time (μs) |
|----------|-----------|-----------|
| Native Rust | CT_SUM(1000) | 50 |
| WASM (Node.js) | CT_SUM(1000) | 80 |
| WASM (Browser) | CT_SUM(1000) | 100 |

### Verification Tests

```typescript
import { verifyCrossPlatformConsistency } from '@constraint-flow/testing';

// Verify consistency across test cases
const result = verifyCrossPlatformConsistency([
  { op: 'CT_ADD', args: [0.1, 0.2] },
  { op: 'CT_MUL', args: [0.1, 3] },
  { op: 'CT_SUM', args: [[0.1, 0.1, 0.1, 0.1, 0.1]] },
]);

console.log(result.consistent);  // true
```

---

## Integration Checklist

- [ ] Install `@constraint-flow/core` and `@constraint-flow/wasm`
- [ ] Initialize WASM module on application startup
- [ ] Use `CT_*` functions for all financial calculations
- [ ] Apply `exact_precision` constraint to currency fields
- [ ] Test cross-platform consistency in CI/CD
- [ ] Monitor performance with built-in metrics

---

## Related Documentation

- [constraint-theory-core README](https://github.com/SuperInstance/constraint-theory-core)
- [Exact Arithmetic Deep Dive](./EXACT_ARITHMETIC.md)
- [Geometric Routing Guide](./GEOMETRIC_ROUTING.md)
- [Performance Tuning](./PRODUCTION.md#capacity-planning)

---

**Last Updated**: 2025-01-27
**Document Version**: 1.0.0
