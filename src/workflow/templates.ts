/**
 * Pre-Built Workflow Templates
 * 
 * A collection of production-ready workflow templates for common business
 * automation scenarios. Each template is customizable with constraints
 * and can be extended for specific use cases.
 * 
 * @module workflow/templates
 * @version 1.0.0
 */

import type { 
  Workflow, 
  WorkflowStep, 
  WorkflowConstraint,
  JSONSchema 
} from '../types/workflow';
import type { Constraint, ConstraintType } from '../types/constraints';

// ============================================
// Template Types
// ============================================

/**
 * Base configuration for workflow templates
 */
export interface TemplateConfig {
  /** Unique template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Template version */
  version: string;
  /** Category for organization */
  category: TemplateCategory;
  /** Tags for searchability */
  tags: string[];
  /** Required integrations */
  requiredConnectors: string[];
  /** Estimated duration (ms) */
  estimatedDuration: number;
}

/**
 * Template categories
 */
export type TemplateCategory = 
  | 'approval'
  | 'notification'
  | 'data-processing'
  | 'integration'
  | 'compliance'
  | 'incident-management'
  | 'financial'
  | 'hr';

/**
 * Workflow template with factory function
 */
export interface WorkflowTemplate<TConfig = Record<string, unknown>> {
  /** Template metadata */
  config: TemplateConfig;
  /** Input schema for customization */
  inputSchema: JSONSchema;
  /** Factory function to create workflow */
  create(config: TConfig): Workflow;
  /** Validate configuration */
  validate(config: TConfig): ValidationResult;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{ path: string; message: string }>;
}

// ============================================
// Template Builder
// ============================================

/**
 * Builder for creating workflow templates
 */
export class TemplateBuilder<TConfig = Record<string, unknown>> {
  private templateConfig: Partial<TemplateConfig> = {};
  private inputSchema: JSONSchema = { type: 'object' };
  private steps: WorkflowStep[] = [];
  private constraints: WorkflowConstraint[] = [];
  private defaultConfig: Partial<TConfig> = {};

  /**
   * Set template metadata
   */
  withMetadata(config: Partial<TemplateConfig>): this {
    this.templateConfig = { ...this.templateConfig, ...config };
    return this;
  }

  /**
   * Set input schema
   */
  withInputSchema(schema: JSONSchema): this {
    this.inputSchema = schema;
    return this;
  }

  /**
   * Add a step
   */
  addStep(step: WorkflowStep): this {
    this.steps.push(step);
    return this;
  }

  /**
   * Add multiple steps
   */
  addSteps(steps: WorkflowStep[]): this {
    this.steps.push(...steps);
    return this;
  }

  /**
   * Add a constraint
   */
  addConstraint(constraint: WorkflowConstraint): this {
    this.constraints.push(constraint);
    return this;
  }

  /**
   * Set default configuration
   */
  withDefaultConfig(config: Partial<TConfig>): this {
    this.defaultConfig = config;
    return this;
  }

  /**
   * Build the template
   */
  build(createFn: (config: TConfig) => Partial<Workflow>): WorkflowTemplate<TConfig> {
    const config: TemplateConfig = {
      id: this.templateConfig.id || 'unknown',
      name: this.templateConfig.name || 'Unknown Template',
      description: this.templateConfig.description || '',
      version: this.templateConfig.version || '1.0.0',
      category: this.templateConfig.category || 'integration',
      tags: this.templateConfig.tags || [],
      requiredConnectors: this.templateConfig.requiredConnectors || [],
      estimatedDuration: this.templateConfig.estimatedDuration || 60000,
      ...this.templateConfig
    };

    return {
      config,
      inputSchema: this.inputSchema,
      create: (userConfig: TConfig) => {
        const workflowConfig = createFn(userConfig);
        return {
          name: workflowConfig.name || config.name,
          version: workflowConfig.version || config.version,
          description: workflowConfig.description || config.description,
          steps: workflowConfig.steps || this.steps,
          constraints: workflowConfig.constraints || this.constraints,
          input: workflowConfig.input || this.inputSchema,
          ...workflowConfig
        } as Workflow;
      },
      validate: (userConfig: TConfig) => {
        // Basic validation - can be extended
        const errors: Array<{ path: string; message: string }> = [];
        return { valid: errors.length === 0, errors };
      }
    };
  }
}

// ============================================
// Built-in Templates
// ============================================

/**
 * Invoice Approval Template
 */
export const invoiceApprovalTemplate: WorkflowTemplate<InvoiceApprovalConfig> = {
  config: {
    id: 'invoice-approval',
    name: 'Invoice Approval Workflow',
    description: 'Multi-level invoice approval with ERP integration',
    version: '1.0.0',
    category: 'financial',
    tags: ['approval', 'invoice', 'erp', 'finance'],
    requiredConnectors: ['slack', 'erp'],
    estimatedDuration: 3600000 // 1 hour
  },

  inputSchema: {
    type: 'object',
    required: ['invoice'],
    properties: {
      invoice: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string' },
          vendorId: { type: 'string' },
          vendorName: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string', default: 'USD' },
          dueDate: { type: 'string', format: 'date' }
        }
      },
      priority: {
        type: 'string',
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
      }
    }
  },

  create(config: InvoiceApprovalConfig): Workflow {
    const thresholds = config.thresholds || {
      autoApprove: 100,
      managerApproval: 5000,
      directorApproval: 25000
    };

    return {
      name: 'invoice-approval',
      version: '1.0.0',
      description: 'Invoice approval workflow',
      steps: [
        {
          id: 'extract-data',
          name: 'Extract Invoice Data',
          agent: 'cattle-extract',
          action: 'extract_invoice',
          input: { document: '${input.invoice}' },
          timeout: 30000
        },
        {
          id: 'validate',
          name: 'Validate Invoice',
          agent: 'duck-validate',
          action: 'validate_invoice',
          dependsOn: ['extract-data'],
          input: { invoice: '${steps.extract-data.result}' },
          constraints: [
            { type: 'required_fields', config: { fields: ['vendorId', 'amount', 'dueDate'] } }
          ]
        },
        {
          id: 'calculate-totals',
          name: 'Calculate Exact Totals',
          action: 'compute',
          dependsOn: ['validate'],
          input: { lineItems: '${steps.extract-data.result.lineItems}' }
        },
        {
          id: 'route-approval',
          name: 'Determine Approval Route',
          action: 'route',
          dependsOn: ['calculate-totals'],
          input: { amount: '${steps.calculate-totals.result.total}' }
        },
        {
          id: 'auto-approve',
          name: 'Auto-Approve',
          condition: '${steps.route-approval.result.route === "auto"}',
          action: 'approve',
          input: { invoiceId: '${input.invoice.invoiceId}' }
        },
        {
          id: 'request-approval',
          name: 'Request Approval',
          condition: '${steps.route-approval.result.route !== "auto"}',
          connector: 'slack',
          operation: 'sendMessage',
          input: {
            channel: config.approvalChannel || '#approvals',
            text: 'Invoice ${input.invoice.invoiceId} requires approval'
          }
        },
        {
          id: 'wait-approval',
          name: 'Wait for Approval',
          condition: '${steps.route-approval.result.route !== "auto"}',
          action: 'wait',
          waitFor: {
            event: 'approval_decision',
            correlationKey: '${input.invoice.invoiceId}',
            timeout: config.approvalTimeout || 86400000 // 24 hours
          }
        },
        {
          id: 'create-journal',
          name: 'Create Journal Entry',
          condition: '${steps.wait-approval.result.decision === "approved" || steps.auto-approve.result.approved}',
          connector: 'erp',
          operation: 'createJournalEntry',
          input: {
            invoiceId: '${input.invoice.invoiceId}',
            amount: '${steps.calculate-totals.result.total}'
          }
        },
        {
          id: 'notify-complete',
          name: 'Notify Completion',
          connector: 'slack',
          operation: 'sendMessage',
          input: {
            channel: config.notificationChannel || '#finance',
            text: 'Invoice ${input.invoice.invoiceId} processed'
          }
        }
      ],
      constraints: [
        {
          type: 'amount_limit',
          config: { max: config.maxAmount || 1000000 }
        },
        {
          type: 'time_limit',
          config: { milliseconds: config.slaHours ? config.slaHours * 3600000 : 172800000 } // 48 hours default
        },
        {
          type: 'audit_trail',
          config: { required: true, retentionDays: 2555 }
        },
        {
          type: 'exact_precision',
          config: { precision: 'cents' }
        }
      ]
    };
  },

  validate(config: InvoiceApprovalConfig): ValidationResult {
    const errors: Array<{ path: string; message: string }> = [];
    
    if (config.maxAmount && config.maxAmount <= 0) {
      errors.push({ path: 'maxAmount', message: 'maxAmount must be positive' });
    }
    
    if (config.thresholds) {
      if (config.thresholds.autoApprove >= config.thresholds.managerApproval) {
        errors.push({ path: 'thresholds', message: 'autoApprove must be less than managerApproval' });
      }
    }

    return { valid: errors.length === 0, errors };
  }
};

/**
 * Invoice Approval Configuration
 */
export interface InvoiceApprovalConfig {
  /** Maximum allowed invoice amount */
  maxAmount?: number;
  /** Approval thresholds */
  thresholds?: {
    autoApprove: number;
    managerApproval: number;
    directorApproval: number;
  };
  /** Approval timeout (ms) */
  approvalTimeout?: number;
  /** SLA in hours */
  slaHours?: number;
  /** Slack channel for approvals */
  approvalChannel?: string;
  /** Slack channel for notifications */
  notificationChannel?: string;
}

/**
 * Incident Response Template
 */
export const incidentResponseTemplate: WorkflowTemplate<IncidentResponseConfig> = {
  config: {
    id: 'incident-response',
    name: 'Incident Response Workflow',
    description: 'Automated incident response with escalation',
    version: '1.0.0',
    category: 'incident-management',
    tags: ['incident', 'escalation', 'oncall', 'pagerduty'],
    requiredConnectors: ['slack', 'pagerduty'],
    estimatedDuration: 900000 // 15 minutes
  },

  inputSchema: {
    type: 'object',
    required: ['incident'],
    properties: {
      incident: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['P1', 'P2', 'P3', 'P4'] },
          description: { type: 'string' },
          service: { type: 'string' }
        }
      }
    }
  },

  create(config: IncidentResponseConfig): Workflow {
    const slaMinutes = {
      P1: 15,
      P2: 60,
      P3: 240,
      P4: 1440
    };

    return {
      name: 'incident-response',
      version: '1.0.0',
      description: 'Incident response workflow',
      steps: [
        {
          id: 'create-incident',
          name: 'Create Incident Ticket',
          connector: 'jira',
          operation: 'createIssue',
          input: {
            project: config.jiraProject || 'INC',
            summary: '[${input.incident.severity}] ${input.incident.title}',
            priority: '${input.incident.severity === "P1" ? "Highest" : input.incident.severity === "P2" ? "High" : "Medium"}'
          }
        },
        {
          id: 'notify-channel',
          name: 'Notify Incident Channel',
          connector: 'slack',
          operation: 'sendMessage',
          input: {
            channel: config.incidentChannel || '#incidents',
            blocks: [
              {
                type: 'header',
                text: { type: 'plain_text', text: ':rotating_light: ${input.incident.severity} Incident' }
              },
              {
                type: 'section',
                text: { type: 'mrkdwn', text: '*${input.incident.title}*\n${input.incident.description}' }
              }
            ]
          }
        },
        {
          id: 'page-oncall',
          name: 'Page Oncall',
          condition: '${input.incident.severity === "P1" || input.incident.severity === "P2"}',
          connector: 'pagerduty',
          operation: 'createIncident',
          input: {
            title: '${input.incident.title}',
            service: '${input.incident.service}',
            urgency: '${input.incident.severity === "P1" ? "high" : "low"}'
          }
        },
        {
          id: 'gather-context',
          name: 'Gather Context',
          agent: 'goat-debug',
          action: 'gather_context',
          dependsOn: ['create-incident'],
          input: {
            service: '${input.incident.service}',
            incidentId: '${input.incident.id}'
          }
        },
        {
          id: 'run-diagnostics',
          name: 'Run Diagnostics',
          agent: 'chicken-monitor',
          action: 'run_diagnostics',
          dependsOn: ['gather-context'],
          input: {
            service: '${input.incident.service}'
          }
        },
        {
          id: 'wait-resolution',
          name: 'Wait for Resolution',
          action: 'wait',
          waitFor: {
            event: 'incident_resolved',
            correlationKey: '${input.incident.id}',
            timeout: slaMinutes['P1'] * 60 * 1000,
            reminders: [
              { delay: 5 * 60 * 1000, connector: 'slack', operation: 'sendMessage', input: { text: 'Incident ${input.incident.id} still open' } }
            ]
          }
        },
        {
          id: 'postmortem',
          name: 'Create Postmortem',
          condition: '${input.incident.severity === "P1"}',
          connector: 'confluence',
          operation: 'createPage',
          input: {
            title: 'Postmortem: ${input.incident.title}',
            template: 'postmortem'
          }
        }
      ],
      constraints: [
        {
          type: 'sla',
          config: {
            responseTime: {
              critical: 15,
              high: 60,
              medium: 240,
              low: 1440
            },
            onBreach: {
              escalate: true,
              notify: config.escalationChannel ? [config.escalationChannel] : ['#management']
            }
          }
        },
        {
          type: 'audit_trail',
          config: { required: true, retentionDays: 365 }
        }
      ]
    };
  },

  validate(config: IncidentResponseConfig): ValidationResult {
    const errors: Array<{ path: string; message: string }> = [];
    return { valid: errors.length === 0, errors };
  }
};

/**
 * Incident Response Configuration
 */
export interface IncidentResponseConfig {
  /** Jira project for incidents */
  jiraProject?: string;
  /** Slack channel for incidents */
  incidentChannel?: string;
  /** Escalation channel */
  escalationChannel?: string;
  /** Oncall schedule */
  oncallSchedule?: string;
}

/**
 * Data Pipeline Template
 */
export const dataPipelineTemplate: WorkflowTemplate<DataPipelineConfig> = {
  config: {
    id: 'data-pipeline',
    name: 'Data Pipeline Workflow',
    description: 'ETL pipeline with validation and monitoring',
    version: '1.0.0',
    category: 'data-processing',
    tags: ['etl', 'data', 'pipeline', 'transformation'],
    requiredConnectors: ['database', 'storage'],
    estimatedDuration: 1800000 // 30 minutes
  },

  inputSchema: {
    type: 'object',
    required: ['pipeline'],
    properties: {
      pipeline: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          source: { type: 'string' },
          destination: { type: 'string' },
          transformations: { type: 'array' }
        }
      }
    }
  },

  create(config: DataPipelineConfig): Workflow {
    return {
      name: 'data-pipeline',
      version: '1.0.0',
      description: 'Data pipeline workflow',
      steps: [
        {
          id: 'validate-source',
          name: 'Validate Source',
          agent: 'duck-api',
          action: 'validate_source',
          input: { source: '${input.pipeline.source}' },
          timeout: 60000
        },
        {
          id: 'extract',
          name: 'Extract Data',
          agent: 'horse-pipeline',
          action: 'extract',
          dependsOn: ['validate-source'],
          input: {
            source: '${input.pipeline.source}',
            batchSize: config.batchSize || 10000
          },
          constraints: [
            { type: 'payload_size', config: { maxSizeBytes: 100 * 1024 * 1024 } }
          ]
        },
        {
          id: 'transform',
          name: 'Transform Data',
          agent: 'horse-pipeline',
          action: 'transform',
          dependsOn: ['extract'],
          input: {
            data: '${steps.extract.result}',
            transformations: '${input.pipeline.transformations}'
          }
        },
        {
          id: 'validate-data',
          name: 'Validate Transformed Data',
          agent: 'cattle-reasoning',
          action: 'validate_data',
          dependsOn: ['transform'],
          input: {
            data: '${steps.transform.result}',
            rules: config.validationRules || []
          }
        },
        {
          id: 'load',
          name: 'Load Data',
          agent: 'horse-pipeline',
          action: 'load',
          dependsOn: ['validate-data'],
          input: {
            destination: '${input.pipeline.destination}',
            data: '${steps.transform.result}',
            mode: config.loadMode || 'upsert'
          }
        },
        {
          id: 'verify',
          name: 'Verify Load',
          agent: 'duck-api',
          action: 'verify_load',
          dependsOn: ['load'],
          input: {
            destination: '${input.pipeline.destination}',
            expectedCount: '${steps.extract.result.count}'
          }
        },
        {
          id: 'notify',
          name: 'Notify Completion',
          connector: 'slack',
          operation: 'sendMessage',
          input: {
            channel: config.notificationChannel || '#data-pipelines',
            text: 'Pipeline ${input.pipeline.name} completed: ${steps.load.result.count} records'
          }
        }
      ],
      constraints: [
        {
          type: 'time_limit',
          config: { milliseconds: config.timeout || 3600000 }
        },
        {
          type: 'exact_precision',
          config: { precision: 'units' }
        }
      ]
    };
  },

  validate(config: DataPipelineConfig): ValidationResult {
    const errors: Array<{ path: string; message: string }> = [];
    return { valid: errors.length === 0, errors };
  }
};

/**
 * Data Pipeline Configuration
 */
export interface DataPipelineConfig {
  /** Batch size for extraction */
  batchSize?: number;
  /** Load mode: insert, update, upsert */
  loadMode?: 'insert' | 'update' | 'upsert';
  /** Validation rules */
  validationRules?: Array<{ field: string; rule: string }>;
  /** Timeout (ms) */
  timeout?: number;
  /** Notification channel */
  notificationChannel?: string;
}

/**
 * Content Review Template
 */
export const contentReviewTemplate: WorkflowTemplate<ContentReviewConfig> = {
  config: {
    id: 'content-review',
    name: 'Content Review Workflow',
    description: 'Multi-stage content review with compliance checks',
    version: '1.0.0',
    category: 'compliance',
    tags: ['content', 'review', 'moderation', 'compliance'],
    requiredConnectors: ['slack', 'database'],
    estimatedDuration: 7200000 // 2 hours
  },

  inputSchema: {
    type: 'object',
    required: ['content'],
    properties: {
      content: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['video', 'image', 'text', 'audio'] },
          creator: { type: 'string' },
          platform: { type: 'string' }
        }
      }
    }
  },

  create(config: ContentReviewConfig): Workflow {
    return {
      name: 'content-review',
      version: '1.0.0',
      description: 'Content review workflow',
      steps: [
        {
          id: 'auto-moderate',
          name: 'Automated Moderation',
          agent: 'cattle-extract',
          action: 'moderate_content',
          input: { content: '${input.content}' },
          timeout: 60000
        },
        {
          id: 'check-compliance',
          name: 'Compliance Check',
          agent: 'duck-validate',
          action: 'check_compliance',
          dependsOn: ['auto-moderate'],
          input: {
            content: '${input.content}',
            frameworks: config.complianceFrameworks || ['COPPA', 'GDPR']
          }
        },
        {
          id: 'route-review',
          name: 'Route to Review Queue',
          action: 'route',
          dependsOn: ['check-compliance'],
          input: {
            severity: '${steps.auto-moderate.result.severity}',
            requiresHuman: '${steps.auto-moderate.result.requiresHumanReview}'
          }
        },
        {
          id: 'auto-approve-content',
          name: 'Auto-Approve',
          condition: '${steps.auto-moderate.result.severity === "safe" && !steps.auto-moderate.result.requiresHumanReview}',
          action: 'approve',
          input: { contentId: '${input.content.id}' }
        },
        {
          id: 'request-human-review',
          name: 'Request Human Review',
          condition: '${steps.auto-moderate.result.requiresHumanReview}',
          connector: 'slack',
          operation: 'sendMessage',
          input: {
            channel: config.reviewChannel || '#content-review',
            blocks: [
              {
                type: 'section',
                text: { type: 'mrkdwn', text: 'Content requires review:\n${steps.auto-moderate.result.reasons}' }
              },
              {
                type: 'actions',
                elements: [
                  { type: 'button', text: { type: 'plain_text', text: 'Approve' }, action_id: 'approve' },
                  { type: 'button', text: { type: 'plain_text', text: 'Reject' }, action_id: 'reject', style: 'danger' }
                ]
              }
            ]
          }
        },
        {
          id: 'wait-review',
          name: 'Wait for Review Decision',
          condition: '${steps.auto-moderate.result.requiresHumanReview}',
          action: 'wait',
          waitFor: {
            event: 'content_review_decision',
            correlationKey: '${input.content.id}',
            timeout: 86400000 // 24 hours
          }
        },
        {
          id: 'notify-result',
          name: 'Notify Result',
          connector: 'slack',
          operation: 'sendMessage',
          input: {
            channel: config.notificationChannel || '#content-review',
            text: 'Content ${input.content.id} ${steps.wait-review.result.decision || "approved"}'
          }
        }
      ],
      constraints: [
        {
          type: 'compliance_check',
          config: { frameworks: config.complianceFrameworks || ['COPPA', 'GDPR'] }
        },
        {
          type: 'time_limit',
          config: { milliseconds: config.slaHours ? config.slaHours * 3600000 : 172800000 }
        }
      ]
    };
  },

  validate(config: ContentReviewConfig): ValidationResult {
    const errors: Array<{ path: string; message: string }> = [];
    return { valid: errors.length === 0, errors };
  }
};

/**
 * Content Review Configuration
 */
export interface ContentReviewConfig {
  /** Compliance frameworks to check */
  complianceFrameworks?: string[];
  /** Review channel */
  reviewChannel?: string;
  /** Notification channel */
  notificationChannel?: string;
  /** SLA in hours */
  slaHours?: number;
}

// ============================================
// Template Registry
// ============================================

/**
 * Global template registry
 */
class TemplateRegistry {
  private templates: Map<string, WorkflowTemplate> = new Map();

  /**
   * Register a template
   */
  register(template: WorkflowTemplate): void {
    this.templates.set(template.config.id, template);
  }

  /**
   * Get a template by ID
   */
  get(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * List all templates
   */
  list(): TemplateConfig[] {
    return [...this.templates.values()].map(t => t.config);
  }

  /**
   * Find templates by category
   */
  findByCategory(category: TemplateCategory): TemplateConfig[] {
    return [...this.templates.values()]
      .filter(t => t.config.category === category)
      .map(t => t.config);
  }

  /**
   * Find templates by tags
   */
  findByTags(tags: string[]): TemplateConfig[] {
    return [...this.templates.values()]
      .filter(t => t.config.tags.some(tag => tags.includes(tag)))
      .map(t => t.config);
  }
}

// Global template registry
export const templateRegistry = new TemplateRegistry();

// Register built-in templates
templateRegistry.register(invoiceApprovalTemplate);
templateRegistry.register(incidentResponseTemplate);
templateRegistry.register(dataPipelineTemplate);
templateRegistry.register(contentReviewTemplate);

// ============================================
// Exports
// ============================================

export default {
  TemplateBuilder,
  templateRegistry,
  invoiceApprovalTemplate,
  incidentResponseTemplate,
  dataPipelineTemplate,
  contentReviewTemplate
};
