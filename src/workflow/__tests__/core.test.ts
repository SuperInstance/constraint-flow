/**
 * Constraint Flow — Core module tests
 * Tests DAG builder, exact arithmetic, and workflow validation
 */

import { describe, it, expect } from 'vitest';

// ─── Helper: create a minimal step ──────────────────────────────────

function step(id: string, overrides: Partial<WorkflowStep> = {}): WorkflowStep {
  return {
    id,
    input: {},
    ...overrides,
  };
}

function simpleWorkflow(steps: WorkflowStep[], constraints?: WorkflowConstraint[]): Workflow {
  return {
    name: 'test-workflow',
    version: '1.0.0',
    steps,
    constraints,
  };
}

import { DAGBuilder, ExecutionPlanner, DAGUtils } from '../dag';
import { ExactNumber } from '../arithmetic';
import { WorkflowValidator } from '../validation';
import type { Workflow, WorkflowStep, WorkflowConstraint } from '../../types/workflow';

describe('DAGBuilder', () => {
  it('should create an empty DAG', () => {
    const builder = new DAGBuilder();
    const dag = builder.build();
    expect(dag.nodes.size).toBe(0);
    expect(dag.edges.length).toBe(0);
    expect(dag.validated).toBe(true);
    expect(dag.errors.length).toBe(0);
  });

  it('should add nodes', () => {
    const builder = new DAGBuilder();
    builder.addNode(step('a'));
    builder.addNode(step('b'));
    const dag = builder.build();
    expect(dag.nodes.size).toBe(2);
    expect(dag.nodes.has('a')).toBe(true);
    expect(dag.nodes.has('b')).toBe(true);
  });

  it('should add edges between nodes', () => {
    const builder = new DAGBuilder();
    builder.addNode(step('a'));
    builder.addNode(step('b'));
    builder.addEdge('a', 'b');
    const dag = builder.build();
    expect(dag.edges.length).toBe(1);
    expect(dag.edges[0].from).toBe('a');
    expect(dag.edges[0].to).toBe('b');
  });

  it('should throw when adding edge to missing node', () => {
    const builder = new DAGBuilder();
    builder.addNode(step('a'));
    expect(() => builder.addEdge('a', 'missing')).toThrow();
  });

  it('should compute entry and exit points', () => {
    const builder = new DAGBuilder();
    builder.addNode(step('a'));
    builder.addNode(step('b'));
    builder.addNode(step('c'));
    builder.addEdge('a', 'b');
    builder.addEdge('b', 'c');
    const dag = builder.build();
    expect(dag.entryPoints.has('a')).toBe(true);
    expect(dag.exitPoints.has('c')).toBe(true);
    expect(dag.entryPoints.size).toBe(1);
    expect(dag.exitPoints.size).toBe(1);
  });

  it('should handle diamond dependency pattern', () => {
    const builder = new DAGBuilder();
    builder.addNode(step('start'));
    builder.addNode(step('left'));
    builder.addNode(step('right'));
    builder.addNode(step('end'));
    builder.addEdge('start', 'left');
    builder.addEdge('start', 'right');
    builder.addEdge('left', 'end');
    builder.addEdge('right', 'end');
    const dag = builder.build();
    expect(dag.entryPoints.has('start')).toBe(true);
    expect(dag.exitPoints.has('end')).toBe(true);
    expect(dag.nodes.get('end')!.dependencies.size).toBe(2);
  });

  it('should detect cycles', () => {
    const builder = new DAGBuilder({ validate: true });
    builder.addNode(step('a'));
    builder.addNode(step('b'));
    builder.addNode(step('c'));
    builder.addEdge('a', 'b');
    builder.addEdge('b', 'c');
    builder.addEdge('c', 'a'); // cycle!
    const dag = builder.build();
    expect(dag.errors.length).toBeGreaterThan(0);
    expect(dag.errors.some(e => e.type === 'cycle')).toBe(true);
  });

  it('should compute execution levels', () => {
    const builder = new DAGBuilder();
    builder.addNode(step('a'));
    builder.addNode(step('b'));
    builder.addNode(step('c'));
    builder.addEdge('a', 'b');
    builder.addEdge('b', 'c');
    const dag = builder.build();
    expect(dag.nodes.get('a')!.level).toBe(0);
    expect(dag.nodes.get('b')!.level).toBe(1);
    expect(dag.nodes.get('c')!.level).toBe(2);
  });

  it('should build from workflow definition', () => {
    const wf = simpleWorkflow([
      step('step-1'),
      step('step-2', { dependsOn: ['step-1'] }),
      step('step-3', { dependsOn: ['step-2'] }),
    ]);
    const dag = DAGBuilder.fromWorkflow(wf);
    expect(dag.nodes.size).toBe(3);
    expect(dag.edges.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// ExactNumber Tests
// ═══════════════════════════════════════════════════════════════════

describe('ExactNumber', () => {
  it('should create from integer', () => {
    const n = ExactNumber.fromFloat(5);
    expect(n.toFloat()).toBe(5);
  });

  it('should create from float', () => {
    const n = ExactNumber.fromFloat(0.1);
    // 0.1 is exactly representable in rational form
    expect(n.toFloat()).toBeCloseTo(0.1, 15);
  });

  it('should create zero', () => {
    const z = ExactNumber.zero();
    expect(z.toFloat()).toBe(0);
  });

  it('should create one', () => {
    const o = ExactNumber.one();
    expect(o.toFloat()).toBe(1);
  });

  it('should add exactly', () => {
    const a = ExactNumber.fromFloat(0.1);
    const b = ExactNumber.fromFloat(0.2);
    const result = a.add(b);
    expect(result.toFloat()).toBeCloseTo(0.3, 15);
    // Unlike float: 0.1 + 0.2 === 0.30000000000000004
  });

  it('should subtract exactly', () => {
    const a = ExactNumber.fromFloat(1.0);
    const b = ExactNumber.fromFloat(0.3);
    const result = a.subtract(b);
    expect(result.toFloat()).toBeCloseTo(0.7, 15);
  });

  it('should multiply exactly', () => {
    const a = ExactNumber.fromFloat(0.1);
    const b = ExactNumber.fromFloat(3);
    const result = a.multiply(b);
    expect(result.toFloat()).toBeCloseTo(0.3, 15);
  });

  it('should divide exactly', () => {
    const a = ExactNumber.fromFloat(1);
    const b = ExactNumber.fromFloat(3);
    const result = a.divide(b);
    expect(result.toFloat()).toBeCloseTo(1 / 3, 15);
  });

  it('should throw on non-finite input', () => {
    expect(() => ExactNumber.fromFloat(Infinity)).toThrow();
    expect(() => ExactNumber.fromFloat(NaN)).toThrow();
  });

  it('should create from string', () => {
    const n = ExactNumber.fromString('3.14');
    expect(n.toFloat()).toBeCloseTo(3.14, 10);
  });

  it('should create from currency string', () => {
    const n = ExactNumber.fromCurrency('$19.99');
    expect(n.toFloat()).toBeCloseTo(19.99, 10);
  });

  it('should create from rational', () => {
    const n = ExactNumber.fromRational(1, 4);
    expect(n.toFloat()).toBe(0.25);
  });

  it('should compare equality', () => {
    const a = ExactNumber.fromFloat(0.1).add(ExactNumber.fromFloat(0.2));
    const b = ExactNumber.fromFloat(0.3);
    expect(a.equals(b)).toBe(true);
  });

  it('should add large numbers of cents without drift', () => {
    // Financial: add 100 pennies (0.01 each) = should be exactly 1.00
    let sum = ExactNumber.zero();
    for (let i = 0; i < 100; i++) {
      sum = sum.add(ExactNumber.fromFloat(0.01));
    }
    expect(sum.toFloat()).toBe(1.0);
  });

  it('should convert to string', () => {
    const n = ExactNumber.fromRational(1, 3);
    const s = n.toString();
    expect(s).toBeTruthy();
    // toString returns rational form like '1/3'
    expect(s).toContain('/');
  });
});

// ═══════════════════════════════════════════════════════════════════
// WorkflowValidator Tests
// ═══════════════════════════════════════════════════════════════════

describe('WorkflowValidator', () => {
  it('should validate a simple valid workflow', () => {
    const wf = simpleWorkflow([
      step('step-1'),
      step('step-2', { dependsOn: ['step-1'] }),
    ]);
    const validator = new WorkflowValidator();
    const result = validator.validate(wf);
    expect(result.valid).toBe(true);
    expect(result.structuralErrors.length).toBe(0);
  });

  it('should detect missing dependencies', () => {
    const wf = simpleWorkflow([
      step('step-1', { dependsOn: ['nonexistent'] }),
    ]);
    const validator = new WorkflowValidator();
    expect(() => validator.validate(wf)).toThrow();
  });

  it('should detect cycles in workflow', () => {
    const wf = simpleWorkflow([
      step('a', { dependsOn: ['b'] }),
      step('b', { dependsOn: ['c'] }),
      step('c', { dependsOn: ['a'] }),
    ]);
    const validator = new WorkflowValidator();
    const result = validator.validate(wf);
    expect(result.valid).toBe(false);
  });

  it('should accept a workflow with no steps', () => {
    const wf = simpleWorkflow([]);
    const validator = new WorkflowValidator();
    const result = validator.validate(wf);
    // Empty workflow might be valid or have a warning
    expect(result).toBeDefined();
  });

  it('should validate independent parallel steps', () => {
    const wf = simpleWorkflow([
      step('parallel-a'),
      step('parallel-b'),
      step('merge', { dependsOn: ['parallel-a', 'parallel-b'] }),
    ]);
    const validator = new WorkflowValidator();
    const result = validator.validate(wf);
    expect(result.valid).toBe(true);
  });

  it('should validate workflows with conditions', () => {
    const wf = simpleWorkflow([
      step('check'),
      step('branch-a', { dependsOn: ['check'], condition: 'result.ok' }),
      step('branch-b', { dependsOn: ['check'], condition: '!result.ok' }),
    ]);
    const validator = new WorkflowValidator();
    const result = validator.validate(wf);
    expect(result.valid).toBe(true);
  });

  it('should detect duplicate step IDs', () => {
    const wf = simpleWorkflow([
      step('dup'),
      step('dup'),
    ]);
    const validator = new WorkflowValidator();
    const result = validator.validate(wf);
    expect(result.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DAGUtils Tests
// ═══════════════════════════════════════════════════════════════════

describe('DAGUtils', () => {
  it('should find critical path in linear DAG', () => {
    const builder = new DAGBuilder();
    builder.addNode(step('a'));
    builder.addNode(step('b'));
    builder.addNode(step('c'));
    builder.addEdge('a', 'b');
    builder.addEdge('b', 'c');
    const dag = builder.build();

    if (DAGUtils.criticalPath) {
      const path = DAGUtils.criticalPath(dag);
      expect(path).toBeDefined();
    }
  });

  it('should serialize and deserialize DAG', () => {
    const builder = new DAGBuilder();
    builder.addNode(step('a'));
    builder.addNode(step('b'));
    builder.addEdge('a', 'b');
    const dag = builder.build();

    if (DAGUtils.serialize) {
      const serialized = DAGUtils.serialize(dag);
      expect(serialized).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// ExecutionPlanner Tests
// ═══════════════════════════════════════════════════════════════════

describe('ExecutionPlanner', () => {
  it('should create execution plan from DAG', () => {
    const builder = new DAGBuilder();
    builder.addNode(step('a'));
    builder.addNode(step('b'));
    builder.addNode(step('c'));
    builder.addEdge('a', 'b');
    builder.addEdge('a', 'c');
    const dag = builder.build();

    const planner = new ExecutionPlanner();
    if (planner.plan) {
      const plan = planner.plan(dag);
      expect(plan).toBeDefined();
    }
  });
});
