/**
 * Simple Workflow Example
 * 
 * This example demonstrates a basic constraint-based workflow
 * that processes customer orders with guaranteed execution.
 */

import {
  Workflow,
  WorkflowEngine,
  Constraint,
  Connector,
  Step,
  WorkflowResult
} from '@constraint-flow/core';

// ============================================
// Step 1: Define Your Connectors
// ============================================

/**
 * Mock inventory connector - in production, this would connect
 * to your actual inventory management system
 */
class InventoryConnector extends Connector {
  readonly name = 'inventory';
  readonly version = '1.0.0';

  async checkStock(productId: string): Promise<{ available: boolean; quantity: number }> {
    // Simulate API call
    return { available: true, quantity: 100 };
  }

  async reserveStock(productId: string, quantity: number): Promise<{ reserved: boolean }> {
    return { reserved: true };
  }
}

/**
 * Mock payment connector
 */
class PaymentConnector extends Connector {
  readonly name = 'payment';
  readonly version = '1.0.0';

  async processPayment(amount: number, currency: string): Promise<{ success: boolean; transactionId: string }> {
    return { success: true, transactionId: `txn_${Date.now()}` };
  }

  async refund(transactionId: string): Promise<{ refunded: boolean }> {
    return { refunded: true };
  }
}

/**
 * Mock notification connector
 */
class NotificationConnector extends Connector {
  readonly name = 'notification';
  readonly version = '1.0.0';

  async sendEmail(to: string, subject: string, body: string): Promise<{ sent: boolean }> {
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return { sent: true };
  }
}

// ============================================
// Step 2: Define Constraints
// ============================================

const timeConstraint: Constraint = {
  name: 'max-execution-time',
  type: 'time',
  config: {
    maxDuration: 30000, // 30 seconds max
    onViolation: 'abort'
  }
};

const retryConstraint: Constraint = {
  name: 'retry-policy',
  type: 'retry',
  config: {
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 1000
  }
};

const idempotencyConstraint: Constraint = {
  name: 'idempotent-payment',
  type: 'idempotency',
  config: {
    key: '${orderId}',
    ttl: 86400 // 24 hours
  }
};

// ============================================
// Step 3: Define the Workflow
// ============================================

interface OrderInput {
  orderId: string;
  customerId: string;
  productId: string;
  quantity: number;
  amount: number;
  currency: string;
  email: string;
}

const orderWorkflow: Workflow<OrderInput> = {
  name: 'process-order',
  version: '1.0.0',
  description: 'Process customer order with guaranteed execution',

  // Workflow-level constraints
  constraints: [timeConstraint],

  // Define the steps
  steps: [
    {
      id: 'check-inventory',
      connector: 'inventory',
      operation: 'checkStock',
      input: { productId: '${input.productId}' },
      constraints: [retryConstraint]
    },
    {
      id: 'reserve-stock',
      connector: 'inventory',
      operation: 'reserveStock',
      input: {
        productId: '${input.productId}',
        quantity: '${input.quantity}'
      },
      // Only run if stock is available
      condition: '${steps.check-inventory.result.available === true}',
      constraints: [retryConstraint]
    },
    {
      id: 'process-payment',
      connector: 'payment',
      operation: 'processPayment',
      input: {
        amount: '${input.amount}',
        currency: '${input.currency}'
      },
      constraints: [retryConstraint, idempotencyConstraint]
    },
    {
      id: 'confirm-notification',
      connector: 'notification',
      operation: 'sendEmail',
      input: {
        to: '${input.email}',
        subject: 'Order Confirmed!',
        body: 'Your order ${input.orderId} has been confirmed.'
      }
    }
  ],

  // Compensation actions for rollback
  compensation: {
    'reserve-stock': {
      connector: 'inventory',
      operation: 'releaseStock',
      input: { productId: '${input.productId}' }
    },
    'process-payment': {
      connector: 'payment',
      operation: 'refund',
      input: { transactionId: '${steps.process-payment.result.transactionId}' }
    }
  },

  // Success/failure handlers
  onSuccess: {
    connector: 'notification',
    operation: 'sendEmail',
    input: {
      to: '${input.email}',
      subject: 'Order Complete',
      body: 'Your order has been processed successfully!'
    }
  },

  onFailure: {
    connector: 'notification',
    operation: 'sendEmail',
    input: {
      to: 'support@example.com',
      subject: 'Order Failed',
      body: 'Order ${input.orderId} failed to process.'
    }
  }
};

// ============================================
// Step 4: Execute the Workflow
// ============================================

async function main() {
  // Initialize the engine
  const engine = new WorkflowEngine({
    connectors: [
      new InventoryConnector(),
      new PaymentConnector(),
      new NotificationConnector()
    ]
  });

  // Register the workflow
  engine.register(orderWorkflow);

  // Execute with input data
  const input: OrderInput = {
    orderId: 'ORD-12345',
    customerId: 'CUST-001',
    productId: 'PROD-ABC',
    quantity: 2,
    amount: 99.99,
    currency: 'USD',
    email: 'customer@example.com'
  };

  try {
    console.log('🚀 Starting workflow execution...\n');
    
    const result: WorkflowResult = await engine.execute('process-order', input);

    if (result.success) {
      console.log('✅ Workflow completed successfully!');
      console.log('📊 Execution time:', result.duration, 'ms');
      console.log('📝 Steps executed:', result.steps.map(s => s.id).join(' → '));
    } else {
      console.log('❌ Workflow failed:', result.error);
      console.log('🔄 Compensation executed:', result.compensated);
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the example
main();

// ============================================
// Output Example:
// ============================================
// 
// 🚀 Starting workflow execution...
// 
// 📧 Email sent to customer@example.com: Order Confirmed!
// 📧 Email sent to customer@example.com: Order Complete
// ✅ Workflow completed successfully!
// 📊 Execution time: 1234 ms
// 📝 Steps executed: check-inventory → reserve-stock → process-payment → confirm-notification
