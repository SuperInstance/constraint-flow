/**
 * Invoice Approval Workflow Template
 * 
 * A complete invoice processing workflow with multi-level approval,
 * vendor validation, and ERP integration. Demonstrates constraint-based
 * financial workflow patterns with exact arithmetic.
 * 
 * @module templates/invoice-approval
 * @version 1.0.0
 */

import { defineWorkflow, CT_SUM, CT_MUL, CT_ROUND_TO_CENTS } from '../src';
import type { Workflow, WorkflowStep, WorkflowConstraint } from '../src/types';

// ============================================
// Type Definitions
// ============================================

export interface InvoiceData {
  invoiceId: string;
  vendorId: string;
  vendorName: string;
  vendorTaxId?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    glCode: string;
  }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  purchaseOrder?: string;
  attachments?: string[];
}

export interface ApprovalDecision {
  approverId: string;
  approverEmail: string;
  decision: 'approved' | 'rejected' | 'changes_requested';
  timestamp: string;
  comments?: string;
}

export interface InvoiceWorkflowContext {
  invoice: InvoiceData;
  extractedData?: Partial<InvoiceData>;
  validationResults?: ValidationResult[];
  approvalChain?: ApprovalDecision[];
  erpResponse?: ERPIntegrationResult;
}

export interface ValidationResult {
  field: string;
  status: 'valid' | 'invalid' | 'warning';
  message: string;
}

export interface ERPIntegrationResult {
  success: boolean;
  journalEntryId?: string;
  paymentScheduled?: boolean;
  paymentDate?: string;
  error?: string;
}

// ============================================
// Approval Thresholds Configuration
// ============================================

export const APPROVAL_THRESHOLDS = {
  // Auto-approve amounts under this threshold
  autoApproveMax: 100,
  
  // Single manager approval required
  managerApprovalMax: 5000,
  
  // Director + CFO approval required
  directorApprovalMax: 25000,
  
  // Executive committee approval required
  executiveApprovalMin: 25000,
  
  // Maximum allowed invoice amount
  maxInvoiceAmount: 1000000
} as const;

// ============================================
// Workflow Definition
// ============================================

export const invoiceApprovalWorkflow: Workflow<InvoiceWorkflowContext> = defineWorkflow({
  name: 'invoice-approval',
  version: '1.0.0',
  description: 'Multi-level invoice approval workflow with ERP integration',
  
  // ============================================
  // Trigger Configuration
  // ============================================
  
  trigger: {
    type: 'webhook',
    path: '/invoices/submit',
    method: 'POST',
    authentication: 'required',
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000
    }
  },

  // ============================================
  // Input Schema
  // ============================================
  
  input: {
    type: 'object',
    required: ['invoice'],
    properties: {
      invoice: { $ref: '#/components/schemas/InvoiceData' },
      skipExtraction: { type: 'boolean', default: false },
      priority: { 
        type: 'string', 
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
      },
      metadata: { type: 'object' }
    }
  },

  // ============================================
  // Workflow Steps
  // ============================================
  
  steps: [
    // ----------------------------------------
    // Step 1: Data Extraction (if from PDF/image)
    // ----------------------------------------
    {
      id: 'extract-invoice-data',
      name: 'Extract Invoice Data',
      agent: 'cattle-extract',
      action: 'extract_invoice',
      condition: '${!input.skipExtraction && !input.invoice.lineItems}',
      
      input: {
        document: '${input.invoice.attachments?.[0]}',
        documentType: 'invoice'
      },
      
      output: {
        extractedData: '${result}'
      },
      
      timeout: 30000,
      retry: {
        maxAttempts: 2,
        backoff: 'exponential'
      }
    },

    // ----------------------------------------
    // Step 2: Data Validation
    // ----------------------------------------
    {
      id: 'validate-invoice',
      name: 'Validate Invoice Data',
      agent: 'duck-validate',
      action: 'validate_invoice',
      
      input: {
        invoice: '${input.invoice.extractedData || input.invoice}',
        checks: [
          'vendor_verification',
          'po_matching',
          'duplicate_detection',
          'amount_verification',
          'tax_calculation',
          'date_validation',
          'gl_code_validation'
        ]
      },
      
      output: {
        validationResults: '${result.checks}',
        isValid: '${result.isValid}',
        warnings: '${result.warnings}'
      },
      
      constraints: [
        { type: 'data_quality', minScore: 0.95 }
      ]
    },

    // ----------------------------------------
    // Step 3: Calculate Exact Totals
    // ----------------------------------------
    {
      id: 'calculate-totals',
      name: 'Calculate Exact Totals',
      action: 'compute',
      
      input: {
        lineItems: '${input.invoice.lineItems}'
      },
      
      // Using exact arithmetic to prevent floating-point errors
      compute: {
        subtotal: {
          fn: 'CT_SUM',
          args: ['${input.lineItems.map(item => CT_MUL(item.quantity, item.unitPrice))}']
        },
        taxAmount: {
          fn: 'CT_SUM',
          args: ['${input.lineItems.map(item => CT_MUL(CT_MUL(item.quantity, item.unitPrice), item.taxRate))}']
        },
        total: {
          fn: 'CT_ADD',
          args: ['${computed.subtotal}', '${computed.taxAmount}']
        }
      },
      
      output: {
        calculatedTotals: '${computed}',
        verifiedTotal: '${CT_ROUND_TO_CENTS(computed.total)}'
      }
    },

    // ----------------------------------------
    // Step 4: Determine Approval Chain
    // ----------------------------------------
    {
      id: 'determine-approval-chain',
      name: 'Determine Approval Chain',
      action: 'route',
      
      input: {
        amount: '${steps.calculate-totals.result.verifiedTotal}',
        vendorId: '${input.invoice.vendorId}',
        department: '${input.invoice.department}'
      },
      
      routing: {
        rules: [
          {
            condition: '${amount < APPROVAL_THRESHOLDS.autoApproveMax}',
            route: 'auto-approve'
          },
          {
            condition: '${amount <= APPROVAL_THRESHOLDS.managerApprovalMax}',
            route: 'manager-approval'
          },
          {
            condition: '${amount <= APPROVAL_THRESHOLDS.directorApprovalMax}',
            route: 'director-approval'
          },
          {
            condition: '${amount > APPROVAL_THRESHOLDS.executiveApprovalMin}',
            route: 'executive-approval'
          }
        ]
      },
      
      output: {
        approvalRoute: '${selectedRoute}',
        approvers: '${assignedApprovers}'
      }
    },

    // ----------------------------------------
    // Step 5a: Auto-Approve Path
    // ----------------------------------------
    {
      id: 'auto-approve',
      name: 'Auto-Approve Invoice',
      condition: '${steps.determine-approval-chain.result.approvalRoute === "auto-approve"}',
      action: 'approve',
      
      input: {
        invoiceId: '${input.invoice.invoiceId}',
        reason: 'Below auto-approval threshold',
        amount: '${steps.calculate-totals.result.verifiedTotal}'
      },
      
      output: {
        approved: true,
        approvalType: 'automatic'
      }
    },

    // ----------------------------------------
    // Step 5b: Manager Approval Path
    // ----------------------------------------
    {
      id: 'request-manager-approval',
      name: 'Request Manager Approval',
      connector: 'slack',
      operation: 'sendMessage',
      condition: '${steps.determine-approval-chain.result.approvalRoute === "manager-approval"}',
      
      input: {
        channel: '${steps.determine-approval-chain.result.approvers[0].slackChannel}',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '📋 Invoice Approval Request' }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: '*Invoice ID:*\n${input.invoice.invoiceId}' },
              { type: 'mrkdwn', text: '*Vendor:*\n${input.invoice.vendorName}' },
              { type: 'mrkdwn', text: '*Amount:*\n$${steps.calculate-totals.result.verifiedTotal}' },
              { type: 'mrkdwn', text: '*Due Date:*\n${input.invoice.dueDate}' }
            ]
          },
          {
            type: 'actions',
            elements: [
              { type: 'button', text: { type: 'plain_text', text: '✓ Approve' }, action_id: 'approve', style: 'primary' },
              { type: 'button', text: { type: 'plain_text', text: '✗ Reject' }, action_id: 'reject', style: 'danger' },
              { type: 'button', text: { type: 'plain_text', text: 'View Details' }, action_id: 'view_details' }
            ]
          }
        ]
      },
      
      output: {
        messageTs: '${result.ts}',
        approvalChannel: '${result.channel}'
      }
    },

    // ----------------------------------------
    // Step 5c: Director + CFO Approval Path
    // ----------------------------------------
    {
      id: 'request-director-approval',
      name: 'Request Director Approval',
      connector: 'jira',
      operation: 'createIssue',
      condition: '${steps.determine-approval-chain.result.approvalRoute === "director-approval"}',
      
      input: {
        project: 'FIN',
        summary: 'Invoice Approval: ${input.invoice.invoiceId} - ${input.invoice.vendorName}',
        description: `
h2. Invoice Details

* *Invoice ID:* ${input.invoice.invoiceId}
* *Vendor:* ${input.invoice.vendorName}
* *Amount:* $${steps.calculate-totals.result.verifiedTotal}
* *Due Date:* ${input.invoice.dueDate}

h2. Line Items

${input.invoice.lineItems.map(item => `* ${item.description}: ${item.quantity} x $${item.unitPrice}`).join('\n')}

h2. Approval Required

This invoice requires Director and CFO approval due to amount exceeding $5,000.
        `,
        issuetype: 'Approval Request',
        priority: '${input.priority === "urgent" ? "High" : "Medium"}',
        labels: ['invoice-approval', 'finance']
      },
      
      output: {
        jiraKey: '${result.key}'
      }
    },

    // ----------------------------------------
    // Step 5d: Executive Approval Path
    // ----------------------------------------
    {
      id: 'request-executive-approval',
      name: 'Request Executive Committee Approval',
      condition: '${steps.determine-approval-chain.result.approvalRoute === "executive-approval"}',
      action: 'escalate',
      
      input: {
        invoiceId: '${input.invoice.invoiceId}',
        amount: '${steps.calculate-totals.result.verifiedTotal}',
        approvers: '${steps.determine-approval-chain.result.approvers}',
        requiresMeeting: true
      },
      
      output: {
        escalationId: '${result.id}',
        meetingScheduled: '${result.meetingScheduled}'
      }
    },

    // ----------------------------------------
    // Step 6: Wait for Approval
    // ----------------------------------------
    {
      id: 'wait-for-approval',
      name: 'Wait for Approval Decision',
      action: 'wait',
      condition: '${steps.determine-approval-chain.result.approvalRoute !== "auto-approve"}',
      
      waitFor: {
        event: 'approval_decision',
        correlationKey: '${input.invoice.invoiceId}',
        timeout: '${input.priority === "urgent" ? 4 * 60 * 60 * 1000 : 48 * 60 * 60 * 1000}', // 4h or 48h
        reminders: [
          { delay: 4 * 60 * 60 * 1000, channel: 'slack', message: 'Approval pending for invoice ${input.invoice.invoiceId}' },
          { delay: 24 * 60 * 60 * 1000, channel: 'email', escalate: true }
        ]
      },
      
      output: {
        approvalDecision: '${event.decision}',
        approvedBy: '${event.approver}'
      }
    },

    // ----------------------------------------
    // Step 7: Create ERP Journal Entry
    // ----------------------------------------
    {
      id: 'create-journal-entry',
      name: 'Create ERP Journal Entry',
      connector: 'erp-connector',
      operation: 'createJournalEntry',
      condition: '${steps.wait-for-approval.result.approvalDecision === "approved" || steps.auto-approve.result.approved}',
      
      input: {
        invoiceId: '${input.invoice.invoiceId}',
        vendorId: '${input.invoice.vendorId}',
        lineItems: '${input.invoice.lineItems}',
        totalAmount: '${steps.calculate-totals.result.verifiedTotal}',
        glCodes: '${input.invoice.lineItems.map(item => item.glCode)}',
        postingDate: '${new Date().toISOString().split("T")[0]}',
        dueDate: '${input.invoice.dueDate}',
        description: 'Invoice ${input.invoice.invoiceNumber} - ${input.invoice.vendorName}'
      },
      
      output: {
        journalEntryId: '${result.journalEntryId}',
        documentNumber: '${result.documentNumber}'
      },
      
      compensation: {
        operation: 'reverseJournalEntry',
        input: { journalEntryId: '${result.journalEntryId}' }
      }
    },

    // ----------------------------------------
    // Step 8: Schedule Payment
    // ----------------------------------------
    {
      id: 'schedule-payment',
      name: 'Schedule Payment',
      connector: 'erp-connector',
      operation: 'schedulePayment',
      condition: '${steps.create-journal-entry.result.journalEntryId}',
      
      input: {
        vendorId: '${input.invoice.vendorId}',
        amount: '${steps.calculate-totals.result.verifiedTotal}',
        dueDate: '${input.invoice.dueDate}',
        invoiceId: '${input.invoice.invoiceId}',
        journalEntryId: '${steps.create-journal-entry.result.journalEntryId}',
        paymentMethod: '${input.invoice.preferredPaymentMethod || "ACH"}'
      },
      
      output: {
        paymentId: '${result.paymentId}',
        scheduledDate: '${result.scheduledDate}'
      }
    },

    // ----------------------------------------
    // Step 9: Notify Stakeholders
    // ----------------------------------------
    {
      id: 'notify-completion',
      name: 'Notify Completion',
      connector: 'slack',
      operation: 'sendMessage',
      
      input: {
        channel: '#finance-operations',
        text: '✅ Invoice ${input.invoice.invoiceId} processed successfully\nJournal Entry: ${steps.create-journal-entry.result.journalEntryId}\nPayment Scheduled: ${steps.schedule-payment.result.scheduledDate}'
      }
    },

    // ----------------------------------------
    // Step 10: Handle Rejection
    // ----------------------------------------
    {
      id: 'handle-rejection',
      name: 'Handle Rejection',
      condition: '${steps.wait-for-approval.result.approvalDecision === "rejected"}',
      connector: 'slack',
      operation: 'sendMessage',
      
      input: {
        channel: '#finance-operations',
        text: '❌ Invoice ${input.invoice.invoiceId} was rejected\nReason: ${steps.wait-for-approval.result.comments}'
      }
    }
  ],

  // ============================================
  // Workflow Constraints
  // ============================================
  
  constraints: [
    // Amount limit constraint
    {
      type: 'amount_limit',
      description: 'Maximum invoice amount',
      config: {
        field: 'steps.calculate-totals.result.verifiedTotal',
        max: APPROVAL_THRESHOLDS.maxInvoiceAmount,
        message: 'Invoice exceeds maximum allowed amount'
      }
    },
    
    // Vendor verification constraint
    {
      type: 'vendor_verified',
      description: 'Vendor must be verified in the system',
      config: {
        field: 'steps.validate-invoice.result.vendorVerification',
        required: true
      }
    },
    
    // No duplicate constraint
    {
      type: 'no_duplicate',
      description: 'Invoice must not be a duplicate',
      config: {
        field: 'steps.validate-invoice.result.duplicateCheck',
        scope: ['vendorId', 'invoiceNumber', 'amount']
      }
    },
    
    // SLA constraint
    {
      type: 'sla',
      description: 'Invoice must be processed within SLA',
      config: {
        maxDuration: 72 * 60 * 60 * 1000, // 72 hours
        excludeWeekends: true
      }
    },
    
    // Audit trail constraint
    {
      type: 'audit_trail',
      description: 'Complete audit trail required',
      config: {
        immutable: true,
        includePayloads: true,
        retentionDays: 2555 // 7 years
      }
    },
    
    // Exact arithmetic constraint
    {
      type: 'exact_arithmetic',
      description: 'All financial calculations must use exact arithmetic',
      config: {
        enforce: true,
        precision: 'cents'
      }
    }
  ],

  // ============================================
  // Error Handling
  // ============================================
  
  errorHandling: {
    strategy: 'compensate',
    
    onError: [
      {
        error: 'ValidationError',
        steps: ['notify-validation-error'],
        retry: false
      },
      {
        error: 'ApprovalTimeoutError',
        steps: ['escalate-approval', 'notify-stakeholders'],
        retry: false
      },
      {
        error: 'ERPIntegrationError',
        steps: ['retry-erp', 'notify-it-support'],
        retry: {
          maxAttempts: 3,
          backoff: 'exponential'
        }
      }
    ]
  },

  // ============================================
  // Events
  // ============================================
  
  events: {
    onStarted: {
      connector: 'slack',
      operation: 'sendMessage',
      input: {
        channel: '#finance-workflows',
        text: '🔄 Processing invoice ${input.invoice.invoiceId}'
      }
    },
    
    onCompleted: {
      action: 'emit',
      event: 'invoice.processed',
      payload: {
        invoiceId: '${input.invoice.invoiceId}',
        status: 'completed',
        journalEntryId: '${steps.create-journal-entry.result.journalEntryId}'
      }
    },
    
    onFailed: {
      connector: 'slack',
      operation: 'sendMessage',
      input: {
        channel: '#finance-alerts',
        text: '🚨 Invoice processing failed: ${input.invoice.invoiceId}\nError: ${error.message}'
      }
    }
  }
});

// ============================================
// Export
// ============================================

export default invoiceApprovalWorkflow;

// ============================================
// Usage Example
// ============================================

/**
 * @example Submit invoice for approval
 * ```typescript
 * import { invoiceApprovalWorkflow } from './templates/invoice-approval';
 * 
 * const result = await invoiceApprovalWorkflow.execute({
 *   invoice: {
 *     invoiceId: 'INV-2024-00123',
 *     vendorId: 'VND-00456',
 *     vendorName: 'Acme Corporation',
 *     invoiceNumber: 'ACME-INV-7890',
 *     invoiceDate: '2024-01-15',
 *     dueDate: '2024-02-15',
 *     lineItems: [
 *       {
 *         description: 'Consulting Services - January',
 *         quantity: 40,
 *         unitPrice: 150.00,
 *         taxRate: 0.08,
 *         glCode: 'EXP-CONS-001'
 *       }
 *     ],
 *     subtotal: 6000.00,
 *     taxAmount: 480.00,
 *     total: 6480.00,
 *     currency: 'USD'
 *   },
 *   priority: 'normal'
 * });
 * 
 * console.log(`Invoice ${result.invoiceId} processed`);
 * console.log(`Journal Entry: ${result.journalEntryId}`);
 * console.log(`Payment scheduled: ${result.paymentScheduled}`);
 * ```
 */
