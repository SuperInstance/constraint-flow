/**
 * Incident Response Workflow Template
 * 
 * A comprehensive incident management workflow with automated alerting,
 * escalation, and resolution tracking. Integrates with Slack, Jira,
 * and monitoring systems for end-to-end incident handling.
 * 
 * @module templates/incident-response
 * @version 1.0.0
 */

import { defineWorkflow } from '../src';
import type { Workflow, WorkflowStep, WorkflowConstraint } from '../src/types';

// ============================================
// Type Definitions
// ============================================

export interface IncidentData {
  incidentId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'detected' | 'investigating' | 'identified' | 'monitoring' | 'resolved';
  
  // Source information
  source: {
    system: string;
    service: string;
    environment: 'production' | 'staging' | 'development';
    region?: string;
    detectedBy: 'monitoring' | 'user-report' | 'automated' | 'manual';
    detectedAt: string;
  };
  
  // Impact assessment
  impact: {
    affectedUsers?: number;
    affectedServices: string[];
    customerFacing: boolean;
    dataLoss: boolean;
    securityIncident: boolean;
  };
  
  // Technical details
  technical: {
    errorMessages?: string[];
    stackTraces?: string[];
    logs?: string[];
    metrics?: Record<string, number>;
    relatedIncidents?: string[];
  };
  
  // Response team
  response: {
    incidentCommander?: string;
    communicationsLead?: string;
    technicalLead?: string;
    onCallEngineer?: string;
  };
  
  // Timeline
  timeline: Array<{
    timestamp: string;
    event: string;
    actor: string;
    details?: string;
  }>;
  
  // Resolution
  resolution?: {
    rootCause: string;
    fix: string;
    preventiveActions: string[];
    postmortemUrl?: string;
    resolvedAt: string;
    resolvedBy: string;
  };
}

export interface IncidentWorkflowContext {
  incident: IncidentData;
  slackChannel?: string;
  jiraIssue?: string;
  runbookExecuted?: boolean;
  stakeholders?: string[];
}

// ============================================
// Severity Configuration
// ============================================

export const SEVERITY_CONFIG = {
  critical: {
    color: '#dc3545',
    emoji: '🔴',
    slaMinutes: 15,
    escalationDelay: 5,
    notifyChannels: ['#incidents-critical', '#executive-alerts'],
    requireIncidentCommander: true,
    autoCreateJira: true,
    pageOnCall: true,
    generatePostmortem: true
  },
  high: {
    color: '#fd7e14',
    emoji: '🟠',
    slaMinutes: 30,
    escalationDelay: 15,
    notifyChannels: ['#incidents-high'],
    requireIncidentCommander: true,
    autoCreateJira: true,
    pageOnCall: true,
    generatePostmortem: true
  },
  medium: {
    color: '#ffc107',
    emoji: '🟡',
    slaMinutes: 120,
    escalationDelay: 30,
    notifyChannels: ['#incidents'],
    requireIncidentCommander: false,
    autoCreateJira: true,
    pageOnCall: false,
    generatePostmortem: false
  },
  low: {
    color: '#28a745',
    emoji: '🟢',
    slaMinutes: 1440, // 24 hours
    escalationDelay: 240,
    notifyChannels: ['#incidents-low'],
    requireIncidentCommander: false,
    autoCreateJira: false,
    pageOnCall: false,
    generatePostmortem: false
  }
} as const;

// ============================================
// Workflow Definition
// ============================================

export const incidentResponseWorkflow: Workflow<IncidentWorkflowContext> = defineWorkflow({
  name: 'incident-response',
  version: '1.0.0',
  description: 'Automated incident response with escalation and resolution tracking',
  
  // ============================================
  // Trigger Configuration
  // ============================================
  
  trigger: {
    type: 'webhook',
    path: '/incidents',
    method: 'POST',
    authentication: 'required',
    deduplication: {
      key: '${input.incident.source.system}:${input.incident.title}',
      ttlMinutes: 60
    }
  },

  // ============================================
  // Input Schema
  // ============================================
  
  input: {
    type: 'object',
    required: ['incident'],
    properties: {
      incident: { $ref: '#/components/schemas/IncidentData' },
      suppressNotifications: { type: 'boolean', default: false },
      testMode: { type: 'boolean', default: false }
    }
  },

  // ============================================
  // Workflow Steps
  // ============================================
  
  steps: [
    // ----------------------------------------
    // Step 1: Create Incident Channel
    // ----------------------------------------
    {
      id: 'create-incident-channel',
      name: 'Create Incident Channel',
      connector: 'slack',
      operation: 'createConversation',
      condition: '${SEVERITY_CONFIG[input.incident.severity].requireIncidentCommander}',
      
      input: {
        name: 'incident-${input.incident.incidentId.toLowerCase()}',
        is_private: false,
        topic: '${input.incident.title} | Severity: ${input.incident.severity.toUpperCase()}'
      },
      
      output: {
        channelId: '${result.channel.id}',
        channelName: '${result.channel.name}'
      }
    },

    // ----------------------------------------
    // Step 2: Send Initial Alert
    // ----------------------------------------
    {
      id: 'send-alert',
      name: 'Send Initial Alert',
      connector: 'slack',
      operation: 'sendMessage',
      
      input: {
        channel: '${steps.create-incident-channel.result.channelId || SEVERITY_CONFIG[input.incident.severity].notifyChannels[0]}',
        blocks: [
          {
            type: 'header',
            text: { 
              type: 'plain_text', 
              text: '${SEVERITY_CONFIG[input.incident.severity].emoji} INCIDENT: ${input.incident.title}'
            }
          },
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: '*Severity:* ${input.incident.severity.toUpperCase()}' },
              { type: 'mrkdwn', text: '| *ID:* ${input.incident.incidentId}' },
              { type: 'mrkdwn', text: '| *Time:* ${input.incident.source.detectedAt}' }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Description:*\n${input.incident.description}'
            }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: '*Environment:*\n${input.incident.source.environment}' },
              { type: 'mrkdwn', text: '*Service:*\n${input.incident.source.service}' },
              { type: 'mrkdwn', text: '*Customer Facing:*\n${input.incident.impact.customerFacing ? "Yes" : "No"}' },
              { type: 'mrkdwn', text: '*Affected Users:*\n${input.incident.impact.affectedUsers || "Unknown"}' }
            ]
          },
          {
            type: 'actions',
            elements: [
              { type: 'button', text: { type: 'plain_text', text: '👤 Take Lead' }, action_id: 'take_lead', style: 'primary' },
              { type: 'button', text: { type: 'plain_text', text: '📖 View Runbook' }, action_id: 'view_runbook' },
              { type: 'button', text: { type: 'plain_text', text: '✅ Acknowledge' }, action_id: 'acknowledge' }
            ]
          }
        ],
        metadata: {
          incident_id: '${input.incident.incidentId}',
          severity: '${input.incident.severity}'
        }
      },
      
      output: {
        alertMessageTs: '${result.ts}'
      }
    },

    // ----------------------------------------
    // Step 3: Page On-Call Engineer
    // ----------------------------------------
    {
      id: 'page-oncall',
      name: 'Page On-Call Engineer',
      connector: 'pagerduty',
      operation: 'createIncident',
      condition: '${SEVERITY_CONFIG[input.incident.severity].pageOnCall}',
      
      input: {
        title: '[${input.incident.severity.toUpperCase()}] ${input.incident.title}',
        description: '${input.incident.description}\n\nIncident ID: ${input.incident.incidentId}',
        service: '${input.incident.source.service}',
        urgency: '${input.incident.severity === "critical" ? "high" : "low"}',
        incident_key: '${input.incident.incidentId}',
        custom_details: {
          source: '${input.incident.source}',
          impact: '${input.incident.impact}'
        }
      },
      
      output: {
        pagerDutyId: '${result.incident.id}',
        onCallEngineer: '${result.assignedTo}'
      }
    },

    // ----------------------------------------
    // Step 4: Create Jira Ticket
    // ----------------------------------------
    {
      id: 'create-jira-ticket',
      name: 'Create Jira Ticket',
      connector: 'jira',
      operation: 'createIssue',
      condition: '${SEVERITY_CONFIG[input.incident.severity].autoCreateJira}',
      
      input: {
        project: 'OPS',
        summary: '[INCIDENT] ${input.incident.title}',
        description: `
h2. Incident Details

* *Incident ID:* ${input.incident.incidentId}
* *Severity:* ${input.incident.severity.toUpperCase()}
* *Status:* ${input.incident.status}
* *Detected At:* ${input.incident.source.detectedAt}

h2. Impact

* *Customer Facing:* ${input.incident.impact.customerFacing}
* *Affected Services:* ${input.incident.impact.affectedServices.join(', ')}
* *Security Incident:* ${input.incident.impact.securityIncident}

h2. Description

${input.incident.description}

h2. Technical Details

${input.incident.technical.errorMessages?.map(e => `{code}${e}{code}`).join('\n') || 'No error messages captured'}

h2. Timeline

| Time | Event |
${input.incident.timeline.map(t => `| ${t.timestamp} | ${t.event} |`).join('\n')}
        `,
        issuetype: 'Incident',
        priority: '${input.incident.severity === "critical" ? "Highest" : input.incident.severity === "high" ? "High" : "Medium"}',
        labels: ['incident', input.incident.severity, input.incident.source.service.toLowerCase()],
        components: ['Operations']
      },
      
      output: {
        jiraKey: '${result.key}',
        jiraId: '${result.id}'
      }
    },

    // ----------------------------------------
    // Step 5: Execute Automated Runbook
    // ----------------------------------------
    {
      id: 'execute-runbook',
      name: 'Execute Automated Runbook',
      agent: 'duck-execute',
      action: 'execute_runbook',
      condition: '${input.incident.source.service && !input.testMode}',
      
      input: {
        service: '${input.incident.source.service}',
        incidentType: '${input.incident.technical.errorMessages?.[0] || "unknown"}',
        environment: '${input.incident.source.environment}',
        automatedActions: [
          'collect_logs',
          'capture_metrics',
          'check_dependencies',
          'verify_connectivity'
        ]
      },
      
      output: {
        runbookExecuted: '${result.executed}',
        diagnostics: '${result.diagnostics}',
        automatedFixApplied: '${result.fixApplied}'
      },
      
      timeout: 60000,
      retry: {
        maxAttempts: 1
      }
    },

    // ----------------------------------------
    // Step 6: Notify Additional Stakeholders
    // ----------------------------------------
    {
      id: 'notify-stakeholders',
      name: 'Notify Stakeholders',
      connector: 'slack',
      operation: 'sendMessage',
      condition: '${input.incident.impact.customerFacing && input.incident.severity === "critical"}',
      
      input: {
        channel: '#executive-alerts',
        text: '🚨 *CRITICAL CUSTOMER-FACING INCIDENT*\n\n${input.incident.title}\n\nImpact: ${input.incident.impact.affectedUsers || "Unknown"} users\nService: ${input.incident.source.service}\nIncident Channel: #incident-${input.incident.incidentId.toLowerCase()}'
      }
    },

    // ----------------------------------------
    // Step 7: Set Up Escalation Timer
    // ----------------------------------------
    {
      id: 'setup-escalation',
      name: 'Set Up Escalation Timer',
      action: 'scheduleEscalation',
      
      input: {
        incidentId: '${input.incident.incidentId}',
        severity: '${input.incident.severity}',
        escalationDelay: '${SEVERITY_CONFIG[input.incident.severity].escalationDelay}',
        escalationPath: [
          { delay: 5, action: 'page_secondary', role: 'secondary-oncall' },
          { delay: 15, action: 'page_manager', role: 'engineering-manager' },
          { delay: 30, action: 'page_director', role: 'engineering-director' },
          { delay: 60, action: 'page_vp', role: 'engineering-vp' }
        ]
      },
      
      output: {
        escalationId: '${result.id}'
      }
    },

    // ----------------------------------------
    // Step 8: Start Incident Timer
    // ----------------------------------------
    {
      id: 'start-timer',
      name: 'Start SLA Timer',
      action: 'startTimer',
      
      input: {
        timerId: 'incident-${input.incident.incidentId}',
        duration: '${SEVERITY_CONFIG[input.incident.severity].slaMinutes * 60 * 1000}',
        warningAt: '80%',
        events: {
          warning: {
            connector: 'slack',
            operation: 'sendMessage',
            input: {
              channel: '${steps.create-incident-channel.result.channelId}',
              text: '⚠️ SLA Warning: Incident ${input.incident.incidentId} approaching SLA breach'
            }
          },
          breach: {
            connector: 'slack',
            operation: 'sendMessage',
            input: {
              channel: '#incidents-critical',
              text: '🚨 SLA BREACH: Incident ${input.incident.incidentId} has exceeded ${input.incident.severity} SLA'
            }
          }
        }
      }
    },

    // ----------------------------------------
    // Step 9: Wait for Resolution
    // ----------------------------------------
    {
      id: 'wait-for-resolution',
      name: 'Wait for Resolution',
      action: 'wait',
      
      waitFor: {
        event: 'incident_resolved',
        correlationKey: '${input.incident.incidentId}',
        timeout: 7 * 24 * 60 * 60 * 1000, // 7 days max
        periodicUpdate: {
          interval: 60 * 60 * 1000, // 1 hour
          action: {
            connector: 'slack',
            operation: 'sendMessage',
            input: {
              channel: '${steps.create-incident-channel.result.channelId}',
              text: '⏰ Incident ${input.incident.incidentId} still open. Current duration: ${duration}'
            }
          }
        }
      },
      
      output: {
        resolution: '${event.resolution}'
      }
    },

    // ----------------------------------------
    // Step 10: Update Status
    // ----------------------------------------
    {
      id: 'update-incident-status',
      name: 'Update Incident Status',
      connector: 'jira',
      operation: 'transitionIssue',
      
      input: {
        issueKey: '${steps.create-jira-ticket.result.jiraKey}',
        transition: 'Resolved',
        comment: 'Incident resolved.\n\nRoot Cause: ${steps.wait-for-resolution.result.resolution.rootCause}\nFix: ${steps.wait-for-resolution.result.resolution.fix}'
      }
    },

    // ----------------------------------------
    // Step 11: Stop Timer
    // ----------------------------------------
    {
      id: 'stop-timer',
      name: 'Stop SLA Timer',
      action: 'stopTimer',
      
      input: {
        timerId: 'incident-${input.incident.incidentId}'
      },
      
      output: {
        totalDuration: '${result.duration}',
        slaMet: '${result.duration <= SEVERITY_CONFIG[input.incident.severity].slaMinutes * 60 * 1000}'
      }
    },

    // ----------------------------------------
    // Step 12: Send Resolution Notification
    // ----------------------------------------
    {
      id: 'notify-resolution',
      name: 'Send Resolution Notification',
      connector: 'slack',
      operation: 'updateMessage',
      
      input: {
        channel: '${steps.create-incident-channel.result.channelId}',
        ts: '${steps.send-alert.result.alertMessageTs}',
        blocks: [
          {
            type: 'header',
            text: { 
              type: 'plain_text', 
              text: '✅ RESOLVED: ${input.incident.title}'
            }
          },
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: '*Duration:* ${steps.stop-timer.result.totalDuration}' },
              { type: 'mrkdwn', text: '| *SLA Met:* ${steps.stop-timer.result.slaMet ? "Yes" : "No"}' }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Root Cause:*\n${steps.wait-for-resolution.result.resolution.rootCause}\n\n*Fix Applied:*\n${steps.wait-for-resolution.result.resolution.fix}'
            }
          }
        ]
      }
    },

    // ----------------------------------------
    // Step 13: Create Postmortem
    // ----------------------------------------
    {
      id: 'create-postmortem',
      name: 'Create Postmortem',
      connector: 'confluence',
      operation: 'createPage',
      condition: '${SEVERITY_CONFIG[input.incident.severity].generatePostmortem}',
      
      input: {
        title: 'Postmortem: ${input.incident.title}',
        space: 'INC',
        template: 'incident-postmortem',
        content: {
          incidentId: '${input.incident.incidentId}',
          summary: '${input.incident.description}',
          impact: '${input.incident.impact}',
          timeline: '${input.incident.timeline}',
          rootCause: '${steps.wait-for-resolution.result.resolution.rootCause}',
          resolution: '${steps.wait-for-resolution.result.resolution}',
          preventiveActions: '${steps.wait-for-resolution.result.resolution.preventiveActions}',
          totalDuration: '${steps.stop-timer.result.totalDuration}'
        }
      },
      
      output: {
        postmortemUrl: '${result.url}'
      }
    },

    // ----------------------------------------
    // Step 14: Archive Channel
    // ----------------------------------------
    {
      id: 'archive-channel',
      name: 'Archive Incident Channel',
      connector: 'slack',
      operation: 'archiveChannel',
      condition: '${steps.create-incident-channel.result.channelId}',
      delay: 24 * 60 * 60 * 1000, // Wait 24 hours after resolution
      
      input: {
        channel: '${steps.create-incident-channel.result.channelId}'
      }
    }
  ],

  // ============================================
  // Workflow Constraints
  // ============================================
  
  constraints: [
    // SLA constraint
    {
      type: 'sla',
      description: 'Incident must be resolved within SLA',
      config: {
        severityMap: {
          critical: 15,
          high: 30,
          medium: 120,
          low: 1440
        },
        unit: 'minutes',
        escalateOnBreach: true
      }
    },
    
    // Acknowledgment constraint
    {
      type: 'acknowledgment',
      description: 'Incident must be acknowledged by a human',
      config: {
        requiredFor: ['critical', 'high'],
        timeoutMinutes: 5,
        escalateOnTimeout: true
      }
    },
    
    // Communication constraint
    {
      type: 'communication',
      description: 'Customer-facing incidents require customer communication',
      config: {
        customerFacing: '${input.incident.impact.customerFacing}',
        notifyAfter: 30, // minutes
        template: 'customer-incident-notification'
      }
    },
    
    // Documentation constraint
    {
      type: 'documentation',
      description: 'All critical incidents require postmortem',
      config: {
        requiredFor: ['critical', 'high'],
        dueAfterHours: 72
      }
    }
  ],

  // ============================================
  // Error Handling
  // ============================================
  
  errorHandling: {
    strategy: 'continue',
    
    onError: [
      {
        error: 'SlackApiError',
        steps: ['fallback-email-notification'],
        continueWorkflow: true
      },
      {
        error: 'PagerDutyError',
        steps: ['manual-page-fallback'],
        continueWorkflow: true
      }
    ]
  },

  // ============================================
  // Events
  // ============================================
  
  events: {
    onStarted: {
      action: 'emit',
      event: 'incident.created',
      payload: '${input.incident}'
    },
    
    onCompleted: {
      action: 'emit',
      event: 'incident.resolved',
      payload: {
        incidentId: '${input.incident.incidentId}',
        duration: '${steps.stop-timer.result.totalDuration}',
        slaMet: '${steps.stop-timer.result.slaMet}',
        jiraKey: '${steps.create-jira-ticket.result.jiraKey}',
        postmortemUrl: '${steps.create-postmortem.result.postmortemUrl}'
      }
    }
  }
});

// ============================================
// Export
// ============================================

export default incidentResponseWorkflow;

// ============================================
// Usage Example
// ============================================

/**
 * @example Trigger incident response
 * ```typescript
 * import { incidentResponseWorkflow } from './templates/incident-response';
 * 
 * // Triggered by monitoring system
 * const result = await incidentResponseWorkflow.execute({
 *   incident: {
 *     incidentId: 'INC-2024-00123',
 *     title: 'API Gateway 5xx Error Rate Spike',
 *     description: 'API Gateway returning 5xx errors at 15% rate for /api/orders endpoint',
 *     severity: 'critical',
 *     status: 'detected',
 *     source: {
 *       system: 'api-gateway',
 *       service: 'orders-api',
 *       environment: 'production',
 *       detectedBy: 'monitoring',
 *       detectedAt: new Date().toISOString()
 *     },
 *     impact: {
 *       affectedServices: ['orders-api', 'checkout'],
 *       customerFacing: true,
 *       dataLoss: false,
 *       securityIncident: false
 *     },
 *     technical: {
 *       errorMessages: ['Connection refused to orders-db:5432']
 *     },
 *     timeline: [
 *       {
 *         timestamp: new Date().toISOString(),
 *         event: 'Incident detected by monitoring',
 *         actor: 'system'
 *       }
 *     ]
 *   }
 * });
 * 
 * console.log(`Incident channel: ${result.slackChannel}`);
 * console.log(`Jira ticket: ${result.jiraIssue}`);
 * ```
 */
