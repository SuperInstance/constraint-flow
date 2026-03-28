# Ranch Integration Guide

This document describes the integration between Constraint Flow and [constraint-ranch](https://github.com/SuperInstance/constraint-ranch), the gamified AI training platform for constraint-aware agents.

## Table of Contents

- [Overview](#overview)
- [Agent Coordination Patterns](#agent-coordination-patterns)
- [Game Workflow Patterns](#game-workflow-patterns)
- [Breeding Algorithms](#breeding-algorithms)
- [Scoring Integration](#scoring-integration)
- [Training Pipeline](#training-pipeline)

---

## Overview

Constraint Ranch trains AI agents using puzzle-based challenges that develop constraint-awareness. These trained agents are then deployed to Constraint Flow for production workflows.

```
┌─────────────────────────────────────────────────────────────────┐
│                  RANCH-FLOW INTEGRATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  constraint-ranch                      constraint-flow           │
│  ┌─────────────────┐                  ┌─────────────────┐      │
│  │  Puzzle Engine  │                  │ Workflow Engine │      │
│  │                 │                  │                 │      │
│  │  ┌───────────┐  │   Trained        │  ┌───────────┐  │      │
│  │  │ Spatial   │  │   Agents         │  │ Cattle    │  │      │
│  │  │ Puzzles   │──┼─────────────────▶│  │ Agents    │  │      │
│  │  └───────────┘  │                  │  └───────────┘  │      │
│  │                 │                  │                 │      │
│  │  ┌───────────┐  │   Strategies     │  ┌───────────┐  │      │
│  │  │ Breeding  │  │                  │  │ Duck      │  │      │
│  │  │ Arena     │──┼─────────────────▶│  │ Agents    │  │      │
│  │  └───────────┘  │                  │  └───────────┘  │      │
│  │                 │                  │                 │      │
│  │  ┌───────────┐  │   Scores         │  ┌───────────┐  │      │
│  │  │ Scoring   │  │                  │  │ Sheep     │  │      │
│  │  │ System    │──┼─────────────────▶│  │ Agents    │  │      │
│  │  └───────────┘  │                  │  └───────────┘  │      │
│  │                 │                  │                 │      │
│  └─────────────────┘                  └─────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Integration Points

| Integration | Description |
|-------------|-------------|
| **Agent Export** | Trained agents exported from Ranch to Flow |
| **Strategy Sync** | Coordination strategies shared between platforms |
| **Score Import** | Performance scores influence routing decisions |
| **Puzzle Replay** | Real-world scenarios become training puzzles |

---

## Agent Coordination Patterns

Constraint Flow uses patterns developed and refined in constraint-ranch's puzzle environment.

### Border Collie Pattern (Master-Worker)

The Border Collie pattern involves a coordinator agent managing a pool of worker agents:

```typescript
import { defineWorkflow } from '@constraint-flow/core';

const borderCollieWorkflow = defineWorkflow({
  name: 'border-collie-coordination',
  
  orchestration: {
    // Pattern developed in constraint-ranch
    strategy: 'master-worker',
    masterAgent: 'eagle-coordinator',  // Border Collie role
    
    workerPool: [
      'cattle-processor-1',
      'cattle-processor-2', 
      'cattle-processor-3',
    ],
    
    // Load balancing learned from ranch puzzles
    loadBalancing: {
      method: 'least-loaded',
      maxConcurrentPerWorker: 5,
      rebalanceInterval: 30000,
    },
    
    // Fault tolerance from ranch training
    faultTolerance: {
      maxRetries: 3,
      timeout: 60000,
      fallbackAgent: 'cattle-backup',
    },
  },
  
  steps: [
    {
      id: 'partition-work',
      agent: 'eagle-coordinator',
      action: 'partition',
      input: {
        data: '${input.items}',
        strategy: 'equal-shares',
        constraint: 'balanced_workload',
      },
    },
    {
      id: 'execute-parallel',
      type: 'parallel',
      branches: '${steps.partition-work.partitions}',
      stepTemplate: {
        agent: '${worker}',
        action: 'process',
        input: { partition: '${branch}' },
      },
    },
    {
      id: 'aggregate-results',
      agent: 'sheep-aggregator',
      action: 'consensus',
      input: {
        results: '${steps.execute-parallel.results}',
        requiredQuorum: 0.6,
      },
    },
  ],
});
```

### Herding Pattern (Broadcast-Collect)

Agents broadcast tasks and collect responses:

```typescript
const herdingWorkflow = defineWorkflow({
  name: 'herding-pattern',
  
  orchestration: {
    strategy: 'broadcast-collect',
    
    // Herding parameters from ranch
    broadcastTimeout: 5000,
    minResponses: 3,
    consensusThreshold: 0.7,
  },
  
  steps: [
    {
      id: 'broadcast',
      type: 'broadcast',
      agents: ['cattle-1', 'cattle-2', 'cattle-3', 'cattle-4'],
      action: 'evaluate',
      input: { task: '${input.task}' },
    },
    {
      id: 'collect',
      action: 'collect-responses',
      input: {
        responses: '${steps.broadcast.responses}',
        strategy: 'majority-vote',
      },
    },
  ],
});
```

### Flocking Pattern (Swarm Coordination)

Agents coordinate like a flock, maintaining cohesion:

```typescript
const flockingWorkflow = defineWorkflow({
  name: 'flocking-pattern',
  
  orchestration: {
    strategy: 'swarm',
    
    // Flocking rules from ranch spatial puzzles
    rules: {
      separation: 0.3,   // Avoid crowding
      alignment: 0.4,    // Steer towards average heading
      cohesion: 0.3,     // Steer towards average position
    },
    
    // Agent proximity constraints
    proximityConstraints: {
      maxDistance: 3,     // Max hops between agents
      minDistance: 1,     // Min separation for independence
    },
  },
  
  steps: [
    {
      id: 'swarm-decide',
      type: 'swarm',
      agents: '${input.agentPool}',
      action: 'collaborative-decision',
      constraints: [
        { type: 'balanced_workload', tolerance: 0.2 },
        { type: 'max_latency', ms: 5000 },
      ],
    },
  ],
});
```

---

## Game Workflow Patterns

Constraint Ranch's puzzle games translate directly to production workflow patterns.

### Puzzle Types → Workflow Patterns

| Ranch Puzzle | Flow Pattern | Use Case |
|--------------|--------------|----------|
| **Spatial Routing** | Agent Selection | Task routing to optimal agent |
| **Resource Allocation** | Load Balancing | Distribute work evenly |
| **Constraint Satisfaction** | Validation | Ensure business rule compliance |
| **Consensus Building** | Multi-Approval | Require multiple sign-offs |
| **Holonomy Check** | Cycle Detection | Prevent circular dependencies |
| **Time Pressure** | SLA Enforcement | Meet deadlines |

### Spatial Puzzle Integration

Spatial puzzles train agents to navigate constraint manifolds:

```typescript
import { SpatialRouter } from '@constraint-flow/ranch-bridge';

// Router trained on constraint-ranch spatial puzzles
const router = new SpatialRouter({
  // Training metrics from ranch
  trainingScore: 0.92,
  puzzleTypes: ['maze', 'manifold', 'geodesic'],
  
  // Routing configuration
  manifoldSize: 200,
  snapThreshold: 0.05,
});

// Use in workflow
const workflow = defineWorkflow({
  name: 'spatial-routing-workflow',
  
  steps: [
    {
      id: 'route-task',
      action: 'spatial-route',
      router: router,
      input: {
        intent: '${input.intent}',
        constraints: ['response_time', 'capability', 'cost'],
      },
    },
  ],
});
```

### Resource Allocation Game

The resource allocation puzzle trains balanced work distribution:

```typescript
import { AllocationStrategy } from '@constraint-flow/ranch-bridge';

// Strategy learned from ranch allocation puzzles
const allocationStrategy = new AllocationStrategy({
  // Puzzle-based parameters
  optimizationTarget: 'balance',
  constraints: {
    maxVariance: 0.1,      // Maximum load imbalance
    minEfficiency: 0.85,   // Minimum utilization
  },
  
  // Ranch training metadata
  trainedOn: 'resource-allocation-v3',
  accuracy: 0.94,
});

const workflow = defineWorkflow({
  name: 'balanced-allocation',
  
  constraints: [
    { type: 'balanced_workload', tolerance: 0.1 },
  ],
  
  steps: [
    {
      id: 'allocate',
      action: 'allocate-resources',
      strategy: allocationStrategy,
      input: {
        tasks: '${input.tasks}',
        agents: '${input.availableAgents}',
      },
    },
  ],
});
```

---

## Breeding Algorithms

Constraint Ranch uses genetic algorithms to evolve better agent strategies.

### Genetic Algorithm Integration

```typescript
import { 
  BreedingPipeline,
  FitnessEvaluator,
  SelectionStrategy 
} from '@constraint-flow/ranch-bridge';

// Breeding configuration from ranch
const breedingPipeline = new BreedingPipeline({
  // Population parameters
  populationSize: 100,
  eliteRatio: 0.1,
  mutationRate: 0.05,
  crossoverRate: 0.7,
  
  // Fitness evaluation
  fitnessEvaluator: new FitnessEvaluator({
    criteria: [
      { name: 'accuracy', weight: 0.4 },
      { name: 'speed', weight: 0.3 },
      { name: 'constraint_satisfaction', weight: 0.3 },
    ],
  }),
  
  // Selection strategy
  selection: new SelectionStrategy({
    method: 'tournament',
    tournamentSize: 5,
  }),
});

// Export best strategies to Flow
const topStrategies = await breedingPipeline.getTopStrategies(10);
```

### Strategy Export

```typescript
// Export breeding results to Constraint Flow
import { exportToStrategies } from '@constraint-flow/ranch-bridge';

const flowStrategies = await exportToStrategies({
  // Source: ranch breeding results
  source: 'ranch://breeding/spatial-routing/v5',
  
  // Target: flow workflow
  target: 'flow://workflows/task-routing',
  
  // Export options
  options: {
    includeScores: true,
    includeMetadata: true,
    format: 'constraint-flow-v1',
  },
});
```

### Cross-Breeding Workflows

```typescript
const crossBreedingWorkflow = defineWorkflow({
  name: 'agent-evolution',
  
  steps: [
    // Evaluate current agent performance
    {
      id: 'evaluate-agents',
      action: 'evaluate',
      input: {
        agents: '${input.agentPool}',
        criteria: ['accuracy', 'latency', 'constraint_satisfaction'],
      },
    },
    
    // Select top performers (ranch breeding algorithm)
    {
      id: 'select-elite',
      action: 'select-elite',
      input: {
        evaluations: '${steps.evaluate-agents.results}',
        eliteRatio: 0.2,
      },
    },
    
    // Cross-breed strategies
    {
      id: 'cross-breed',
      action: 'cross-breed',
      input: {
        parents: '${steps.select-elite.elite}',
        crossoverPoints: 3,
        mutationRate: 0.05,
      },
    },
    
    // Deploy improved strategies
    {
      id: 'deploy',
      action: 'deploy-strategies',
      input: {
        strategies: '${steps.cross-breed.offspring}',
        environment: 'staging',
      },
    },
  ],
});
```

---

## Scoring Integration

Performance scores from Ranch influence agent selection in Flow.

### Score Import

```typescript
import { ScoreImporter, ScoreCache } from '@constraint-flow/ranch-bridge';

// Import scores from Ranch
const scoreImporter = new ScoreImporter({
  source: 'ranch://scores/latest',
  refreshInterval: 3600000, // 1 hour
});

// Score cache for fast lookup
const scoreCache = new ScoreCache({
  maxSize: 10000,
  ttl: 86400000, // 24 hours
});

// Sync scores
await scoreImporter.sync();
```

### Score-Based Routing

```typescript
const scoreBasedWorkflow = defineWorkflow({
  name: 'score-based-routing',
  
  orchestration: {
    strategy: 'score-weighted',
    
    // Ranch score integration
    scoreSource: 'ranch://scores/agents',
    scoreWeights: {
      accuracy: 0.4,
      speed: 0.3,
      constraintSatisfaction: 0.3,
    },
    
    // Routing configuration
    routingStrategy: {
      method: 'weighted-random',
      explorationRate: 0.1,  // 10% exploration
      exploitationRate: 0.9, // 90% exploitation
    },
  },
  
  steps: [
    {
      id: 'route-by-score',
      action: 'route-weighted',
      input: {
        task: '${input.task}',
        considerScores: true,
        minScoreThreshold: 0.7,
      },
    },
  ],
});
```

### Score Schema

```typescript
interface RanchScore {
  // Agent identification
  agentId: string;
  agentType: 'cattle' | 'duck' | 'sheep' | 'goat' | 'horse' | 'eagle' | 'chicken' | 'hog';
  
  // Composite scores
  overall: number;          // 0.0 - 1.0
  
  // Component scores
  components: {
    accuracy: number;       // Correctness of results
    speed: number;          // Response time performance
    constraintSatisfaction: number;  // How well constraints are met
    collaboration: number;  // Performance in multi-agent scenarios
    adaptability: number;   // Performance on novel tasks
  };
  
  // Puzzle-specific scores
  puzzleScores: {
    spatial: number;
    allocation: number;
    consensus: number;
    timing: number;
  };
  
  // Metadata
  evaluatedAt: string;
  sampleSize: number;
  confidenceInterval: [number, number];
}
```

### Real-Time Score Updates

```typescript
import { ScoreWatcher } from '@constraint-flow/ranch-bridge';

// Watch for score updates
const scoreWatcher = new ScoreWatcher({
  agents: ['cattle-email-1', 'duck-api-1'],
  onUpdate: async (update) => {
    console.log(`Score update for ${update.agentId}: ${update.newScore.overall}`);
    
    // Re-route tasks based on new scores
    await router.rebalance(update.agentId, update.newScore);
  },
});

// Start watching
scoreWatcher.start();
```

---

## Training Pipeline

### End-to-End Training Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  AGENT TRAINING PIPELINE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PUZZLE GENERATION (constraint-ranch)                        │
│     ┌────────────────────────────────────────────────────────┐ │
│     │  • Generate spatial puzzles                            │ │
│     │  • Create constraint scenarios                         │ │
│     │  • Design coordination challenges                      │ │
│     └────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  2. AGENT TRAINING (constraint-ranch)                          │
│     ┌────────────────────────────────────────────────────────┐ │
│     │  • Train on puzzles                                    │ │
│     │  • Evaluate performance                                │ │
│     │  • Breed improved strategies                           │ │
│     └────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  3. VALIDATION (constraint-ranch → constraint-flow)            │
│     ┌────────────────────────────────────────────────────────┐ │
│     │  • Validate on test puzzles                            │ │
│     │  • Test on staging workflows                           │ │
│     │  • Compare with baseline                               │ │
│     └────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  4. DEPLOYMENT (constraint-flow)                               │
│     ┌────────────────────────────────────────────────────────┐ │
│     │  • Deploy to production                                │ │
│     │  • Monitor performance                                 │ │
│     │  • Collect feedback for next training cycle            │ │
│     └────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Training Configuration

```typescript
import { TrainingPipeline, PuzzleLoader } from '@constraint-flow/ranch-bridge';

const pipeline = new TrainingPipeline({
  // Puzzle configuration
  puzzles: {
    source: 'ranch://puzzles/latest',
    types: ['spatial', 'allocation', 'consensus', 'timing'],
    difficulty: 'adaptive',
  },
  
  // Training configuration
  training: {
    episodes: 10000,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2,
  },
  
  // Evaluation configuration
  evaluation: {
    metrics: ['accuracy', 'speed', 'constraint_satisfaction'],
    thresholds: {
      accuracy: 0.9,
      speed: 0.8,
      constraint_satisfaction: 0.95,
    },
  },
  
  // Export configuration
  export: {
    target: 'flow://agents/production',
    format: 'constraint-flow-v1',
    includeMetadata: true,
  },
});

// Run training
const result = await pipeline.run();
console.log(`Trained ${result.agents.length} agents`);
console.log(`Average score: ${result.averageScore}`);
```

### Continuous Training

```typescript
// Set up continuous training pipeline
const continuousTraining = new ContinuousTrainingPipeline({
  // Trigger configuration
  triggers: {
    scheduled: '0 2 * * *',  // Daily at 2 AM
    threshold: { minSamples: 1000 },
    performance: { degradeThreshold: 0.05 },
  },
  
  // Training parameters
  pipeline: pipeline,
  
  // Deployment strategy
  deployment: {
    strategy: 'canary',
    canaryRatio: 0.1,
    rollbackThreshold: 0.1,
  },
  
  // Notifications
  notifications: {
    onSuccess: ['slack://ml-team'],
    onFailure: ['slack://ml-team', 'pagerduty://oncall'],
  },
});

// Start continuous training
continuousTraining.start();
```

---

## Integration API Reference

### RanchBridge Module

```typescript
import {
  // Router integration
  SpatialRouter,
  AllocationStrategy,
  
  // Breeding integration
  BreedingPipeline,
  FitnessEvaluator,
  SelectionStrategy,
  
  // Score integration
  ScoreImporter,
  ScoreCache,
  ScoreWatcher,
  
  // Training integration
  TrainingPipeline,
  ContinuousTrainingPipeline,
  PuzzleLoader,
  
  // Export/Import
  exportToStrategies,
  importFromRanch,
} from '@constraint-flow/ranch-bridge';
```

### Configuration Schema

```typescript
interface RanchBridgeConfig {
  // Connection configuration
  ranchUrl: string;
  apiKey: string;
  
  // Cache configuration
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  
  // Sync configuration
  sync: {
    interval: number;
    retryAttempts: number;
    retryDelay: number;
  };
  
  // Training configuration
  training: {
    enabled: boolean;
    autoDeploy: boolean;
    validationRequired: boolean;
  };
}
```

---

## Related Documentation

- [constraint-ranch](https://github.com/SuperInstance/constraint-ranch) - Training platform
- [Core Integration](./CORE_INTEGRATION.md) - Rust library integration
- [Workflow Patterns](./WORKFLOW_PATTERNS.md) - Production workflow patterns
- [Multi-Agent Orchestration](../examples/multi-agent-workflow.ts) - Example implementation

---

**Last Updated**: 2025-01-27
**Document Version**: 1.0.0
