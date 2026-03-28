/**
 * Integration Examples
 * 
 * Ready-to-use integration templates for common enterprise systems.
 * Each integration includes connectors, workflows, and best practices.
 */

// ============================================
// Slack Integration
// ============================================

export const slackIntegration = {
  name: 'slack-alerting',
  version: '1.0.0',
  
  connector: {
    name: 'slack',
    auth: 'oauth2',
    scopes: ['chat:write', 'channels:read'],
    
    operations: {
      sendMessage: {
        input: { channel: 'string', text: 'string', blocks: 'any[]?' },
        output: { ts: 'string', ok: 'boolean' }
      },
      updateMessage: {
        input: { channel: 'string', ts: 'string', text: 'string' },
        output: { ok: 'boolean' }
      }
    }
  },

  workflows: [
    {
      name: 'alert-on-failure',
      trigger: 'webhook',
      steps: [
        { connector: 'slack', operation: 'sendMessage' }
      ],
      constraints: [
        { type: 'rate-limit', maxPerMinute: 20 }
      ]
    }
  ]
};

// ============================================
// Jira Integration
// ============================================

export const jiraIntegration = {
  name: 'jira-ticketing',
  version: '1.0.0',
  
  connector: {
    name: 'jira',
    auth: 'api-token',
    
    operations: {
      createIssue: {
        input: { project: 'string', summary: 'string', type: 'string', priority: 'string' },
        output: { key: 'string', id: 'string' }
      },
      transitionIssue: {
        input: { key: 'string', transition: 'string' },
        output: { success: 'boolean' }
      },
      addComment: {
        input: { key: 'string', body: 'string' },
        output: { id: 'string' }
      }
    }
  },

  workflows: [
    {
      name: 'auto-ticket-from-alert',
      trigger: 'webhook',
      steps: [
        { connector: 'jira', operation: 'createIssue' },
        { connector: 'slack', operation: 'sendMessage' }
      ]
    }
  ]
};

// ============================================
// Salesforce Integration
// ============================================

export const salesforceIntegration = {
  name: 'salesforce-crm',
  version: '1.0.0',
  
  connector: {
    name: 'salesforce',
    auth: 'oauth2',
    
    operations: {
      createLead: {
        input: { firstName: 'string', lastName: 'string', company: 'string', email: 'string' },
        output: { id: 'string', success: 'boolean' }
      },
      updateOpportunity: {
        input: { id: 'string', stage: 'string', amount: 'number?' },
        output: { success: 'boolean' }
      },
      query: {
        input: { soql: 'string' },
        output: { records: 'any[]', totalSize: 'number' }
      }
    }
  },

  workflows: [
    {
      name: 'lead-enrichment',
      trigger: 'webhook',
      steps: [
        { connector: 'salesforce', operation: 'createLead' },
        { connector: 'clearbit', operation: 'enrich' }, // hypothetical
        { connector: 'salesforce', operation: 'updateLead' }
      ],
      constraints: [
        { type: 'idempotency', key: '${email}' }
      ]
    }
  ]
};

// ============================================
// Database Integration
// ============================================

export const databaseIntegration = {
  name: 'database-operations',
  version: '1.0.0',
  
  connectors: [
    {
      name: 'postgres',
      type: 'sql',
      operations: {
        query: { input: { sql: 'string', params: 'any[]?' } },
        insert: { input: { table: 'string', data: 'object' } },
        update: { input: { table: 'string', data: 'object', where: 'object' } }
      }
    },
    {
      name: 'redis',
      type: 'key-value',
      operations: {
        get: { input: { key: 'string' } },
        set: { input: { key: 'string', value: 'any', ttl: 'number?' } },
        delete: { input: { key: 'string' } }
      }
    }
  ]
};

// ============================================
// Combined Integration: DevOps Alerting
// ============================================

export const devopsAlertingIntegration = {
  name: 'devops-alerting',
  version: '1.0.0',
  description: 'Complete DevOps alerting pipeline with incident management',
  
  connectors: [
    slackIntegration.connector,
    jiraIntegration.connector,
    databaseIntegration.connectors[1] // Redis for deduplication
  ],

  workflows: [
    {
      name: 'incident-response',
      description: 'Automated incident response with escalation',
      
      trigger: {
        type: 'webhook',
        path: '/incident'
      },

      steps: [
        // Deduplicate
        {
          id: 'check-duplicate',
          connector: 'redis',
          operation: 'get',
          input: { key: 'incident:${input.fingerprint}' }
        },
        
        // Create ticket if new
        {
          id: 'create-ticket',
          connector: 'jira',
          operation: 'createIssue',
          condition: '${!steps.check-duplicate.result}',
          input: {
            project: 'OPS',
            summary: '${input.title}',
            type: 'Incident',
            priority: '${input.severity}'
          }
        },
        
        // Store tracking
        {
          id: 'store-incident',
          connector: 'redis',
          operation: 'set',
          condition: '${steps.create-ticket.result}',
          input: {
            key: 'incident:${input.fingerprint}',
            value: '${steps.create-ticket.result.key}',
            ttl: 3600
          }
        },
        
        // Alert team
        {
          id: 'alert-slack',
          connector: 'slack',
          operation: 'sendMessage',
          input: {
            channel: '${input.severity === "critical" ? "#incidents-critical" : "#incidents"}',
            text: '🚨 Incident: ${input.title}\nTicket: ${steps.create-ticket.result.key}'
          }
        }
      ],

      constraints: [
        { type: 'time', maxDuration: 10000 },
        { type: 'retry', maxAttempts: 3 },
        { type: 'rate-limit', maxPerMinute: 100 }
      ],

      compensation: {
        'create-ticket': {
          connector: 'jira',
          operation: 'transitionIssue',
          input: { key: '${steps.create-ticket.result.key}', transition: 'Cancelled' }
        }
      }
    }
  ]
};
