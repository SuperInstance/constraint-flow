/**
 * Slack Connector
 * 
 * Enterprise Slack integration for real-time notifications, alerts,
 * and interactive workflow triggers. Supports OAuth2 authentication
 * and comprehensive message formatting.
 * 
 * @module connectors/slack
 * @version 1.0.0
 */

import type { Connector, ConnectorConfig, OperationResult } from '../src/types';

// ============================================
// Type Definitions
// ============================================

export interface SlackConfig extends ConnectorConfig {
  /** Slack workspace ID */
  workspaceId?: string;
  /** Default channel for notifications */
  defaultChannel?: string;
  /** Bot token (xoxb-...) or user token (xoxp-...) */
  token?: string;
  /** OAuth2 configuration */
  oauth?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
  };
}

export interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  thread_ts?: string;
  reply_broadcast?: boolean;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SlackBlock {
  type: string;
  block_id?: string;
  [key: string]: unknown;
}

export interface SlackAttachment {
  color?: string;
  fallback?: string;
  title?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  [key: string]: unknown;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_archived: boolean;
  num_members?: number;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  profile?: {
    email?: string;
    display_name?: string;
    [key: string]: unknown;
  };
}

// ============================================
// Connector Definition
// ============================================

export const slackConnector: Connector<SlackConfig> = {
  name: 'slack',
  version: '1.0.0',
  description: 'Slack workspace integration for notifications and interactive workflows',
  
  auth: {
    type: 'oauth2',
    grantType: 'authorization_code',
    scopes: [
      'chat:write',
      'chat:write.public',
      'channels:read',
      'channels:history',
      'groups:read',
      'users:read',
      'users:read.email',
      'reactions:write',
      'files:write',
      'incoming-webhook'
    ],
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    authorizeUrl: 'https://slack.com/oauth/v2/authorize',
    refreshUrl: 'https://slack.com/api/oauth.v2.access'
  },

  rateLimits: {
    tier: 'tier4',
    requestsPerMinute: 100,
    concurrentRequests: 10
  },

  retry: {
    maxAttempts: 3,
    backoff: 'exponential',
    baseDelayMs: 1000,
    retryOn: [429, 500, 502, 503, 504]
  },

  // ============================================
  // Operations
  // ============================================

  operations: {
    // ----------------------------------------
    // Message Operations
    // ----------------------------------------

    sendMessage: {
      name: 'sendMessage',
      description: 'Post a message to a Slack channel',
      
      input: {
        type: 'object',
        required: ['channel'],
        properties: {
          channel: { 
            type: 'string', 
            description: 'Channel ID or name (e.g., #general or C1234567890)' 
          },
          text: { 
            type: 'string', 
            description: 'Message text (required if no blocks/attachments)' 
          },
          blocks: { 
            type: 'array', 
            description: 'Block Kit blocks for rich formatting',
            items: { type: 'object' }
          },
          attachments: { 
            type: 'array', 
            description: 'Legacy attachments (deprecated but supported)',
            items: { type: 'object' }
          },
          thread_ts: { 
            type: 'string', 
            description: 'Parent message timestamp to reply in thread' 
          },
          reply_broadcast: { 
            type: 'boolean', 
            default: false,
            description: 'Broadcast thread reply to channel' 
          },
          unfurl_links: { 
            type: 'boolean', 
            default: true,
            description: 'Enable automatic link unfurling' 
          },
          unfurl_media: { 
            type: 'boolean', 
            default: true,
            description: 'Enable automatic media unfurling' 
          },
          metadata: { 
            type: 'object',
            description: 'Metadata attached to message for workflow tracking'
          }
        }
      },

      output: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          ts: { type: 'string', description: 'Timestamp of posted message' },
          channel: { type: 'string', description: 'Channel ID' },
          message: { type: 'object', description: 'Message details' }
        }
      },

      examples: [
        {
          name: 'Simple text message',
          input: { channel: '#alerts', text: '🚨 Alert: System threshold exceeded' }
        },
        {
          name: 'Rich block message',
          input: {
            channel: 'C1234567890',
            blocks: [
              {
                type: 'header',
                text: { type: 'plain_text', text: 'Invoice Approval Required' }
              },
              {
                type: 'section',
                text: { type: 'mrkdwn', text: '*Invoice #INV-00123*\nAmount: $1,500.00\nVendor: Acme Corp' },
                accessory: {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Approve' },
                  action_id: 'approve_invoice'
                }
              }
            ]
          }
        }
      ]
    },

    updateMessage: {
      name: 'updateMessage',
      description: 'Update an existing message',

      input: {
        type: 'object',
        required: ['channel', 'ts'],
        properties: {
          channel: { type: 'string' },
          ts: { type: 'string', description: 'Timestamp of message to update' },
          text: { type: 'string' },
          blocks: { type: 'array' },
          attachments: { type: 'array' }
        }
      },

      output: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          ts: { type: 'string' },
          channel: { type: 'string' },
          message: { type: 'object' }
        }
      }
    },

    deleteMessage: {
      name: 'deleteMessage',
      description: 'Delete a message',

      input: {
        type: 'object',
        required: ['channel', 'ts'],
        properties: {
          channel: { type: 'string' },
          ts: { type: 'string', description: 'Timestamp of message to delete' }
        }
      },

      output: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' }
        }
      }
    },

    // ----------------------------------------
    // Channel Operations
    // ----------------------------------------

    listChannels: {
      name: 'listChannels',
      description: 'List all channels in the workspace',

      input: {
        type: 'object',
        properties: {
          types: { 
            type: 'string', 
            enum: ['public', 'private', 'mpim', 'im'],
            description: 'Channel types to include (comma-separated)'
          },
          exclude_archived: { type: 'boolean', default: true },
          limit: { type: 'number', default: 100 }
        }
      },

      output: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          channels: { 
            type: 'array',
            items: { $ref: '#/components/schemas/SlackChannel' }
          }
        }
      }
    },

    getChannel: {
      name: 'getChannel',
      description: 'Get info about a channel',

      input: {
        type: 'object',
        required: ['channel'],
        properties: {
          channel: { type: 'string' }
        }
      },

      output: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          channel: { $ref: '#/components/schemas/SlackChannel' }
        }
      }
    },

    // ----------------------------------------
    // User Operations
    // ----------------------------------------

    listUsers: {
      name: 'listUsers',
      description: 'List workspace members',

      input: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 100 },
          include_locale: { type: 'boolean', default: false }
        }
      },

      output: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          members: { 
            type: 'array',
            items: { $ref: '#/components/schemas/SlackUser' }
          }
        }
      }
    },

    getUser: {
      name: 'getUser',
      description: 'Get info about a user',

      input: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { type: 'string', description: 'User ID' }
        }
      },

      output: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          user: { $ref: '#/components/schemas/SlackUser' }
        }
      }
    },

    // ----------------------------------------
    // Reaction Operations
    // ----------------------------------------

    addReaction: {
      name: 'addReaction',
      description: 'Add an emoji reaction to a message',

      input: {
        type: 'object',
        required: ['channel', 'timestamp', 'name'],
        properties: {
          channel: { type: 'string' },
          timestamp: { type: 'string' },
          name: { type: 'string', description: 'Emoji name without colons (e.g., "thumbsup")' }
        }
      },

      output: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' }
        }
      }
    },

    removeReaction: {
      name: 'removeReaction',
      description: 'Remove an emoji reaction',

      input: {
        type: 'object',
        required: ['channel', 'timestamp', 'name'],
        properties: {
          channel: { type: 'string' },
          timestamp: { type: 'string' },
          name: { type: 'string' }
        }
      },

      output: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' }
        }
      }
    },

    // ----------------------------------------
    // File Operations
    // ----------------------------------------

    uploadFile: {
      name: 'uploadFile',
      description: 'Upload a file to Slack',

      input: {
        type: 'object',
        required: ['channels'],
        properties: {
          channels: { 
            type: 'string', 
            description: 'Comma-separated channel IDs' 
          },
          file: { 
            type: 'string', 
            description: 'File content (base64 or file ID)' 
          },
          filename: { type: 'string' },
          filetype: { type: 'string' },
          title: { type: 'string' },
          initial_comment: { type: 'string' },
          thread_ts: { type: 'string' }
        }
      },

      output: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          file: { 
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              url_private: { type: 'string' }
            }
          }
        }
      }
    }
  },

  // ============================================
  // Events (Webhooks)
  // ============================================

  events: {
    message: {
      name: 'message',
      description: 'Received when a message is posted',
      schema: {
        type: 'object',
        properties: {
          type: { const: 'message' },
          channel: { type: 'string' },
          user: { type: 'string' },
          text: { type: 'string' },
          ts: { type: 'string' },
          thread_ts: { type: 'string' }
        }
      }
    },

    reaction_added: {
      name: 'reaction_added',
      description: 'Received when a reaction is added to a message',
      schema: {
        type: 'object',
        properties: {
          type: { const: 'reaction_added' },
          user: { type: 'string' },
          reaction: { type: 'string' },
          item: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              channel: { type: 'string' },
              ts: { type: 'string' }
            }
          }
        }
      }
    },

    app_mention: {
      name: 'app_mention',
      description: 'Received when the bot is mentioned',
      schema: {
        type: 'object',
        properties: {
          type: { const: 'app_mention' },
          user: { type: 'string' },
          text: { type: 'string' },
          ts: { type: 'string' },
          channel: { type: 'string' }
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
      description: 'Slack API has rate limits per method',
      config: { maxPerMinute: 100 }
    },
    {
      type: 'message-size',
      description: 'Messages must be under 4000 characters',
      config: { maxTextLength: 4000 }
    },
    {
      type: 'block-limit',
      description: 'Maximum 50 blocks per message',
      config: { maxBlocks: 50 }
    }
  ],

  // ============================================
  // Helper Methods
  // ============================================

  helpers: {
    /**
     * Build a simple alert block
     */
    buildAlertBlock(title: string, message: string, severity: 'info' | 'warning' | 'error' = 'info'): SlackBlock[] {
      const colors = { info: '#36a64f', warning: '#daa038', error: '#dc3545' };
      return [
        {
          type: 'header',
          text: { type: 'plain_text', text: title }
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: message },
          accessory: {
            type: 'image',
            image_url: `https://img.shields.io/badge/${severity}-${severity.toUpperCase()}-${colors[severity]}`,
            alt_text: severity
          }
        }
      ];
    },

    /**
     * Build approval request blocks with buttons
     */
    buildApprovalBlock(
      title: string, 
      details: Record<string, string>,
      actions: Array<{ id: string; label: string; style?: 'primary' | 'danger' }>
    ): SlackBlock[] {
      const blocks: SlackBlock[] = [
        {
          type: 'header',
          text: { type: 'plain_text', text: title }
        },
        {
          type: 'section',
          fields: Object.entries(details).map(([key, value]) => ({
            type: 'mrkdwn',
            text: `*${key}:*\n${value}`
          }))
        }
      ];

      if (actions.length > 0) {
        blocks.push({
          type: 'actions',
          elements: actions.map(action => ({
            type: 'button',
            text: { type: 'plain_text', text: action.label },
            action_id: action.id,
            style: action.style
          }))
        });
      }

      return blocks;
    },

    /**
     * Build a table-like display using blocks
     */
    buildTableBlock(headers: string[], rows: string[][]): SlackBlock[] {
      const headerRow = headers.map(h => `*${h}*`).join(' | ');
      const divider = headers.map(() => '---').join(' | ');
      const dataRows = rows.map(row => row.join(' | '));
      
      return [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [headerRow, divider, ...dataRows].join('\n')
        }
      }];
    }
  }
};

// ============================================
// Export Default
// ============================================

export default slackConnector;

// ============================================
// Usage Examples
// ============================================

/**
 * @example Basic usage in a workflow
 * ```typescript
 * const workflow = defineWorkflow({
 *   name: 'alert-on-failure',
 *   steps: [
 *     {
 *       id: 'notify-slack',
 *       connector: 'slack',
 *       operation: 'sendMessage',
 *       input: {
 *         channel: '#alerts',
 *         blocks: slackConnector.helpers.buildAlertBlock(
 *           'System Alert',
 *           'Payment processing failed after 3 retries',
 *           'error'
 *         )
 *       }
 *     }
 *   ]
 * });
 * ```
 * 
 * @example Interactive approval workflow
 * ```typescript
 * const approvalWorkflow = defineWorkflow({
 *   name: 'invoice-approval',
 *   trigger: {
 *     type: 'webhook',
 *     path: '/approve-invoice'
 *   },
 *   steps: [
 *     {
 *       id: 'request-approval',
 *       connector: 'slack',
 *       operation: 'sendMessage',
 *       input: {
 *         channel: '#finance-approvals',
 *         blocks: slackConnector.helpers.buildApprovalBlock(
 *           'Invoice Approval Request',
 *           {
 *             'Invoice ID': '${input.invoiceId}',
 *             'Amount': '${input.amount}',
 *             'Vendor': '${input.vendor}'
 *           },
 *           [
 *             { id: 'approve', label: 'Approve', style: 'primary' },
 *             { id: 'reject', label: 'Reject', style: 'danger' }
 *           ]
 *         )
 *       }
 *     }
 *   ]
 * });
 * ```
 */
