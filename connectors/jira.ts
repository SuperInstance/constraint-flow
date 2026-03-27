/**
 * Jira Connector
 * 
 * Enterprise Jira integration for issue tracking, project management,
 * and automated workflow triggers. Supports API token authentication
 * and comprehensive issue operations.
 * 
 * @module connectors/jira
 * @version 1.0.0
 */

import type { Connector, ConnectorConfig, OperationResult } from '../src/types';

// ============================================
// Type Definitions
// ============================================

export interface JiraConfig extends ConnectorConfig {
  /** Jira instance URL (e.g., https://company.atlassian.net) */
  baseUrl: string;
  /** API token authentication */
  auth: {
    type: 'api-token';
    email: string;
    apiToken: string;
  } | {
    type: 'oauth2';
    clientId: string;
    clientSecret: string;
  };
  /** Default project key */
  defaultProject?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: string | { type: string; version: number; content: any[] };
    status: { id: string; name: string };
    priority: { id: string; name: string };
    issuetype: { id: string; name: string };
    project: { id: string; key: string; name: string };
    assignee?: { accountId: string; displayName: string };
    reporter?: { accountId: string; displayName: string };
    labels?: string[];
    components?: Array<{ id: string; name: string }>;
    created: string;
    updated: string;
    duedate?: string;
    [key: string]: unknown;
  };
}

export interface JiraTransition {
  id: string;
  name: string;
  to: {
    id: string;
    name: string;
  };
  hasScreen: boolean;
}

export interface JiraUser {
  accountId: string;
  accountType: string;
  displayName: string;
  emailAddress?: string;
  active: boolean;
  avatarUrls: Record<string, string>;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  lead?: JiraUser;
}

// ============================================
// Connector Definition
// ============================================

export const jiraConnector: Connector<JiraConfig> = {
  name: 'jira',
  version: '1.0.0',
  description: 'Jira issue tracking integration for automated ticketing and workflow management',
  
  auth: {
    type: 'api-token',
    description: 'API token authentication with Atlassian account email',
    headerTemplate: 'Basic ${base64(email:apiToken)}',
    docs: 'https://id.atlassian.com/manage-profile/security/api-tokens'
  },

  rateLimits: {
    tier: 'standard',
    requestsPerMinute: 60,
    concurrentRequests: 5
  },

  retry: {
    maxAttempts: 3,
    backoff: 'exponential',
    baseDelayMs: 2000,
    retryOn: [429, 500, 502, 503, 504]
  },

  // ============================================
  // Operations
  // ============================================

  operations: {
    // ----------------------------------------
    // Issue Operations
    // ----------------------------------------

    createIssue: {
      name: 'createIssue',
      description: 'Create a new Jira issue',

      input: {
        type: 'object',
        required: ['project', 'summary', 'issuetype'],
        properties: {
          project: { 
            type: 'string', 
            description: 'Project key (e.g., PROJ)' 
          },
          summary: { 
            type: 'string', 
            description: 'Issue summary/title' 
          },
          description: { 
            type: 'string',
            description: 'Issue description (plain text or Atlassian Document Format)'
          },
          issuetype: { 
            type: 'string',
            description: 'Issue type name (e.g., Bug, Task, Story, Epic)',
            enum: ['Bug', 'Task', 'Story', 'Epic', 'Subtask', 'Incident', 'Service Request']
          },
          priority: { 
            type: 'string',
            description: 'Priority name',
            enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest']
          },
          assignee: { 
            type: 'string',
            description: 'Assignee account ID'
          },
          labels: { 
            type: 'array',
            items: { type: 'string' },
            description: 'Labels to add'
          },
          components: {
            type: 'array',
            items: { type: 'string' },
            description: 'Component names'
          },
          duedate: {
            type: 'string',
            format: 'date',
            description: 'Due date (YYYY-MM-DD)'
          },
          parent: {
            type: 'string',
            description: 'Parent issue key for subtasks'
          },
          customFields: {
            type: 'object',
            description: 'Custom field values by field ID or name'
          }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Issue ID' },
          key: { type: 'string', description: 'Issue key (e.g., PROJ-123)' },
          self: { type: 'string', description: 'API URL for the issue' }
        }
      },

      examples: [
        {
          name: 'Create a bug report',
          input: {
            project: 'PROJ',
            summary: 'Login button not responding on mobile',
            description: 'When tapping the login button on iOS Safari, nothing happens.',
            issuetype: 'Bug',
            priority: 'High',
            labels: ['mobile', 'auth']
          }
        },
        {
          name: 'Create an incident ticket',
          input: {
            project: 'OPS',
            summary: 'Production API latency spike',
            description: 'API response times exceeded 5s threshold for /api/orders endpoint',
            issuetype: 'Incident',
            priority: 'Highest',
            labels: ['production', 'performance'],
            assignee: '${variables.onCallEngineer}'
          }
        }
      ]
    },

    getIssue: {
      name: 'getIssue',
      description: 'Get details of a Jira issue',

      input: {
        type: 'object',
        required: ['issueKey'],
        properties: {
          issueKey: { 
            type: 'string',
            description: 'Issue key (e.g., PROJ-123)'
          },
          fields: { 
            type: 'array',
            items: { type: 'string' },
            description: 'Specific fields to return'
          },
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          key: { type: 'string' },
          fields: { type: 'object' }
        }
      }
    },

    updateIssue: {
      name: 'updateIssue',
      description: 'Update an existing issue',

      input: {
        type: 'object',
        required: ['issueKey'],
        properties: {
          issueKey: { type: 'string' },
          summary: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string' },
          assignee: { type: 'string' },
          labels: { type: 'array', items: { type: 'string' } },
          duedate: { type: 'string', format: 'date' },
          customFields: { type: 'object' }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          key: { type: 'string' }
        }
      }
    },

    deleteIssue: {
      name: 'deleteIssue',
      description: 'Delete an issue',

      input: {
        type: 'object',
        required: ['issueKey'],
        properties: {
          issueKey: { type: 'string' },
          deleteSubtasks: { type: 'boolean', default: false }
        }
      },

      output: {
        type: 'object',
        properties: {}
      }
    },

    // ----------------------------------------
    // Transition Operations
    // ----------------------------------------

    getTransitions: {
      name: 'getTransitions',
      description: 'Get available transitions for an issue',

      input: {
        type: 'object',
        required: ['issueKey'],
        properties: {
          issueKey: { type: 'string' }
        }
      },

      output: {
        type: 'object',
        properties: {
          transitions: { 
            type: 'array',
            items: { $ref: '#/components/schemas/JiraTransition' }
          }
        }
      }
    },

    transitionIssue: {
      name: 'transitionIssue',
      description: 'Transition an issue to a new status',

      input: {
        type: 'object',
        required: ['issueKey', 'transition'],
        properties: {
          issueKey: { type: 'string' },
          transition: { 
            type: 'string',
            description: 'Transition name or ID (e.g., "In Progress", "Done")'
          },
          fields: {
            type: 'object',
            description: 'Fields to set during transition (if screen present)'
          },
          comment: {
            type: 'string',
            description: 'Comment to add during transition'
          }
        }
      },

      output: {
        type: 'object',
        properties: {
          success: { type: 'boolean' }
        }
      },

      examples: [
        {
          name: 'Mark issue as in progress',
          input: {
            issueKey: 'PROJ-123',
            transition: 'In Progress',
            comment: 'Starting work on this issue'
          }
        },
        {
          name: 'Resolve issue',
          input: {
            issueKey: 'PROJ-123',
            transition: 'Done',
            fields: {
              resolution: 'Fixed'
            },
            comment: 'Fixed in PR #456'
          }
        }
      ]
    },

    // ----------------------------------------
    // Comment Operations
    // ----------------------------------------

    addComment: {
      name: 'addComment',
      description: 'Add a comment to an issue',

      input: {
        type: 'object',
        required: ['issueKey', 'body'],
        properties: {
          issueKey: { type: 'string' },
          body: { 
            type: 'string',
            description: 'Comment text (supports Atlassian Document Format)'
          },
          visibility: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['group', 'role'] },
              value: { type: 'string', description: 'Group name or role name' }
            }
          }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          self: { type: 'string' }
        }
      }
    },

    getComments: {
      name: 'getComments',
      description: 'Get all comments for an issue',

      input: {
        type: 'object',
        required: ['issueKey'],
        properties: {
          issueKey: { type: 'string' },
          startAt: { type: 'number', default: 0 },
          maxResults: { type: 'number', default: 50 }
        }
      },

      output: {
        type: 'object',
        properties: {
          comments: { type: 'array', items: { type: 'object' } },
          total: { type: 'number' }
        }
      }
    },

    // ----------------------------------------
    // Search Operations
    // ----------------------------------------

    searchIssues: {
      name: 'searchIssues',
      description: 'Search for issues using JQL',

      input: {
        type: 'object',
        required: ['jql'],
        properties: {
          jql: { 
            type: 'string',
            description: 'JQL query string'
          },
          fields: {
            type: 'array',
            items: { type: 'string' },
            default: ['summary', 'status', 'priority', 'assignee']
          },
          startAt: { type: 'number', default: 0 },
          maxResults: { type: 'number', default: 50 }
        }
      },

      output: {
        type: 'object',
        properties: {
          issues: { 
            type: 'array',
            items: { $ref: '#/components/schemas/JiraIssue' }
          },
          total: { type: 'number' },
          startAt: { type: 'number' },
          maxResults: { type: 'number' }
        }
      },

      examples: [
        {
          name: 'Find open bugs',
          input: {
            jql: 'project = PROJ AND type = Bug AND status != Done ORDER BY priority DESC',
            maxResults: 20
          }
        },
        {
          name: 'Find issues due this week',
          input: {
            jql: 'duedate <= endOfWeek() AND duedate >= startOfDay() AND status != Done'
          }
        }
      ]
    },

    // ----------------------------------------
    // Project Operations
    // ----------------------------------------

    getProject: {
      name: 'getProject',
      description: 'Get project details',

      input: {
        type: 'object',
        required: ['projectKey'],
        properties: {
          projectKey: { type: 'string' }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          key: { type: 'string' },
          name: { type: 'string' },
          lead: { type: 'object' }
        }
      }
    },

    listProjects: {
      name: 'listProjects',
      description: 'List all accessible projects',

      input: {
        type: 'object',
        properties: {
          expand: { type: 'string', description: 'Fields to expand' }
        }
      },

      output: {
        type: 'object',
        properties: {
          values: { 
            type: 'array',
            items: { $ref: '#/components/schemas/JiraProject' }
          }
        }
      }
    },

    // ----------------------------------------
    // User Operations
    // ----------------------------------------

    getUser: {
      name: 'getUser',
      description: 'Get user details',

      input: {
        type: 'object',
        required: ['accountId'],
        properties: {
          accountId: { type: 'string' }
        }
      },

      output: {
        type: 'object',
        properties: {
          accountId: { type: 'string' },
          displayName: { type: 'string' },
          emailAddress: { type: 'string' },
          active: { type: 'boolean' }
        }
      }
    },

    findUsers: {
      name: 'findUsers',
      description: 'Search for users',

      input: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', description: 'Search query' },
          maxResults: { type: 'number', default: 10 }
        }
      },

      output: {
        type: 'object',
        properties: {
          values: { 
            type: 'array',
            items: { $ref: '#/components/schemas/JiraUser' }
          }
        }
      }
    },

    // ----------------------------------------
    // Attachment Operations
    // ----------------------------------------

    addAttachment: {
      name: 'addAttachment',
      description: 'Add attachment to an issue',

      input: {
        type: 'object',
        required: ['issueKey', 'filename', 'content'],
        properties: {
          issueKey: { type: 'string' },
          filename: { type: 'string' },
          content: { 
            type: 'string',
            description: 'File content (base64 encoded or URL)'
          },
          mimeType: { type: 'string' }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          filename: { type: 'string' },
          content: { type: 'string', description: 'Attachment URL' }
        }
      }
    }
  },

  // ============================================
  // Events (Webhooks)
  // ============================================

  events: {
    issue_created: {
      name: 'issue_created',
      description: 'Triggered when an issue is created',
      schema: {
        type: 'object',
        properties: {
          issue: { $ref: '#/components/schemas/JiraIssue' },
          user: { $ref: '#/components/schemas/JiraUser' },
          changelog: { type: 'object' }
        }
      }
    },

    issue_updated: {
      name: 'issue_updated',
      description: 'Triggered when an issue is updated',
      schema: {
        type: 'object',
        properties: {
          issue: { $ref: '#/components/schemas/JiraIssue' },
          user: { $ref: '#/components/schemas/JiraUser' },
          changelog: {
            type: 'object',
            properties: {
              items: { type: 'array' }
            }
          }
        }
      }
    },

    issue_transitioned: {
      name: 'issue_transitioned',
      description: 'Triggered when an issue status changes',
      schema: {
        type: 'object',
        properties: {
          issue: { $ref: '#/components/schemas/JiraIssue' },
          user: { $ref: '#/components/schemas/JiraUser' },
          transition: {
            type: 'object',
            properties: {
              from_status: { type: 'string' },
              to_status: { type: 'string' }
            }
          }
        }
      }
    },

    comment_created: {
      name: 'comment_created',
      description: 'Triggered when a comment is added',
      schema: {
        type: 'object',
        properties: {
          issue: { $ref: '#/components/schemas/JiraIssue' },
          comment: { type: 'object' },
          user: { $ref: '#/components/schemas/JiraUser' }
        }
      }
    }
  },

  // ============================================
  // Constraints
  // ============================================

  constraints: [
    {
      type: 'rate-limit',
      description: 'Jira API rate limits',
      config: { maxPerMinute: 60 }
    },
    {
      type: 'jql-complexity',
      description: 'JQL queries must not exceed complexity limits',
      config: { maxClauses: 100 }
    },
    {
      type: 'required-fields',
      description: 'All required fields must be provided for issue creation',
      config: { enforceRequiredFields: true }
    }
  ],

  // ============================================
  // Helper Methods
  // ============================================

  helpers: {
    /**
     * Build JQL query from filter object
     */
    buildJQL(filters: {
      project?: string;
      status?: string[];
      assignee?: string;
      priority?: string[];
      issuetype?: string[];
      labels?: string[];
      createdAfter?: string;
      updatedAfter?: string;
      custom?: string;
    }): string {
      const clauses: string[] = [];

      if (filters.project) {
        clauses.push(`project = "${filters.project}"`);
      }
      if (filters.status?.length) {
        clauses.push(`status in (${filters.status.map(s => `"${s}"`).join(', ')})`);
      }
      if (filters.assignee) {
        clauses.push(`assignee = "${filters.assignee}"`);
      }
      if (filters.priority?.length) {
        clauses.push(`priority in (${filters.priority.map(p => `"${p}"`).join(', ')})`);
      }
      if (filters.issuetype?.length) {
        clauses.push(`issuetype in (${filters.issuetype.map(t => `"${t}"`).join(', ')})`);
      }
      if (filters.labels?.length) {
        clauses.push(`labels in (${filters.labels.map(l => `"${l}"`).join(', ')})`);
      }
      if (filters.createdAfter) {
        clauses.push(`created >= "${filters.createdAfter}"`);
      }
      if (filters.updatedAfter) {
        clauses.push(`updated >= "${filters.updatedAfter}"`);
      }
      if (filters.custom) {
        clauses.push(filters.custom);
      }

      return clauses.join(' AND ');
    },

    /**
     * Format issue for Slack notification
     */
    formatIssueForSlack(issue: JiraIssue): string {
      const priorityEmoji = {
        'Highest': '🔴',
        'High': '🟠',
        'Medium': '🟡',
        'Low': '🟢',
        'Lowest': '⚪'
      }[issue.fields.priority?.name || 'Medium'] || '⚪';

      return `${priorityEmoji} [${issue.key}] ${issue.fields.summary}
Status: ${issue.fields.status.name}
Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}
${issue.fields.description ? `\n${typeof issue.fields.description === 'string' ? issue.fields.description.slice(0, 200) : '...'}` : ''}`;
    },

    /**
     * Generate incident ticket from alert
     */
    createIncidentFromAlert(alert: {
      title: string;
      severity: 'critical' | 'warning' | 'info';
      service: string;
      description: string;
      runbookUrl?: string;
    }): Partial<JiraIssue['fields']> {
      const priorityMap = {
        critical: 'Highest',
        warning: 'High',
        info: 'Medium'
      };

      return {
        summary: `[INCIDENT] ${alert.title}`,
        description: `
h2. Incident Details

* *Service:* ${alert.service}
* *Severity:* ${alert.severity.toUpperCase()}
* *Time:* ${new Date().toISOString()}

h2. Description

${alert.description}

${alert.runbookUrl ? `h2. Runbook\n[${alert.runbookUrl}|View Runbook]` : ''}
        `.trim(),
        priority: { name: priorityMap[alert.severity] },
        labels: ['incident', alert.service.toLowerCase()]
      };
    }
  }
};

// ============================================
// Export Default
// ============================================

export default jiraConnector;

// ============================================
// Usage Examples
// ============================================

/**
 * @example Create issue from workflow
 * ```typescript
 * const workflow = defineWorkflow({
 *   name: 'auto-ticket-from-alert',
 *   trigger: {
 *     type: 'webhook',
 *     path: '/alert'
 *   },
 *   steps: [
 *     {
 *       id: 'create-ticket',
 *       connector: 'jira',
 *       operation: 'createIssue',
 *       input: {
 *         project: 'OPS',
 *         summary: '${input.title}',
 *         description: '${input.description}',
 *         issuetype: 'Incident',
 *         priority: '${input.severity === "critical" ? "Highest" : "High"}',
 *         labels: ['auto-created']
 *       }
 *     },
 *     {
 *       id: 'notify-slack',
 *       connector: 'slack',
 *       operation: 'sendMessage',
 *       input: {
 *         channel: '#incidents',
 *         text: 'New incident created: ${steps.create-ticket.result.key}'
 *       }
 *     }
 *   ]
 * });
 * ```
 * 
 * @example Issue transition workflow
 * ```typescript
 * const resolveWorkflow = defineWorkflow({
 *   name: 'resolve-on-deploy',
 *   trigger: {
 *     type: 'webhook',
 *     path: '/deploy-complete'
 *   },
 *   steps: [
 *     {
 *       id: 'find-issues',
 *       connector: 'jira',
 *       operation: 'searchIssues',
 *       input: {
 *         jql: 'project = PROJ AND labels = deploy-fix AND status != Done'
 *       }
 *     },
 *     {
 *       id: 'resolve-issues',
 *       connector: 'jira',
 *       operation: 'transitionIssue',
 *       input: {
 *         issueKey: '${steps.find-issues.result.issues[0].key}',
 *         transition: 'Done',
 *         comment: 'Automatically resolved by deployment ${input.deployId}'
 *       }
 *     }
 *   ]
 * });
 * ```
 */
