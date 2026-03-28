/**
 * Content Review Workflow Template
 * 
 * A content moderation and review workflow for user-generated content
 * with AI-assisted analysis, human review queues, and policy enforcement.
 * Supports multiple content types and moderation policies.
 * 
 * @module templates/content-review
 * @version 1.0.0
 */

import { defineWorkflow } from '../src';
import type { Workflow, WorkflowStep, WorkflowConstraint } from '../src/types';

// ============================================
// Type Definitions
// ============================================

export interface ContentData {
  contentId: string;
  contentType: 'post' | 'comment' | 'image' | 'video' | 'article' | 'profile';
  
  // Content details
  content: {
    title?: string;
    body?: string;
    mediaUrl?: string;
    mediaType?: string;
    metadata?: Record<string, unknown>;
  };
  
  // Author information
  author: {
    userId: string;
    username: string;
    accountAge: number; // days
    reputationScore: number;
    previousViolations: number;
    trustedStatus: boolean;
  };
  
  // Context
  context: {
    platform: string;
    channel?: string;
    parentContentId?: string;
    tags?: string[];
    visibility: 'public' | 'followers' | 'private';
  };
  
  // Submission metadata
  submission: {
    submittedAt: string;
    sourceIp?: string;
    deviceId?: string;
    referralSource?: string;
  };
}

export interface ModerationResult {
  categories: ModerationCategory[];
  overallVerdict: 'approved' | 'rejected' | 'requires_review' | 'escalated';
  confidence: number;
  flags: ModerationFlag[];
  suggestedAction: string;
}

export interface ModerationCategory {
  name: string;
  score: number;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface ModerationFlag {
  type: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: {
    start: number;
    end: number;
  };
  context?: string;
}

export interface ReviewDecision {
  reviewerId: string;
  decision: 'approve' | 'reject' | 'edit' | 'escalate';
  reason: string;
  editedContent?: string;
  timestamp: string;
}

export interface ContentReviewContext {
  content: ContentData;
  aiModeration?: ModerationResult;
  humanReview?: ReviewDecision;
  finalVerdict?: 'approved' | 'rejected' | 'edited';
}

// ============================================
// Policy Configuration
// ============================================

export const MODERATION_POLICIES = {
  // Content categories to check
  categories: [
    { name: 'hate_speech', threshold: 0.7, action: 'reject' },
    { name: 'harassment', threshold: 0.75, action: 'reject' },
    { name: 'violence', threshold: 0.8, action: 'reject' },
    { name: 'sexual_content', threshold: 0.7, action: 'review' },
    { name: 'spam', threshold: 0.85, action: 'reject' },
    { name: 'misinformation', threshold: 0.7, action: 'review' },
    { name: 'self_harm', threshold: 0.6, action: 'escalate' },
    { name: 'illegal_activity', threshold: 0.6, action: 'escalate' },
    { name: 'pii_exposure', threshold: 0.8, action: 'edit' }
  ],
  
  // Trust-based thresholds
  trustLevels: {
    trusted: {
      autoApprove: true,
      aiThresholdModifier: 0.1,
      humanReviewRequired: false
    },
    standard: {
      autoApprove: false,
      aiThresholdModifier: 0,
      humanReviewRequired: true
    },
    new: {
      autoApprove: false,
      aiThresholdModifier: -0.1,
      humanReviewRequired: true
    },
    flagged: {
      autoApprove: false,
      aiThresholdModifier: -0.2,
      humanReviewRequired: true
    }
  },
  
  // Escalation criteria
  escalation: {
    severityThreshold: 'critical',
    illegalActivityCategories: ['illegal_activity', 'self_harm', 'csam'],
    requiresLegalReview: ['csam', 'terrorist_content', 'doxing']
  }
} as const;

// ============================================
// Workflow Definition
// ============================================

export const contentReviewWorkflow: Workflow<ContentReviewContext> = defineWorkflow({
  name: 'content-review',
  version: '1.0.0',
  description: 'AI-assisted content moderation with human review and policy enforcement',
  
  // ============================================
  // Trigger Configuration
  // ============================================
  
  trigger: {
    type: 'webhook',
    path: '/content/review',
    method: 'POST',
    authentication: 'required',
    rateLimit: {
      maxRequests: 1000,
      windowMs: 60000
    }
  },

  // ============================================
  // Input Schema
  // ============================================
  
  input: {
    type: 'object',
    required: ['content'],
    properties: {
      content: { $ref: '#/components/schemas/ContentData' },
      priority: { 
        type: 'string', 
        enum: ['low', 'normal', 'high'],
        default: 'normal'
      },
      skipAI: { type: 'boolean', default: false },
      forceReview: { type: 'boolean', default: false }
    }
  },

  // ============================================
  // Workflow Steps
  // ============================================
  
  steps: [
    // ----------------------------------------
    // Step 1: Determine User Trust Level
    // ----------------------------------------
    {
      id: 'determine-trust-level',
      name: 'Determine User Trust Level',
      action: 'evaluate',
      
      input: {
        accountAge: '${input.content.author.accountAge}',
        reputationScore: '${input.content.author.reputationScore}',
        previousViolations: '${input.content.author.previousViolations}',
        trustedStatus: '${input.content.author.trustedStatus}'
      },
      
      rules: [
        {
          condition: '${trustedStatus && previousViolations === 0}',
          result: 'trusted'
        },
        {
          condition: '${previousViolations > 2}',
          result: 'flagged'
        },
        {
          condition: '${accountAge < 7}',
          result: 'new'
        },
        {
          condition: 'true',
          result: 'standard'
        }
      ],
      
      output: {
        trustLevel: '${result}'
      }
    },

    // ----------------------------------------
    // Step 2: AI Content Analysis
    // ----------------------------------------
    {
      id: 'ai-content-analysis',
      name: 'AI Content Analysis',
      agent: 'cattle-moderate',
      action: 'analyze_content',
      condition: '${!input.skipAI}',
      
      input: {
        contentId: '${input.content.contentId}',
        contentType: '${input.content.contentType}',
        text: '${input.content.content.body}',
        mediaUrl: '${input.content.content.mediaUrl}',
        categories: MODERATION_POLICIES.categories.map(c => c.name),
        context: {
          author: '${input.content.author}',
          platform: '${input.content.context.platform}'
        }
      },
      
      output: {
        moderationResult: '${result}'
      },
      
      timeout: 30000,
      retry: {
        maxAttempts: 2,
        backoff: 'exponential'
      }
    },

    // ----------------------------------------
    // Step 3: Apply Trust-Based Adjustments
    // ----------------------------------------
    {
      id: 'apply-trust-adjustments',
      name: 'Apply Trust-Based Adjustments',
      action: 'transform',
      
      input: {
        moderationResult: '${steps.ai-content-analysis.result.moderationResult}',
        trustLevel: '${steps.determine-trust-level.result.trustLevel}',
        thresholdModifier: '${MODERATION_POLICIES.trustLevels[steps.determine-trust-level.result.trustLevel].aiThresholdModifier}'
      },
      
      transform: {
        adjustedCategories: '${moderationResult.categories.map(cat => ({ ...cat, adjustedScore: Math.max(0, Math.min(1, cat.score - thresholdModifier)) }))}',
        highestSeverity: '${Math.max(...moderationResult.categories.map(c => c.severity === "critical" ? 4 : c.severity === "high" ? 3 : c.severity === "medium" ? 2 : c.severity === "low" ? 1 : 0))}'
      },
      
      output: {
        adjustedCategories: '${transformed.adjustedCategories}',
        highestSeverity: '${transformed.highestSeverity}'
      }
    },

    // ----------------------------------------
    // Step 4: Determine Moderation Route
    // ----------------------------------------
    {
      id: 'determine-route',
      name: 'Determine Moderation Route',
      action: 'route',
      
      input: {
        moderationResult: '${steps.apply-trust-adjustments.result}',
        trustLevel: '${steps.determine-trust-level.result.trustLevel}',
        forceReview: '${input.forceReview}'
      },
      
      routing: {
        rules: [
          // Escalation for critical content
          {
            condition: '${result.highestSeverity >= 4 || categories.some(c => MODERATION_POLICIES.escalation.illegalActivityCategories.includes(c.name))}',
            route: 'escalate'
          },
          // Trust-based auto-approve
          {
            condition: '${MODERATION_POLICIES.trustLevels[trustLevel].autoApprove && highestSeverity < 2}',
            route: 'auto-approve'
          },
          // AI rejection for clear violations
          {
            condition: '${categories.some(c => c.adjustedScore >= MODERATION_POLICIES.categories.find(p => p.name === c.name)?.threshold && MODERATION_POLICIES.categories.find(p => p.name === c.name)?.action === "reject")}',
            route: 'auto-reject'
          },
          // Human review required
          {
            condition: 'true',
            route: 'human-review'
          }
        ]
      },
      
      output: {
        route: '${selectedRoute}'
      }
    },

    // ----------------------------------------
    // Step 5a: Auto-Approve Path
    // ----------------------------------------
    {
      id: 'auto-approve',
      name: 'Auto-Approve Content',
      condition: '${steps.determine-route.result.route === "auto-approve"}',
      connector: 'content-api',
      operation: 'approveContent',
      
      input: {
        contentId: '${input.content.contentId}',
        approvedBy: 'ai-auto',
        reason: 'Content passed automated moderation checks',
        confidence: '${steps.ai-content-analysis.result.moderationResult.confidence}'
      },
      
      output: {
        approved: true,
        approvedAt: '${result.timestamp}'
      }
    },

    // ----------------------------------------
    // Step 5b: Auto-Reject Path
    // ----------------------------------------
    {
      id: 'auto-reject',
      name: 'Auto-Reject Content',
      condition: '${steps.determine-route.result.route === "auto-reject"}',
      connector: 'content-api',
      operation: 'rejectContent',
      
      input: {
        contentId: '${input.content.contentId}',
        rejectedBy: 'ai-auto',
        reason: '${steps.apply-trust-adjustments.result.adjustedCategories.find(c => c.adjustedScore >= MODERATION_POLICIES.categories.find(p => p.name === c.name)?.threshold)?.name || "policy_violation"}',
        flags: '${steps.ai-content-analysis.result.moderationResult.flags}'
      },
      
      output: {
        rejected: true,
        rejectedAt: '${result.timestamp}',
        reason: '${result.reason}'
      }
    },

    // ----------------------------------------
    // Step 5c: Human Review Path
    // ----------------------------------------
    {
      id: 'queue-for-review',
      name: 'Queue for Human Review',
      condition: '${steps.determine-route.result.route === "human-review"}',
      connector: 'review-queue',
      operation: 'addToQueue',
      
      input: {
        contentId: '${input.content.contentId}',
        contentType: '${input.content.contentType}',
        priority: '${input.priority === "high" ? "urgent" : input.priority}',
        moderationResult: '${steps.ai-content-analysis.result.moderationResult}',
        suggestedAction: '${steps.ai-content-analysis.result.moderationResult.suggestedAction}',
        metadata: {
          author: '${input.content.author}',
          submittedAt: '${input.content.submission.submittedAt}',
          trustLevel: '${steps.determine-trust-level.result.trustLevel}'
        }
      },
      
      output: {
        queueItemId: '${result.id}',
        queuePosition: '${result.position}'
      }
    },

    // ----------------------------------------
    // Step 6: Notify Moderator
    // ----------------------------------------
    {
      id: 'notify-moderator',
      name: 'Notify Moderator',
      condition: '${steps.queue-for-review.result.queueItemId}',
      connector: 'slack',
      operation: 'sendMessage',
      
      input: {
        channel: '#content-moderation',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '📋 Content Review Required' }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: '*Content ID:*\n${input.content.contentId}' },
              { type: 'mrkdwn', text: '*Type:*\n${input.content.contentType}' },
              { type: 'mrkdwn', text: '*Author:*\n@${input.content.author.username}' },
              { type: 'mrkdwn', text: '*Trust Level:*\n${steps.determine-trust-level.result.trustLevel}' }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*AI Suggestion:* ${steps.ai-content-analysis.result.moderationResult.suggestedAction}'
            }
          },
          {
            type: 'actions',
            elements: [
              { type: 'button', text: { type: 'plain_text', text: '✓ Approve' }, action_id: 'approve', style: 'primary' },
              { type: 'button', text: { type: 'plain_text', text: '✗ Reject' }, action_id: 'reject', style: 'danger' },
              { type: 'button', text: { type: 'plain_text', text: '✏️ Edit' }, action_id: 'edit' },
              { type: 'button', text: { type: 'plain_text', text: '👁️ View' }, action_id: 'view' }
            ]
          }
        ]
      }
    },

    // ----------------------------------------
    // Step 7: Wait for Human Decision
    // ----------------------------------------
    {
      id: 'wait-for-review',
      name: 'Wait for Human Review',
      condition: '${steps.queue-for-review.result.queueItemId}',
      action: 'wait',
      
      waitFor: {
        event: 'content_reviewed',
        correlationKey: '${input.content.contentId}',
        timeout: 24 * 60 * 60 * 1000, // 24 hours
        reminders: [
          { delay: 2 * 60 * 60 * 1000, channel: 'slack', message: 'Content review pending: ${input.content.contentId}' },
          { delay: 8 * 60 * 60 * 1000, channel: 'slack', escalate: true }
        ]
      },
      
      output: {
        reviewDecision: '${event.decision}'
      }
    },

    // ----------------------------------------
    // Step 8: Process Human Decision
    // ----------------------------------------
    {
      id: 'process-review-decision',
      name: 'Process Review Decision',
      condition: '${steps.wait-for-review.result.reviewDecision}',
      connector: 'content-api',
      operation: '${steps.wait-for-review.result.reviewDecision.decision}Content',
      
      input: {
        contentId: '${input.content.contentId}',
        reviewerId: '${steps.wait-for-review.result.reviewDecision.reviewerId}',
        reason: '${steps.wait-for-review.result.reviewDecision.reason}',
        editedContent: '${steps.wait-for-review.result.reviewDecision.editedContent}'
      },
      
      output: {
        processed: true,
        verdict: '${steps.wait-for-review.result.reviewDecision.decision}'
      }
    },

    // ----------------------------------------
    // Step 5d: Escalation Path
    // ----------------------------------------
    {
      id: 'escalate-content',
      name: 'Escalate Content',
      condition: '${steps.determine-route.result.route === "escalate"}',
      connector: 'slack',
      operation: 'sendMessage',
      
      input: {
        channel: '#content-escalations',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '🚨 CONTENT ESCALATION - Immediate Review Required' }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Critical content detected requiring immediate attention*\n\nContent ID: ${input.content.contentId}\nSeverity: ${steps.apply-trust-adjustments.result.highestSeverity}'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Flagged Categories:*\n${steps.apply-trust-adjustments.result.adjustedCategories.filter(c => c.severity === "critical" || c.severity === "high").map(c => "• " + c.name + " (" + c.adjustedScore + ")").join("\\n")}'
            }
          },
          {
            type: 'actions',
            elements: [
              { type: 'button', text: { type: 'plain_text', text: '🔒 Lock & Review' }, action_id: 'lock', style: 'primary' },
              { type: 'button', text: { type: 'plain_text', text: '⚖️ Legal Review' }, action_id: 'legal', style: 'danger' },
              { type: 'button', text: { type: 'plain_text', text: '🚔 Report' }, action_id: 'report' }
            ]
          }
        ]
      }
    },

    // ----------------------------------------
    // Step 9: Handle Illegal Content
    // ----------------------------------------
    {
      id: 'handle-illegal-content',
      name: 'Handle Illegal Content',
      condition: '${steps.apply-trust-adjustments.result.adjustedCategories.some(c => MODERATION_POLICIES.escalation.requiresLegalReview.includes(c.name))}',
      action: 'createCase',
      
      input: {
        type: 'legal_review',
        contentId: '${input.content.contentId}',
        categories: '${steps.apply-trust-adjustments.result.adjustedCategories.filter(c => MODERATION_POLICIES.escalation.requiresLegalReview.includes(c.name)).map(c => c.name)}',
        preserveEvidence: true,
        notifyLegal: true
      },
      
      output: {
        caseId: '${result.caseId}',
        legalNotified: true
      }
    },

    // ----------------------------------------
    // Step 10: Update User Trust Score
    // ----------------------------------------
    {
      id: 'update-trust-score',
      name: 'Update User Trust Score',
      condition: '${steps.process-review-decision.result.verdict === "reject" || steps.auto-reject.result.rejected}',
      connector: 'user-api',
      operation: 'updateTrustScore',
      
      input: {
        userId: '${input.content.author.userId}',
        delta: -10,
        reason: 'Content violation: ${steps.auto-reject.result.reason || steps.wait-for-review.result.reviewDecision.reason}',
        contentId: '${input.content.contentId}'
      },
      
      output: {
        newTrustScore: '${result.score}'
      }
    },

    // ----------------------------------------
    // Step 11: Notify Author
    // ----------------------------------------
    {
      id: 'notify-author',
      name: 'Notify Author',
      condition: '${steps.process-review-decision.result.verdict === "reject" || steps.auto-reject.result.rejected}',
      connector: 'notification-api',
      operation: 'sendNotification',
      
      input: {
        userId: '${input.content.author.userId}',
        type: 'content_rejected',
        title: 'Your content was not approved',
        body: 'Your ${input.content.contentType} was removed for violating our community guidelines.',
        metadata: {
          contentId: '${input.content.contentId}',
          reason: '${steps.auto-reject.result.reason || steps.wait-for-review.result.reviewDecision.reason}'
        }
      }
    },

    // ----------------------------------------
    // Step 12: Log Decision
    // ----------------------------------------
    {
      id: 'log-decision',
      name: 'Log Moderation Decision',
      action: 'log',
      
      input: {
        contentId: '${input.content.contentId}',
        decision: '${steps.auto-approve.result.approved ? "approved" : steps.auto-reject.result.rejected ? "rejected" : steps.process-review-decision.result.verdict}',
        method: '${steps.auto-approve.result.approved ? "auto" : steps.auto-reject.result.rejected ? "auto" : "human"}',
        aiConfidence: '${steps.ai-content-analysis.result.moderationResult?.confidence}',
        reviewerId: '${steps.wait-for-review.result.reviewDecision?.reviewerId}',
        processingTime: '${workflow.duration}'
      }
    }
  ],

  // ============================================
  // Workflow Constraints
  // ============================================
  
  constraints: [
    // Processing SLA
    {
      type: 'sla',
      description: 'Content must be reviewed within SLA',
      config: {
        maxDuration: 4 * 60 * 60 * 1000, // 4 hours for normal priority
        priorityMultipliers: {
          high: 0.25, // 1 hour
          low: 2 // 8 hours
        }
      }
    },
    
    // Evidence preservation
    {
      type: 'evidence_preservation',
      description: 'Preserve evidence for flagged content',
      config: {
        preserveFor: ['escalated', 'rejected'],
        retentionDays: 365
      }
    },
    
    // Audit trail
    {
      type: 'audit_trail',
      description: 'Complete audit trail for moderation decisions',
      config: {
        includeContent: true,
        includeModerationResult: true,
        retentionDays: 2555 // 7 years
      }
    },
    
    // Rate limiting per user
    {
      type: 'user_rate_limit',
      description: 'Prevent spam submissions',
      config: {
        maxSubmissions: 10,
        windowMs: 60000,
        action: 'throttle'
      }
    }
  ],

  // ============================================
  // Error Handling
  // ============================================
  
  errorHandling: {
    strategy: 'safe_fail',
    
    onError: [
      {
        error: 'AIAnalysisError',
        steps: ['queue-for-review'],
        fallbackInput: {
          forceReview: true
        }
      },
      {
        error: 'ContentApiError',
        steps: ['retry-api'],
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
      action: 'emit',
      event: 'content.review_started',
      payload: {
        contentId: '${input.content.contentId}',
        contentType: '${input.content.contentType}'
      }
    },
    
    onCompleted: {
      action: 'emit',
      event: 'content.review_completed',
      payload: {
        contentId: '${input.content.contentId}',
        verdict: '${steps.auto-approve.result.approved ? "approved" : steps.auto-reject.result.rejected ? "rejected" : steps.process-review-decision.result.verdict}',
        processingTime: '${workflow.duration}'
      }
    }
  }
});

// ============================================
// Export
// ============================================

export default contentReviewWorkflow;

// ============================================
// Usage Example
// ============================================

/**
 * @example Submit content for review
 * ```typescript
 * import { contentReviewWorkflow } from './templates/content-review';
 * 
 * const result = await contentReviewWorkflow.execute({
 *   content: {
 *     contentId: 'POST-2024-00456',
 *     contentType: 'post',
 *     content: {
 *       title: 'My Experience with Product X',
 *       body: 'I recently tried Product X and wanted to share...'
 *     },
 *     author: {
 *       userId: 'USR-12345',
 *       username: 'reviewer_jane',
 *       accountAge: 365,
 *       reputationScore: 85,
 *       previousViolations: 0,
 *       trustedStatus: true
 *     },
 *     context: {
 *       platform: 'community',
 *       visibility: 'public'
 *     },
 *     submission: {
 *       submittedAt: new Date().toISOString()
 *     }
 *   },
 *   priority: 'normal'
 * });
 * 
 * console.log(`Content ${result.verdict}`);
 * if (result.aiModeration) {
 *   console.log(`AI Confidence: ${result.aiModeration.confidence}`);
 * }
 * ```
 */
