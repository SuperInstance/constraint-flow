# Workflow Patterns Guide

This guide covers common workflow patterns and best practices for building enterprise automation with Constraint Flow. Each pattern includes concrete examples and when to use them.

## Table of Contents

- [Core Patterns](#core-patterns)
  - [Sequential Processing](#sequential-processing)
  - [Parallel Execution](#parallel-execution)
  - [Conditional Routing](#conditional-routing)
  - [Fan-Out/Fan-In](#fan-outfan-in)
- [Advanced Patterns](#advanced-patterns)
  - [Saga Pattern](#saga-pattern)
  - [Approval Workflows](#approval-workflows)
  - [Event-Driven Workflows](#event-driven-workflows)
  - [Retry & Compensation](#retry--compensation)
- [Integration Patterns](#integration-patterns)
  - [Multi-System Orchestration](#multi-system-orchestration)
  - [Data Transformation](#data-transformation)
  - [Batch Processing](#batch-processing)
- [Error Handling Patterns](#error-handling-patterns)
- [Constraint Patterns](#constraint-patterns)

---

## Core Patterns

### Sequential Processing

Execute steps one after another, with each step's output available to subsequent steps.

```typescript
const sequentialWorkflow = defineWorkflow({
  name: 'order-processing',
  
  steps: [
    {
      id: 'validate-order',
      agent: 'duck-validate',
      action: 'validate',
      input: { order: '${input.order}' }
    },
    {
      id: 'check-inventory',
      connector: 'erp',
      operation: 'checkStock',
      input: { 
        items: '${steps.validate-order.result.items}' 
      }
    },
    {
      id: 'reserve-stock',
      connector: 'erp',
      operation: 'reserveStock',
      condition: '${steps.check-inventory.result.available}',
      input: {
        items: '${steps.validate-order.result.items}',
        orderId: '${input.order.id}'
      }
    },
    {
      id: 'create-payment',
      connector: 'payment-gateway',
      operation: 'charge',
      input: {
        amount: '${steps.validate-order.result.total}',
        customerId: '${input.order.customerId}'
      }
    },
    {
      id: 'confirm-order',
      connector: 'erp',
      operation: 'confirmOrder',
      input: {
        orderId: '${input.order.id}',
        paymentId: '${steps.create-payment.result.id}'
      }
    }
  ]
});
```

**When to use:**
- Each step depends on the previous step's output
- Need to maintain strict ordering
- Want simple debugging and audit trails

---

### Parallel Execution

Execute independent steps concurrently to reduce total processing time.

```typescript
const parallelWorkflow = defineWorkflow({
  name: 'customer-onboarding',
  
  steps: [
    // These steps run in parallel
    {
      id: 'create-account',
      connector: 'auth-service',
      operation: 'createAccount',
      input: { email: '${input.email}', name: '${input.name}' }
    },
    {
      id: 'setup-billing',
      connector: 'billing-service',
      operation: 'createCustomer',
      input: { email: '${input.email}' }
    },
    {
      id: 'create-support-account',
      connector: 'zendesk',
      operation: 'createUser',
      input: { email: '${input.email}', name: '${input.name}' }
    },
    {
      id: 'send-welcome-email',
      connector: 'sendgrid',
      operation: 'send',
      input: {
        to: '${input.email}',
        template: 'welcome'
      }
    },
    // This step waits for all parallel steps to complete
    {
      id: 'record-onboarding',
      connector: 'database',
      operation: 'insert',
      input: {
        table: 'onboarding_records',
        data: {
          email: '${input.email}',
          accountId: '${steps.create-account.result.id}',
          billingId: '${steps.setup-billing.result.id}',
          supportId: '${steps.create-support-account.result.id}'
        }
      }
    }
  ]
});
```

**When to use:**
- Steps don't depend on each other's outputs
- Want to minimize total processing time
- Can accept partial failures with compensation

---

### Conditional Routing

Route workflow execution based on conditions using the routing pattern.

```typescript
const routingWorkflow = defineWorkflow({
  name: 'payment-routing',
  
  steps: [
    {
      id: 'determine-route',
      action: 'route',
      input: {
        amount: '${input.payment.amount}',
        currency: '${input.payment.currency}',
        customerId: '${input.payment.customerId}'
      },
      
      routing: {
        rules: [
          {
            condition: '${amount < 100 && currency === "USD"}',
            route: 'micro-payment'
          },
          {
            condition: '${amount >= 100 && currency === "USD"}',
            route: 'standard-payment'
          },
          {
            condition: '${currency !== "USD"}',
            route: 'international-payment'
          },
          {
            condition: '${customerId.startsWith("ENTERPRISE")}',
            route: 'enterprise-payment'
          }
        ],
        default: 'standard-payment'
      },
      
      output: {
        selectedRoute: '${route}'
      }
    },
    
    // Route: micro-payment
    {
      id: 'process-micro',
      condition: '${steps.determine-route.result.selectedRoute === "micro-payment"}',
      connector: 'payment-processor',
      operation: 'processMicro',
      input: { payment: '${input.payment}' }
    },
    
    // Route: standard-payment
    {
      id: 'process-standard',
      condition: '${steps.determine-route.result.selectedRoute === "standard-payment"}',
      connector: 'payment-processor',
      operation: 'processStandard',
      input: { payment: '${input.payment}' }
    },
    
    // Route: international-payment
    {
      id: 'process-international',
      condition: '${steps.determine-route.result.selectedRoute === "international-payment"}',
      connector: 'international-gateway',
      operation: 'processInternational',
      input: { payment: '${input.payment}' }
    },
    
    // Route: enterprise-payment
    {
      id: 'process-enterprise',
      condition: '${steps.determine-route.result.selectedRoute === "enterprise-payment"}',
      connector: 'enterprise-gateway',
      operation: 'processEnterprise',
      input: { payment: '${input.payment}' }
    }
  ]
});
```

**When to use:**
- Multiple processing paths based on data
- Different integrations for different scenarios
- Business rules determine execution path

---

### Fan-Out/Fan-In

Process multiple items in parallel and aggregate results.

```typescript
const fanOutFanInWorkflow = defineWorkflow({
  name: 'bulk-notification',
  
  steps: [
    {
      id: 'fetch-recipients',
      connector: 'database',
      operation: 'query',
      input: {
        sql: 'SELECT * FROM users WHERE notification_preferences LIKE :pref',
        params: { pref: '%marketing%' }
      }
    },
    
    {
      id: 'fanout',
      action: 'fanOut',
      input: {
        items: '${steps.fetch-recipients.result.records}',
        batchSize: 100
      },
      
      // This step is executed for each batch
      step: {
        id: 'send-batch',
        connector: 'sendgrid',
        operation: 'sendBatch',
        input: {
          recipients: '${batch}',
          template: '${input.template}',
          variables: '${input.variables}'
        }
      },
      
      // Aggregate results
      aggregate: {
        totalSent: '${results.reduce((sum, r) => sum + r.sent, 0)}',
        totalFailed: '${results.reduce((sum, r) => sum + r.failed, 0)}',
        failedRecipients: '${results.flatMap(r => r.failedRecipients)}'
      }
    },
    
    {
      id: 'report-results',
      connector: 'slack',
      operation: 'sendMessage',
      input: {
        channel: '#marketing-ops',
        text: 'Bulk notification complete: ${steps.fanout.result.totalSent} sent, ${steps.fanout.result.totalFailed} failed'
      }
    }
  ]
});
```

**When to use:**
- Processing arrays of items
- Need to parallelize work across items
- Want aggregated results

---

## Advanced Patterns

### Saga Pattern

Implement distributed transactions with compensation actions.

```typescript
const sagaWorkflow = defineWorkflow({
  name: 'book-vacation',
  
  steps: [
    {
      id: 'reserve-flight',
      connector: 'airline-api',
      operation: 'reserveSeat',
      input: {
        flightId: '${input.flightId}',
        passengerId: '${input.passengerId}'
      },
      compensation: {
        connector: 'airline-api',
        operation: 'cancelReservation',
        input: { reservationId: '${result.reservationId}' }
      }
    },
    
    {
      id: 'reserve-hotel',
      connector: 'hotel-api',
      operation: 'bookRoom',
      input: {
        hotelId: '${input.hotelId}',
        dates: '${input.dates}'
      },
      compensation: {
        connector: 'hotel-api',
        operation: 'cancelBooking',
        input: { bookingId: '${result.bookingId}' }
      }
    },
    
    {
      id: 'reserve-car',
      connector: 'car-rental-api',
      operation: 'reserveCar',
      input: {
        carType: '${input.carType}',
        dates: '${input.dates}'
      },
      compensation: {
        connector: 'car-rental-api',
        operation: 'cancelReservation',
        input: { reservationId: '${result.reservationId}' }
      }
    },
    
    {
      id: 'charge-payment',
      connector: 'payment-gateway',
      operation: 'charge',
      input: {
        amount: '${steps.reserve-flight.result.price + steps.reserve-hotel.result.price + steps.reserve-car.result.price}',
        customerId: '${input.customerId}'
      },
      compensation: {
        connector: 'payment-gateway',
        operation: 'refund',
        input: { chargeId: '${result.chargeId}' }
      }
    },
    
    {
      id: 'confirm-all',
      action: 'confirm',
      input: {
        flightReservation: '${steps.reserve-flight.result.reservationId}',
        hotelBooking: '${steps.reserve-hotel.result.bookingId}',
        carReservation: '${steps.reserve-car.result.reservationId}'
      }
    }
  ],
  
  errorHandling: {
    strategy: 'compensate',
    // On failure, all compensations run in reverse order
    compensateOnFailure: true
  }
});
```

**When to use:**
- Distributed transactions across multiple services
- Need rollback capability
- Strong consistency requirements

---

### Approval Workflows

Multi-level approval with timeouts and escalation.

```typescript
const approvalWorkflow = defineWorkflow({
  name: 'purchase-order-approval',
  
  steps: [
    {
      id: 'submit-for-approval',
      connector: 'slack',
      operation: 'sendMessage',
      input: {
        channel: '#approvals',
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: '*Purchase Order Approval Request*' }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: '*Amount:*\n$${input.amount}' },
              { type: 'mrkdwn', text: '*Vendor:*\n${input.vendor}' }
            ]
          },
          {
            type: 'actions',
            elements: [
              { type: 'button', text: { type: 'plain_text', text: 'Approve' }, action_id: 'approve' },
              { type: 'button', text: { type: 'plain_text', text: 'Reject' }, action_id: 'reject' }
            ]
          }
        ]
      }
    },
    
    {
      id: 'wait-for-approval',
      action: 'wait',
      waitFor: {
        event: 'approval_decision',
        correlationKey: '${input.poId}',
        timeout: 48 * 60 * 60 * 1000, // 48 hours
        
        reminders: [
          {
            delay: 4 * 60 * 60 * 1000,
            connector: 'slack',
            operation: 'sendMessage',
            input: {
              channel: '#approvals',
              text: '⏰ Reminder: PO ${input.poId} awaiting approval'
            }
          }
        ],
        
        escalation: {
          delay: 24 * 60 * 60 * 1000,
          connector: 'slack',
          operation: 'sendMessage',
          input: {
            channel: '#management-alerts',
            text: '🚨 Escalation: PO ${input.poId} unapproved for 24 hours'
          }
        }
      }
    },
    
    {
      id: 'process-approved',
      condition: '${steps.wait-for-approval.result.decision === "approved"}',
      connector: 'erp',
      operation: 'createPurchaseOrder',
      input: {
        vendorId: '${input.vendorId}',
        items: '${input.items}',
        approvedBy: '${steps.wait-for-approval.result.approver}'
      }
    },
    
    {
      id: 'process-rejected',
      condition: '${steps.wait-for-approval.result.decision === "rejected"}',
      connector: 'slack',
      operation: 'sendMessage',
      input: {
        channel: '#approvals',
        text: '❌ PO ${input.poId} was rejected. Reason: ${steps.wait-for-approval.result.reason}'
      }
    }
  ]
});
```

**When to use:**
- Human-in-the-loop processes
- Multi-level authorization
- Time-sensitive approvals with escalation

---

### Event-Driven Workflows

React to external events in real-time.

```typescript
const eventDrivenWorkflow = defineWorkflow({
  name: 'order-status-updates',
  
  trigger: {
    type: 'webhook',
    connector: 'shopify',
    event: 'order_updated',
    filter: {
      'topic': ['orders/updated', 'orders/fulfilled', 'orders/cancelled']
    }
  },
  
  steps: [
    {
      id: 'determine-update-type',
      action: 'evaluate',
      input: { event: '${trigger}' },
      rules: [
        { condition: '${event.topic === "orders/fulfilled"}', result: 'fulfilled' },
        { condition: '${event.topic === "orders/cancelled"}', result: 'cancelled' },
        { condition: 'true', result: 'updated' }
      ]
    },
    
    {
      id: 'sync-to-erp',
      connector: 'erp',
      operation: 'updateOrder',
      input: {
        externalId: '${trigger.order.id}',
        status: '${steps.determine-update-type.result}'
      }
    },
    
    {
      id: 'notify-customer',
      connector: 'sendgrid',
      operation: 'send',
      input: {
        to: '${trigger.order.email}',
        template: 'order-${steps.determine-update-type.result}',
        variables: {
          orderNumber: '${trigger.order.order_number}',
          status: '${steps.determine-update-type.result}'
        }
      }
    },
    
    {
      id: 'update-analytics',
      connector: 'segment',
      operation: 'track',
      input: {
        event: 'Order ${steps.determine-update-type.result}',
        userId: '${trigger.order.customer.id}',
        properties: {
          orderId: '${trigger.order.id}',
          total: '${trigger.order.total_price}'
        }
      }
    }
  ]
});
```

**When to use:**
- Reacting to external system changes
- Real-time synchronization
- Event sourcing architectures

---

### Retry & Compensation

Handle failures gracefully with retries and compensation.

```typescript
const resilientWorkflow = defineWorkflow({
  name: 'payment-processing',
  
  steps: [
    {
      id: 'validate-payment',
      connector: 'payment-validator',
      operation: 'validate',
      input: { payment: '${input.payment}' }
    },
    
    {
      id: 'process-payment',
      connector: 'payment-gateway',
      operation: 'charge',
      input: {
        amount: '${input.payment.amount}',
        currency: '${input.payment.currency}'
      },
      
      retry: {
        maxAttempts: 3,
        backoff: 'exponential',
        baseDelayMs: 1000,
        retryOn: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED']
      },
      
      fallback: {
        condition: '${error.code === "CARD_DECLINED"}',
        connector: 'payment-gateway',
        operation: 'tryAlternative',
        input: {
          cardToken: '${input.payment.alternativeCardToken}'
        }
      }
    },
    
    {
      id: 'update-order',
      connector: 'order-service',
      operation: 'markPaid',
      input: {
        orderId: '${input.orderId}',
        paymentId: '${steps.process-payment.result.id}'
      }
    },
    
    {
      id: 'send-receipt',
      connector: 'sendgrid',
      operation: 'send',
      input: {
        to: '${input.customerEmail}',
        template: 'receipt',
        variables: {
          amount: '${input.payment.amount}',
          orderId: '${input.orderId}'
        }
      },
      // Non-critical step - don't fail workflow if this fails
      optional: true
    }
  ],
  
  errorHandling: {
    strategy: 'compensate',
    
    onError: [
      {
        error: 'PaymentDeclinedError',
        steps: ['notify-declined'],
        retry: false
      },
      {
        error: 'NetworkError',
        steps: ['retry-later'],
        retry: {
          maxAttempts: 5,
          backoff: 'exponential'
        }
      }
    ]
  },
  
  compensation: {
    // Auto-generated compensation steps
    'process-payment': {
      connector: 'payment-gateway',
      operation: 'void',
      input: { transactionId: '${result.transactionId}' }
    },
    'update-order': {
      connector: 'order-service',
      operation: 'markFailed',
      input: { orderId: '${input.orderId}' }
    }
  }
});
```

**When to use:**
- External API calls that can fail
- Need to recover from transient errors
- Complex transactions requiring rollback

---

## Integration Patterns

### Multi-System Orchestration

Coordinate across multiple systems with data transformation.

```typescript
const orchestrationWorkflow = defineWorkflow({
  name: 'lead-to-customer',
  
  steps: [
    // CRM step
    {
      id: 'create-crm-lead',
      connector: 'salesforce',
      operation: 'createLead',
      input: {
        FirstName: '${input.firstName}',
        LastName: '${input.lastName}',
        Email: '${input.email}',
        Company: '${input.company}'
      }
    },
    
    // Marketing automation step
    {
      id: 'add-to-marketing',
      connector: 'hubspot',
      operation: 'createContact',
      input: {
        properties: {
          email: '${input.email}',
          firstname: '${input.firstName}',
          lastname: '${input.lastName}',
          company: '${input.company}',
          lifecyclestage: 'lead'
        }
      }
    },
    
    // Support system step
    {
      id: 'create-support-profile',
      connector: 'zendesk',
      operation: 'createUser',
      input: {
        name: '${input.firstName} ${input.lastName}',
        email: '${input.email}',
        organization: '${input.company}'
      }
    },
    
    // Analytics step
    {
      id: 'track-conversion',
      connector: 'segment',
      operation: 'identify',
      input: {
        userId: '${input.email}',
        traits: {
          firstName: '${input.firstName}',
          lastName: '${input.lastName}',
          company: '${input.company}',
          crmId: '${steps.create-crm-lead.result.id}',
          marketingId: '${steps.add-to-marketing.result.id}'
        }
      }
    },
    
    // Notification step
    {
      id: 'notify-sales',
      connector: 'slack',
      operation: 'sendMessage',
      input: {
        channel: '#new-leads',
        text: '🎯 New Lead: ${input.firstName} ${input.lastName} from ${input.company}'
      }
    }
  ]
});
```

---

### Data Transformation

Transform data between different formats and schemas.

```typescript
const transformWorkflow = defineWorkflow({
  name: 'sync-inventory',
  
  steps: [
    {
      id: 'fetch-source-data',
      connector: 'erp',
      operation: 'getInventory',
      input: { warehouse: '${input.warehouseId}' }
    },
    
    {
      id: 'transform-data',
      action: 'transform',
      input: {
        source: '${steps.fetch-source-data.result.items}'
      },
      
      transform: {
        // Map source schema to target schema
        mappings: [
          { from: 'item_code', to: 'sku' },
          { from: 'qty_available', to: 'quantity' },
          { from: 'unit_price', to: 'price', transform: 'cents_to_dollars' },
          { from: 'warehouse_id', to: 'location_id' }
        ],
        
        // Add computed fields
        computed: {
          sync_timestamp: '${new Date().toISOString()}',
          sync_source: 'erp',
          low_stock_flag: '${item.qty_available < item.reorder_level}'
        },
        
        // Filter out unwanted records
        filter: '${item.active === true}'
      }
    },
    
    {
      id: 'validate-transformed',
      agent: 'duck-validate',
      action: 'validate',
      input: {
        data: '${steps.transform-data.result}',
        schema: 'inventory-item'
      }
    },
    
    {
      id: 'load-to-target',
      connector: 'ecommerce',
      operation: 'updateInventory',
      input: {
        items: '${steps.transform-data.result}'
      }
    }
  ]
});
```

---

### Batch Processing

Process large datasets efficiently.

```typescript
const batchWorkflow = defineWorkflow({
  name: 'daily-report-generation',
  
  trigger: {
    type: 'schedule',
    cron: '0 6 * * *' // 6 AM daily
  },
  
  steps: [
    {
      id: 'fetch-large-dataset',
      connector: 'database',
      operation: 'query',
      input: {
        sql: 'SELECT * FROM transactions WHERE date = CURRENT_DATE - 1',
        batchSize: 10000
      }
    },
    
    {
      id: 'process-batches',
      action: 'processBatch',
      input: {
        data: '${steps.fetch-large-dataset.result}',
        batchSize: 1000,
        parallelism: 4
      },
      
      process: {
        // Function to apply to each batch
        fn: 'aggregate_transactions',
        input: { batch: '${currentBatch}' }
      },
      
      aggregate: {
        totalTransactions: '${results.reduce((s, r) => s + r.count, 0)}',
        totalAmount: '${results.reduce((s, r) => s + r.amount, 0)}',
        byCategory: '${mergeCategoryMaps(results.map(r => r.byCategory))}'
      }
    },
    
    {
      id: 'generate-report',
      connector: 'pdf-generator',
      operation: 'generate',
      input: {
        template: 'daily-transactions',
        data: {
          date: '${yesterday}',
          totalTransactions: '${steps.process-batches.result.totalTransactions}',
          totalAmount: '${steps.process-batches.result.totalAmount}',
          byCategory: '${steps.process-batches.result.byCategory}'
        }
      }
    },
    
    {
      id: 'distribute-report',
      connector: 'email',
      operation: 'send',
      input: {
        to: ['finance@company.com', 'ops@company.com'],
        subject: 'Daily Transaction Report - ${yesterday}',
        attachment: '${steps.generate-report.result.pdf}'
      }
    }
  ]
});
```

---

## Error Handling Patterns

### Circuit Breaker

Prevent cascading failures when external services are down.

```typescript
const circuitBreakerWorkflow = defineWorkflow({
  name: 'api-calls-with-circuit-breaker',
  
  steps: [
    {
      id: 'call-external-api',
      connector: 'external-service',
      operation: 'getData',
      input: { id: '${input.resourceId}' },
      
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        fallback: {
          connector: 'cache',
          operation: 'get',
          input: { key: 'fallback:${input.resourceId}' }
        }
      }
    }
  ]
});
```

### Dead Letter Queue

Handle messages that can't be processed.

```typescript
const dlqWorkflow = defineWorkflow({
  name: 'message-processing-with-dlq',
  
  errorHandling: {
    strategy: 'dead-letter-queue',
    maxRetries: 3,
    deadLetterQueue: {
      connector: 'sqs',
      queue: 'failed-messages',
      includeError: true,
      includeOriginalMessage: true
    }
  },
  
  steps: [
    {
      id: 'process-message',
      connector: 'processor',
      operation: 'handle',
      input: { message: '${input}' }
    }
  ]
});
```

---

## Constraint Patterns

### Business Rules as Constraints

Enforce business rules declaratively.

```typescript
const constrainedWorkflow = defineWorkflow({
  name: 'expense-approval',
  
  constraints: [
    {
      type: 'amount_limit',
      config: {
        field: 'input.amount',
        max: 10000,
        message: 'Expenses over $10,000 require VP approval'
      }
    },
    {
      type: 'time_window',
      config: {
        field: 'input.expenseDate',
        maxAge: 90, // days
        message: 'Cannot submit expenses older than 90 days'
      }
    },
    {
      type: 'category_validation',
      config: {
        field: 'input.category',
        allowed: ['travel', 'meals', 'equipment', 'software'],
        message: 'Invalid expense category'
      }
    },
    {
      type: 'approval_required',
      config: {
        when: { amount: { '>': 500 } },
        approvers: 1,
        escalateAfter: '24h'
      }
    }
  ],
  
  steps: [
    // ... workflow steps
  ]
});
```

### SLA Constraints

Enforce service level agreements.

```typescript
const slaConstrainedWorkflow = defineWorkflow({
  name: 'support-ticket-processing',
  
  constraints: [
    {
      type: 'sla',
      config: {
        // Response time based on priority
        responseTime: {
          critical: 15, // minutes
          high: 60,
          medium: 240,
          low: 1440 // 24 hours
        },
        // Resolution time
        resolutionTime: {
          critical: 240, // 4 hours
          high: 1440, // 24 hours
          medium: 10080, // 7 days
          low: 43200 // 30 days
        },
        // Actions on breach
        onBreach: {
          notify: ['#ops-alerts', 'manager'],
          escalate: true,
          createIncident: true
        }
      }
    }
  ],
  
  steps: [
    // ... workflow steps
  ]
});
```

---

## Best Practices

### 1. Keep Steps Atomic

Each step should do one thing well.

```typescript
// Good - Atomic steps
steps: [
  { id: 'validate', action: 'validate' },
  { id: 'transform', action: 'transform' },
  { id: 'save', action: 'save' }
]

// Avoid - Monolithic steps
steps: [
  { id: 'validate-transform-save', action: 'doEverything' }
]
```

### 2. Use Meaningful IDs

```typescript
// Good
{ id: 'charge-credit-card' }
{ id: 'send-confirmation-email' }

// Avoid
{ id: 'step1' }
{ id: 'process' }
```

### 3. Handle Errors Explicitly

```typescript
errorHandling: {
  strategy: 'compensate',
  onError: [
    {
      error: 'PaymentDeclinedError',
      steps: ['notify-customer', 'offer-alternatives']
    },
    {
      error: 'InventoryShortageError',
      steps: ['backorder', 'notify-customer']
    }
  ]
}
```

### 4. Document with Examples

```typescript
/**
 * @example Process a refund
 * ```typescript
 * const result = await workflow.execute({
 *   orderId: 'ORD-123',
 *   amount: 99.99,
 *   reason: 'Customer request'
 * });
 * ```
 */
```

### 5. Test Constraints

```typescript
describe('workflow constraints', () => {
  it('should reject orders over $10,000', async () => {
    await expect(
      workflow.execute({ amount: 15000 })
    ).rejects.toThrow('amount_limit');
  });
});
```

---

## Error Handling Deep Dive

### Error Types

Constraint Flow provides typed errors for different failure scenarios:

```typescript
import {
  WorkflowError,
  ConstraintViolationError,
  StepExecutionError,
  TimeoutError,
  CompensationError,
  ValidationError
} from 'constraint-flow';

// Error hierarchy
try {
  await engine.execute(workflow, input);
} catch (error) {
  if (error instanceof ConstraintViolationError) {
    console.error('Constraint violated:', error.constraintType);
    console.error('Constraint config:', error.config);
    console.error('At step:', error.stepId);
  } else if (error instanceof StepExecutionError) {
    console.error('Step failed:', error.stepId);
    console.error('Operation:', error.operation);
    console.error('Original error:', error.cause);
  } else if (error instanceof TimeoutError) {
    console.error('Timed out at:', error.stepId);
    console.error('Timeout after:', error.timeoutMs);
  } else if (error instanceof CompensationError) {
    console.error('Compensation failed for step:', error.stepId);
    console.error('Compensation error:', error.compensationError);
  }
}
```

### Comprehensive Error Handling Pattern

```typescript
const resilientWorkflow = defineWorkflow({
  name: 'payment-processing',
  
  steps: [
    // ... steps
  ],
  
  errorHandling: {
    // Global error handling strategy
    strategy: 'compensate',  // 'compensate' | 'continue' | 'abort'
    
    // Error-specific handlers
    onError: [
      {
        // Match specific error types
        error: 'PaymentDeclinedError',
        steps: ['notify-declined', 'log-fraud-check'],
        retry: false,  // Don't retry declined payments
      },
      {
        // Network errors with retry
        error: 'NetworkError',
        steps: ['log-network-issue'],
        retry: {
          maxAttempts: 3,
          backoff: 'exponential',
          baseDelayMs: 1000,
          maxDelayMs: 30000,
        },
      },
      {
        // Rate limiting
        error: 'RateLimitError',
        steps: ['wait-and-retry'],
        retry: {
          maxAttempts: 5,
          backoff: 'linear',
          baseDelayMs: 60000,  // Wait 1 minute
        },
      },
      {
        // Catch-all for unexpected errors
        error: '*',
        steps: ['log-error', 'notify-oncall'],
        retry: {
          maxAttempts: 1,
        },
      },
    ],
    
    // Global retry defaults
    defaultRetry: {
      maxAttempts: 2,
      backoff: 'exponential',
      baseDelayMs: 500,
    },
    
    // Timeout handling
    onTimeout: {
      steps: ['escalate-timeout'],
      notify: ['#ops-alerts'],
    },
  },
  
  // Compensation actions
  compensation: {
    'reserve-inventory': {
      connector: 'erp',
      operation: 'releaseInventory',
      input: { reservationId: '${result.reservationId}' },
    },
    'charge-payment': {
      connector: 'payment',
      operation: 'refund',
      input: { transactionId: '${result.transactionId}' },
    },
  },
});
```

### Step-Level Error Handling

```typescript
const workflowWithStepErrors = defineWorkflow({
  name: 'mixed-criticality-workflow',
  
  steps: [
    {
      id: 'critical-step',
      connector: 'payment',
      operation: 'charge',
      input: { /* ... */ },
      
      // Step-level error handling (overrides workflow-level)
      errorHandling: {
        retry: {
          maxAttempts: 5,
          backoff: 'exponential',
        },
        fallback: {
          // Try alternative if primary fails
          connector: 'payment-backup',
          operation: 'charge',
          input: { /* ... */ },
        },
      },
    },
    
    {
      id: 'optional-notification',
      connector: 'sendgrid',
      operation: 'send',
      input: { /* ... */ },
      
      // Non-critical step - failures don't fail the workflow
      optional: true,
      
      errorHandling: {
        retry: {
          maxAttempts: 1,
        },
        // Ignore errors for this step
        ignoreErrors: true,
      },
    },
  ],
});
```

### Circuit Breaker Integration

```typescript
const workflowWithCircuitBreaker = defineWorkflow({
  name: 'external-api-calls',
  
  steps: [
    {
      id: 'call-external-api',
      connector: 'external-service',
      operation: 'getData',
      
      circuitBreaker: {
        // Open circuit after 5 failures
        failureThreshold: 5,
        // Try to recover after 1 minute
        resetTimeout: 60000,
        // Use cached data when circuit is open
        fallback: {
          connector: 'cache',
          operation: 'get',
          input: { key: 'fallback:${input.resourceId}' },
        },
        // Monitor circuit state
        onStateChange: {
          open: {
            notify: ['#ops-alerts'],
            log: true,
          },
          close: {
            notify: ['#ops-alerts'],
          },
        },
      },
    },
  ],
});
```

---

## Testing Workflows

### Unit Testing Constraints

```typescript
import { WorkflowValidator } from 'constraint-flow';

describe('invoice workflow constraints', () => {
  let validator: WorkflowValidator;
  
  beforeAll(() => {
    validator = new WorkflowValidator(invoiceWorkflow);
  });
  
  it('should enforce amount limit', () => {
    const result = validator.validateConstraints({
      amount: 15000,
    });
    
    expect(result.valid).toBe(false);
    expect(result.violations).toContainEqual(
      expect.objectContaining({
        type: 'amount_limit',
        message: expect.stringContaining('$10,000'),
      })
    );
  });
  
  it('should enforce exact precision', () => {
    const result = validator.validateConstraints({
      amount: 100.999,  // Invalid precision
    });
    
    expect(result.valid).toBe(false);
    expect(result.violations).toContainEqual(
      expect.objectContaining({ type: 'exact_precision' })
    );
  });
  
  it('should pass valid input', () => {
    const result = validator.validateConstraints({
      amount: 5000,
      vendorId: 'VND-001',
    });
    
    expect(result.valid).toBe(true);
  });
});
```

### Integration Testing

```typescript
import { WorkflowEngine, MockConnector } from 'constraint-flow/testing';

describe('invoice workflow integration', () => {
  let engine: WorkflowEngine;
  let mockERP: MockConnector;
  let mockPayment: MockConnector;
  
  beforeAll(async () => {
    mockERP = new MockConnector('erp');
    mockPayment = new MockConnector('payment');
    
    engine = new WorkflowEngine({
      connectors: [mockERP, mockPayment],
    });
    
    await engine.register(invoiceWorkflow);
  });
  
  it('should process valid invoice', async () => {
    const result = await engine.execute('invoice-approval', {
      invoice: {
        invoiceId: 'INV-001',
        amount: 500,
        vendorId: 'VND-001',
      },
    });
    
    expect(result.success).toBe(true);
    expect(result.status).toBe('approved');
  });
  
  it('should trigger compensation on failure', async () => {
    // Configure mock to fail
    mockPayment.setError('charge', new Error('Insufficient funds'));
    
    const result = await engine.execute('invoice-approval', {
      invoice: { /* ... */ },
    });
    
    expect(result.success).toBe(false);
    expect(result.compensated).toBe(true);
    expect(mockERP.calls).toContainEqual(
      expect.objectContaining({ operation: 'releaseInventory' })
    );
  });
});
```

### Testing Exact Arithmetic

```typescript
import { ExactNumber, CT_SUM } from 'constraint-flow';

describe('exact arithmetic', () => {
  it('should handle 0.1 + 0.2 exactly', () => {
    const a = ExactNumber.fromFloat(0.1);
    const b = ExactNumber.fromFloat(0.2);
    const sum = a.add(b);
    
    expect(sum.toFloat()).toBe(0.3);
    expect(sum.toFloat()).not.toBe(0.30000000000000004);
  });
  
  it('should sum arrays without cumulative error', () => {
    const values = Array(10).fill(0.1);
    const sum = CT_SUM(values);
    
    expect(sum.toFloat()).toBe(1.0);
    // Compare with JavaScript:
    expect(values.reduce((a, b) => a + b)).not.toBe(1.0);
  });
});
```

---

## Need Help?

- 📖 [Connector Development Guide](./CONNECTORS.md)
- 📋 [Example Templates](../templates/)
- 🎮 [Ranch Integration Guide](./RANCH_INTEGRATION.md) - Agent training and coordination
- 💬 [GitHub Discussions](https://github.com/SuperInstance/constraint-flow/discussions)
- 🐛 [Report Issues](https://github.com/SuperInstance/constraint-flow/issues)

---

## Agent Coordination from constraint-ranch

Many coordination patterns in Constraint Flow are trained and refined using [constraint-ranch](https://github.com/SuperInstance/constraint-ranch). Key patterns include:

| Pattern | Ranch Training | Flow Application |
|---------|----------------|------------------|
| Border Collie (Master-Worker) | Spatial routing puzzles | Task distribution |
| Herding (Broadcast-Collect) | Consensus games | Multi-agent voting |
| Flocking (Swarm) | Coordination challenges | Collaborative decisions |

See the [Ranch Integration Guide](./RANCH_INTEGRATION.md) for detailed documentation.
