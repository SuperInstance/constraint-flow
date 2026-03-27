/**
 * Multi-Agent Orchestration Example
 * 
 * This example demonstrates how to coordinate multiple AI agents
 * with constraint-based guarantees for complex enterprise workflows.
 */

import {
  Workflow,
  AgentPool,
  AgentTask,
  Constraint,
  Orchestrator
} from '@constraint-flow/core';

// ============================================
// Agent Definitions
// ============================================

interface AgentCapabilities {
  name: string;
  skills: string[];
  maxConcurrent: number;
  avgLatency: number;
}

const agents: AgentCapabilities[] = [
  { name: 'research-agent', skills: ['search', 'summarize'], maxConcurrent: 5, avgLatency: 2000 },
  { name: 'analysis-agent', skills: ['analyze', 'correlate'], maxConcurrent: 3, avgLatency: 5000 },
  { name: 'writer-agent', skills: ['write', 'edit'], maxConcurrent: 2, avgLatency: 3000 },
  { name: 'reviewer-agent', skills: ['review', 'approve'], maxConcurrent: 1, avgLatency: 4000 }
];

// ============================================
// Multi-Agent Workflow
// ============================================

const reportGenerationWorkflow: Workflow = {
  name: 'generate-report',
  version: '1.0.0',
  description: 'Multi-agent report generation with quality guarantees',

  constraints: [
    {
      name: 'total-time-budget',
      type: 'time',
      config: { maxDuration: 120000 } // 2 minutes max
    },
    {
      name: 'quality-threshold',
      type: 'validation',
      config: {
        validator: 'quality-score',
        minValue: 0.85
      }
    }
  ],

  steps: [
    // Phase 1: Research (parallel)
    {
      id: 'research-phase',
      type: 'parallel',
      branches: [
        {
          id: 'market-research',
          agent: 'research-agent',
          operation: 'search',
          input: { topic: '${input.market}', depth: 'comprehensive' }
        },
        {
          id: 'competitor-analysis',
          agent: 'research-agent',
          operation: 'search',
          input: { topic: '${input.competitors}', depth: 'detailed' }
        },
        {
          id: 'trend-analysis',
          agent: 'research-agent',
          operation: 'search',
          input: { topic: '${input.trends}', depth: 'overview' }
        }
      ],
      constraints: [
        { type: 'time', config: { maxDuration: 30000 } },
        { type: 'retry', config: { maxAttempts: 2 } }
      ]
    },

    // Phase 2: Analysis (depends on research)
    {
      id: 'analysis-phase',
      type: 'parallel',
      dependsOn: ['research-phase'],
      branches: [
        {
          id: 'synthesize-findings',
          agent: 'analysis-agent',
          operation: 'analyze',
          input: {
            marketData: '${steps.market-research.result}',
            competitorData: '${steps.competitor-analysis.result}'
          }
        },
        {
          id: 'correlate-trends',
          agent: 'analysis-agent',
          operation: 'correlate',
          input: {
            trendData: '${steps.trend-analysis.result}',
            marketContext: '${input.market}'
          }
        }
      ]
    },

    // Phase 3: Writing (sequential, depends on analysis)
    {
      id: 'write-executive-summary',
      agent: 'writer-agent',
      operation: 'write',
      dependsOn: ['analysis-phase'],
      input: {
        type: 'executive-summary',
        analysisResults: '${steps.synthesize-findings.result}',
        trendResults: '${steps.correlate-trends.result}'
      }
    },
    {
      id: 'write-detailed-report',
      agent: 'writer-agent',
      operation: 'write',
      dependsOn: ['write-executive-summary'],
      input: {
        type: 'detailed-report',
        summary: '${steps.write-executive-summary.result}',
        analysis: '${steps.synthesize-findings.result}',
        trends: '${steps.correlate-trends.result}'
      }
    },

    // Phase 4: Review
    {
      id: 'quality-review',
      agent: 'reviewer-agent',
      operation: 'review',
      dependsOn: ['write-detailed-report'],
      input: {
        document: '${steps.write-detailed-report.result}',
        criteria: ['accuracy', 'clarity', 'completeness']
      },
      constraints: [
        {
          type: 'validation',
          config: {
            validator: 'quality-check',
            requireApproval: true
          }
        }
      ]
    }
  ],

  // Agent coordination rules
  orchestration: {
    strategy: 'capability-based',
    loadBalancing: 'least-loaded',
    fallback: 'retry-with-different-agent',
    timeout: {
      agent: 60000,
      step: 90000,
      workflow: 120000
    }
  },

  // Quality gates between phases
  qualityGates: [
    {
      after: 'research-phase',
      check: 'completeness',
      threshold: 0.8
    },
    {
      after: 'analysis-phase',
      check: 'insight-quality',
      threshold: 0.75
    },
    {
      after: 'write-detailed-report',
      check: 'readability',
      threshold: 0.7
    }
  ]
};

// ============================================
// Execution Example
// ============================================

async function runMultiAgentWorkflow() {
  const orchestrator = new Orchestrator({
    agents: agents.map(a => ({
      name: a.name,
      pool: new AgentPool(a)
    })),
    strategy: 'capability-based'
  });

  orchestrator.register(reportGenerationWorkflow);

  const input = {
    market: 'Enterprise SaaS Market 2024',
    competitors: ['Salesforce', 'HubSpot', 'Zendesk'],
    trends: ['AI Integration', 'Platform Consolidation', 'Usage-Based Pricing']
  };

  const result = await orchestrator.execute('generate-report', input);

  console.log('Workflow completed:', result.success);
  console.log('Agent utilization:', result.metrics.agentUtilization);
  console.log('Total time:', result.duration, 'ms');
  console.log('Quality score:', result.qualityScore);
}

export { reportGenerationWorkflow, runMultiAgentWorkflow };
