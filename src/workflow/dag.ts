/**
 * DAG-Based Workflow Definition
 * 
 * Core implementation of workflow graphs as Directed Acyclic Graphs (DAGs).
 * Provides topological sorting, cycle detection, parallel execution planning,
 * and constraint-based workflow construction.
 * 
 * @module workflow/dag
 * @version 1.0.0
 */

import type { WorkflowStep, Workflow, WorkflowResult, StepResult } from '../types/workflow';
import type { Constraint, ConstraintViolation, ConstraintValidationResult } from '../types/constraints';

// ============================================
// Types
// ============================================

/**
 * Node in the workflow DAG
 */
export interface DAGNode {
  /** Step ID */
  id: string;
  /** Original workflow step */
  step: WorkflowStep;
  /** Nodes this node depends on */
  dependencies: Set<string>;
  /** Nodes that depend on this node */
  dependents: Set<string>;
  /** Execution level (0 = no dependencies, higher = more dependencies) */
  level: number;
  /** Whether node can execute in parallel with others at same level */
  parallelizable: boolean;
}

/**
 * Edge in the workflow DAG
 */
export interface DAGEdge {
  /** Source node ID */
  from: string;
  /** Target node ID */
  to: string;
  /** Edge type */
  type: 'dependency' | 'condition' | 'fallback';
  /** Optional condition for conditional edges */
  condition?: string;
}

/**
 * Workflow DAG structure
 */
export interface WorkflowDAG {
  /** All nodes indexed by ID */
  nodes: Map<string, DAGNode>;
  /** All edges */
  edges: DAGEdge[];
  /** Nodes grouped by execution level */
  levels: Map<number, Set<string>>;
  /** Entry nodes (no dependencies) */
  entryPoints: Set<string>;
  /** Exit nodes (no dependents) */
  exitPoints: Set<string>;
  /** Whether the DAG has been validated */
  validated: boolean;
  /** Validation errors if any */
  errors: DAGValidationError[];
}

/**
 * DAG validation error
 */
export interface DAGValidationError {
  type: 'cycle' | 'missing_dependency' | 'orphan_node' | 'invalid_reference';
  message: string;
  nodeId?: string;
  edge?: DAGEdge;
  path?: string[];
}

/**
 * Execution plan derived from DAG
 */
export interface ExecutionPlan {
  /** Execution stages (groups of parallelizable steps) */
  stages: ExecutionStage[];
  /** Total estimated duration (ms) */
  estimatedDuration: number;
  /** Maximum parallelism possible */
  maxParallelism: number;
  /** Critical path (longest path through DAG) */
  criticalPath: string[];
}

/**
 * Single execution stage in the plan
 */
export interface ExecutionStage {
  /** Stage number (0-indexed) */
  stage: number;
  /** Steps in this stage (can run in parallel) */
  steps: string[];
  /** Whether this stage has conditional branches */
  hasConditions: boolean;
  /** Estimated duration for this stage */
  estimatedDuration: number;
}

/**
 * Options for DAG construction
 */
export interface DAGOptions {
  /** Whether to validate on construction */
  validate?: boolean;
  /** Whether to compute execution plan */
  computePlan?: boolean;
  /** Maximum allowed depth */
  maxDepth?: number;
  /** Custom node comparator for ordering */
  nodeOrder?: (a: DAGNode, b: DAGNode) => number;
}

// ============================================
// DAG Builder Class
// ============================================

/**
 * Builds and manipulates workflow DAGs
 */
export class DAGBuilder {
  private nodes: Map<string, DAGNode> = new Map();
  private edges: DAGEdge[] = [];
  private options: DAGOptions;

  constructor(options: DAGOptions = {}) {
    this.options = {
      validate: true,
      computePlan: true,
      maxDepth: 1000,
      ...options
    };
  }

  /**
   * Add a step as a node to the DAG
   */
  addNode(step: WorkflowStep): this {
    const node: DAGNode = {
      id: step.id,
      step,
      dependencies: new Set(step.dependsOn || []),
      dependents: new Set(),
      level: 0,
      parallelizable: !step.condition
    };

    this.nodes.set(step.id, node);
    return this;
  }

  /**
   * Add an edge between nodes
   */
  addEdge(from: string, to: string, type: DAGEdge['type'] = 'dependency', condition?: string): this {
    const fromNode = this.nodes.get(from);
    const toNode = this.nodes.get(to);

    if (!fromNode || !toNode) {
      throw new Error(`Cannot create edge: node ${from} or ${to} not found`);
    }

    this.edges.push({ from, to, type, condition });
    toNode.dependencies.add(from);
    fromNode.dependents.add(to);

    return this;
  }

  /**
   * Build the DAG from a workflow definition
   */
  static fromWorkflow(workflow: Workflow): WorkflowDAG {
    const builder = new DAGBuilder();
    
    // Add all steps as nodes
    for (const step of workflow.steps) {
      builder.addNode(step);
    }

    // Build edges from dependencies
    for (const step of workflow.steps) {
      if (step.dependsOn) {
        for (const depId of step.dependsOn) {
          builder.addEdge(depId, step.id, 'dependency');
        }
      }
    }

    return builder.build();
  }

  /**
   * Build the final DAG structure
   */
  build(): WorkflowDAG {
    const dag: WorkflowDAG = {
      nodes: this.nodes,
      edges: this.edges,
      levels: new Map(),
      entryPoints: new Set(),
      exitPoints: new Set(),
      validated: false,
      errors: []
    };

    // Compute levels
    this.computeLevels(dag);

    // Find entry and exit points
    this.findEntryExitPoints(dag);

    // Validate
    if (this.options.validate) {
      this.validate(dag);
    }

    return dag;
  }

  /**
   * Compute execution levels for all nodes
   */
  private computeLevels(dag: WorkflowDAG): void {
    // Topological sort to compute levels
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string, level: number): void => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        // Cycle detected - will be reported in validation
        return;
      }

      visiting.add(nodeId);
      const node = dag.nodes.get(nodeId);
      if (!node) return;

      // Level is max of all dependency levels + 1
      let maxDepLevel = -1;
      for (const depId of node.dependencies) {
        const depNode = dag.nodes.get(depId);
        if (depNode && depNode.level > maxDepLevel) {
          maxDepLevel = depNode.level;
        }
      }
      node.level = maxDepLevel + 1;

      // Add to level map
      if (!dag.levels.has(node.level)) {
        dag.levels.set(node.level, new Set());
      }
      dag.levels.get(node.level)!.add(nodeId);

      visiting.delete(nodeId);
      visited.add(nodeId);

      // Visit dependents
      for (const depId of node.dependents) {
        visit(depId, level + 1);
      }
    };

    // Start from entry points
    for (const [id, node] of dag.nodes) {
      if (node.dependencies.size === 0) {
        visit(id, 0);
      }
    }

    // Visit any remaining nodes (might be in cycles)
    for (const id of dag.nodes.keys()) {
      visit(id, 0);
    }
  }

  /**
   * Find entry and exit points
   */
  private findEntryExitPoints(dag: WorkflowDAG): void {
    for (const [id, node] of dag.nodes) {
      if (node.dependencies.size === 0) {
        dag.entryPoints.add(id);
      }
      if (node.dependents.size === 0) {
        dag.exitPoints.add(id);
      }
    }
  }

  /**
   * Validate the DAG
   */
  private validate(dag: WorkflowDAG): void {
    dag.errors = [];

    // Check for cycles
    const cycleResult = this.detectCycles(dag);
    if (cycleResult.hasCycle) {
      dag.errors.push({
        type: 'cycle',
        message: `Cycle detected in workflow: ${cycleResult.path?.join(' -> ')}`,
        path: cycleResult.path
      });
    }

    // Check for missing dependencies
    for (const [id, node] of dag.nodes) {
      for (const depId of node.dependencies) {
        if (!dag.nodes.has(depId)) {
          dag.errors.push({
            type: 'missing_dependency',
            message: `Node ${id} depends on non-existent node ${depId}`,
            nodeId: id
          });
        }
      }
    }

    // Check for orphan nodes (no path from entry point)
    const reachable = new Set<string>();
    const queue = [...dag.entryPoints];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;
      reachable.add(current);
      const node = dag.nodes.get(current);
      if (node) {
        queue.push(...node.dependents);
      }
    }

    for (const id of dag.nodes.keys()) {
      if (!reachable.has(id)) {
        dag.errors.push({
          type: 'orphan_node',
          message: `Node ${id} is not reachable from any entry point`,
          nodeId: id
        });
      }
    }

    dag.validated = dag.errors.length === 0;
  }

  /**
   * Detect cycles using DFS
   */
  private detectCycles(dag: WorkflowDAG): { hasCycle: boolean; path?: string[] } {
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const colors = new Map<string, number>();
    const parents = new Map<string, string>();

    for (const id of dag.nodes.keys()) {
      colors.set(id, WHITE);
    }

    const dfs = (nodeId: string): string[] | null => {
      colors.set(nodeId, GRAY);
      const node = dag.nodes.get(nodeId);
      
      if (node) {
        for (const depId of node.dependents) {
          const color = colors.get(depId);
          if (color === GRAY) {
            // Found cycle - reconstruct path
            const path = [depId];
            let current = nodeId;
            while (current !== depId) {
              path.unshift(current);
              current = parents.get(current) || '';
            }
            path.unshift(depId);
            return path;
          }
          if (color === WHITE) {
            parents.set(depId, nodeId);
            const cyclePath = dfs(depId);
            if (cyclePath) return cyclePath;
          }
        }
      }

      colors.set(nodeId, BLACK);
      return null;
    };

    for (const [id, color] of colors) {
      if (color === WHITE) {
        const cyclePath = dfs(id);
        if (cyclePath) {
          return { hasCycle: true, path: cyclePath };
        }
      }
    }

    return { hasCycle: false };
  }
}

// ============================================
// Execution Planner
// ============================================

/**
 * Creates execution plans from workflow DAGs
 */
export class ExecutionPlanner {
  /**
   * Create an execution plan from a DAG
   */
  static createPlan(dag: WorkflowDAG): ExecutionPlan {
    const stages: ExecutionStage[] = [];
    let maxParallelism = 0;
    
    // Group nodes by level
    const sortedLevels = [...dag.levels.entries()].sort((a, b) => a[0] - b[0]);
    
    for (const [level, nodeIds] of sortedLevels) {
      const steps = [...nodeIds];
      const hasConditions = steps.some(id => {
        const node = dag.nodes.get(id);
        return node?.step.condition !== undefined;
      });

      // Estimate duration (use timeout or default)
      const estimatedDuration = Math.max(
        ...steps.map(id => {
          const node = dag.nodes.get(id);
          return node?.step.timeout || 30000;
        })
      );

      stages.push({
        stage: level,
        steps,
        hasConditions,
        estimatedDuration
      });

      if (steps.length > maxParallelism) {
        maxParallelism = steps.length;
      }
    }

    // Find critical path
    const criticalPath = this.findCriticalPath(dag);

    // Calculate total estimated duration
    const totalDuration = stages.reduce((sum, stage) => sum + stage.estimatedDuration, 0);

    return {
      stages,
      estimatedDuration: totalDuration,
      maxParallelism,
      criticalPath
    };
  }

  /**
   * Find the critical path through the DAG
   */
  static findCriticalPath(dag: WorkflowDAG): string[] {
    // Use dynamic programming to find longest path
    const distances = new Map<string, number>();
    const predecessors = new Map<string, string>();
    
    // Process nodes in topological order (by level)
    const sortedNodes = [...dag.nodes.values()].sort((a, b) => a.level - b.level);
    
    for (const node of sortedNodes) {
      distances.set(node.id, 0);
      predecessors.set(node.id, '');
    }

    for (const node of sortedNodes) {
      const nodeDuration = node.step.timeout || 30000;
      
      for (const depId of node.dependencies) {
        const depDistance = distances.get(depId) || 0;
        const newDistance = depDistance + nodeDuration;
        
        if (newDistance > (distances.get(node.id) || 0)) {
          distances.set(node.id, newDistance);
          predecessors.set(node.id, depId);
        }
      }
    }

    // Find exit point with maximum distance
    let maxDistance = 0;
    let endNode = '';
    for (const exitId of dag.exitPoints) {
      const distance = distances.get(exitId) || 0;
      if (distance > maxDistance) {
        maxDistance = distance;
        endNode = exitId;
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let current = endNode;
    while (current) {
      path.unshift(current);
      current = predecessors.get(current) || '';
    }

    return path;
  }
}

// ============================================
// Workflow DAG Utilities
// ============================================

/**
 * Utility functions for working with workflow DAGs
 */
export const DAGUtils = {
  /**
   * Check if a workflow is valid (no cycles, all dependencies satisfied)
   */
  isValid(dag: WorkflowDAG): boolean {
    return dag.validated && dag.errors.length === 0;
  },

  /**
   * Get all nodes that can execute at a given level
   */
  getNodesAtLevel(dag: WorkflowDAG, level: number): DAGNode[] {
    const nodeIds = dag.levels.get(level);
    if (!nodeIds) return [];
    return [...nodeIds].map(id => dag.nodes.get(id)!).filter(Boolean);
  },

  /**
   * Get the total number of execution stages
   */
  getStageCount(dag: WorkflowDAG): number {
    return dag.levels.size;
  },

  /**
   * Check if two nodes can execute in parallel
   */
  canParallelize(dag: WorkflowDAG, nodeId1: string, nodeId2: string): boolean {
    const node1 = dag.nodes.get(nodeId1);
    const node2 = dag.nodes.get(nodeId2);
    
    if (!node1 || !node2) return false;
    
    // Same level and no dependency between them
    return node1.level === node2.level && 
           !node1.dependencies.has(nodeId2) && 
           !node2.dependencies.has(nodeId1);
  },

  /**
   * Get all paths from entry to exit
   */
  getAllPaths(dag: WorkflowDAG): string[][] {
    const paths: string[][] = [];
    
    const dfs = (nodeId: string, currentPath: string[]): void => {
      const node = dag.nodes.get(nodeId);
      if (!node) return;
      
      currentPath.push(nodeId);
      
      if (node.dependents.size === 0) {
        // Exit point
        paths.push([...currentPath]);
      } else {
        for (const depId of node.dependents) {
          dfs(depId, currentPath);
        }
      }
      
      currentPath.pop();
    };

    for (const entryId of dag.entryPoints) {
      dfs(entryId, []);
    }

    return paths;
  },

  /**
   * Get nodes that must complete before a given node can execute
   */
  getPrerequisites(dag: WorkflowDAG, nodeId: string): Set<string> {
    const prerequisites = new Set<string>();
    const visited = new Set<string>();
    
    const collect = (id: string): void => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const node = dag.nodes.get(id);
      if (node) {
        for (const depId of node.dependencies) {
          prerequisites.add(depId);
          collect(depId);
        }
      }
    };

    collect(nodeId);
    return prerequisites;
  },

  /**
   * Get nodes that depend on a given node
   */
  getDependents(dag: WorkflowDAG, nodeId: string): Set<string> {
    const dependents = new Set<string>();
    const visited = new Set<string>();
    
    const collect = (id: string): void => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const node = dag.nodes.get(id);
      if (node) {
        for (const depId of node.dependents) {
          dependents.add(depId);
          collect(depId);
        }
      }
    };

    collect(nodeId);
    return dependents;
  },

  /**
   * Calculate the theoretical speedup from parallel execution
   */
  calculateParallelSpeedup(dag: WorkflowDAG): number {
    const plan = ExecutionPlanner.createPlan(dag);
    
    // Sequential duration (sum of all nodes)
    const sequentialDuration = [...dag.nodes.values()]
      .reduce((sum, node) => sum + (node.step.timeout || 30000), 0);
    
    // Parallel duration (sum of stages)
    const parallelDuration = plan.estimatedDuration;
    
    return sequentialDuration / parallelDuration;
  }
};

// ============================================
// Exports
// ============================================

export default {
  DAGBuilder,
  ExecutionPlanner,
  DAGUtils
};
