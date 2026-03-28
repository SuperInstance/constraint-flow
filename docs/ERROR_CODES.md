# Connector Error Codes

This document defines standardized error codes used across all Constraint Flow connectors. Every connector must implement these error codes for consistency and predictability.

## Table of Contents

- [Error Code Format](#error-code-format)
- [Standard Error Codes](#standard-error-codes)
- [Connector-Specific Error Codes](#connector-specific-error-codes)
- [Error Response Format](#error-response-format)
- [Best Practices](#best-practices)

---

## Error Code Format

Error codes follow a hierarchical format:

```
<CONNECTOR>_<CATEGORY>_<SPECIFIC>

Example: SLACK_AUTH_TOKEN_EXPIRED
```

### Components

| Component | Description | Example |
|-----------|-------------|---------|
| **CONNECTOR** | Uppercase connector name | `SLACK`, `GITHUB`, `JIRA` |
| **CATEGORY** | Error category | `AUTH`, `RATE_LIMIT`, `VALIDATION` |
| **SPECIFIC** | Specific error type | `TOKEN_EXPIRED`, `QUOTA_EXCEEDED` |

---

## Standard Error Codes

All connectors MUST implement these standard error codes:

### Authentication Errors

| Code | HTTP Status | Description | Retryable |
|------|-------------|-------------|-----------|
| `<CONNECTOR>_AUTH_FAILED` | 401 | Authentication failed | No |
| `<CONNECTOR>_AUTH_TOKEN_EXPIRED` | 401 | Token has expired | Yes (refresh) |
| `<CONNECTOR>_AUTH_TOKEN_INVALID` | 401 | Token is invalid | No |
| `<CONNECTOR>_AUTH_PERMISSION_DENIED` | 403 | Insufficient permissions | No |
| `<CONNECTOR>_AUTH_SCOPE_MISSING` | 403 | Required OAuth scope missing | No |

### Rate Limiting Errors

| Code | HTTP Status | Description | Retryable |
|------|-------------|-------------|-----------|
| `<CONNECTOR>_RATE_LIMITED` | 429 | Rate limit exceeded | Yes |
| `<CONNECTOR>_RATE_LIMIT_QUOTA_EXCEEDED` | 429 | Daily/monthly quota exceeded | Yes |

### Validation Errors

| Code | HTTP Status | Description | Retryable |
|------|-------------|-------------|-----------|
| `<CONNECTOR>_VALIDATION_INPUT_INVALID` | 400 | Input validation failed | No |
| `<CONNECTOR>_VALIDATION_REQUIRED_FIELD` | 400 | Required field missing | No |
| `<CONNECTOR>_VALIDATION_FIELD_FORMAT` | 400 | Field format invalid | No |
| `<CONNECTOR>_VALIDATION_FIELD_VALUE` | 400 | Field value not allowed | No |

### Resource Errors

| Code | HTTP Status | Description | Retryable |
|------|-------------|-------------|-----------|
| `<CONNECTOR>_RESOURCE_NOT_FOUND` | 404 | Resource not found | No |
| `<CONNECTOR>_RESOURCE_ALREADY_EXISTS` | 409 | Resource already exists | No |
| `<CONNECTOR>_RESOURCE_CONFLICT` | 409 | Resource conflict | No |
| `<CONNECTOR>_RESOURCE_DELETED` | 410 | Resource has been deleted | No |

### Network Errors

| Code | HTTP Status | Description | Retryable |
|------|-------------|-------------|-----------|
| `<CONNECTOR>_NETWORK_TIMEOUT` | 408 | Request timed out | Yes |
| `<CONNECTOR>_NETWORK_CONNECTION_FAILED` | 503 | Connection failed | Yes |
| `<CONNECTOR>_NETWORK_DNS_FAILED` | 503 | DNS resolution failed | Yes |
| `<CONNECTOR>_NETWORK_SSL_ERROR` | 503 | SSL/TLS error | No |

### Server Errors

| Code | HTTP Status | Description | Retryable |
|------|-------------|-------------|-----------|
| `<CONNECTOR>_SERVER_ERROR` | 500 | Internal server error | Yes |
| `<CONNECTOR>_SERVER_UNAVAILABLE` | 503 | Service unavailable | Yes |
| `<CONNECTOR>_SERVER_MAINTENANCE` | 503 | Scheduled maintenance | Yes |

---

## Connector-Specific Error Codes

### Slack Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `SLACK_CHANNEL_NOT_FOUND` | Channel does not exist | No |
| `SLACK_CHANNEL_ARCHIVED` | Channel is archived | No |
| `SLACK_USER_NOT_FOUND` | User does not exist | No |
| `SLACK_MESSAGE_TOO_LONG` | Message exceeds 4000 chars | No |
| `SLACK_BLOCKS_LIMIT_EXCEEDED` | More than 50 blocks | No |
| `SLACK_FILE_TOO_LARGE` | File size exceeds limit | No |
| `SLACK_APP_NOT_IN_CHANNEL` | Bot not in channel | No |
| `SLACK_CANNOT_DM_BOT` | Cannot DM bot user | No |
| `SLACK_INVALID_BLOCKS` | Block Kit validation failed | No |
| `SLACK_ACTION_PROHIBITED` | Action not allowed | No |

### GitHub Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `GITHUB_REPO_NOT_FOUND` | Repository not found | No |
| `GITHUB_REPO_PRIVATE` | Private repository access denied | No |
| `GITHUB_BRANCH_NOT_FOUND` | Branch does not exist | No |
| `GITHUB_BRANCH_PROTECTED` | Branch is protected | No |
| `GITHUB_PR_NOT_FOUND` | Pull request not found | No |
| `GITHUB_PR_MERGED` | PR already merged | No |
| `GITHUB_PR_CONFLICT` | Merge conflict exists | No |
| `GITHUB_ISSUE_NOT_FOUND` | Issue not found | No |
| `GITHUB_ISSUE_LOCKED` | Issue is locked | No |
| `GITHUB_WORKFLOW_NOT_FOUND` | Workflow not found | No |
| `GITHUB_WORKFLOW_DISABLED` | Workflow is disabled | No |
| `GITHUB_RELEASE_EXISTS` | Release already exists | No |
| `GITHUB_FILE_TOO_LARGE` | File exceeds 100MB limit | No |
| `GITHUB_COMMIT_NOT_FOUND` | Commit not found | No |

### Jira Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `JIRA_ISSUE_NOT_FOUND` | Issue not found | No |
| `JIRA_PROJECT_NOT_FOUND` | Project not found | No |
| `JIRA_TRANSITION_INVALID` | Invalid transition | No |
| `JIRA_FIELD_REQUIRED` | Required field missing | No |
| `JIRA_FIELD_INVALID` | Field value invalid | No |
| `JIRA_PERMISSION_DENIED` | Permission denied | No |
| `JIRA_USER_NOT_FOUND` | User not found | No |
| `JIRA_ATTACH_TOO_LARGE` | Attachment too large | No |
| `JIRA_JQL_TOO_COMPLEX` | JQL query too complex | No |
| `JIRA_CUSTOM_FIELD_ERROR` | Custom field error | No |

---

## Error Response Format

All connector errors must follow this format:

```typescript
interface ConnectorErrorResponse {
  /** Whether the operation succeeded */
  success: false;
  
  /** Error details */
  error: {
    /** Standardized error code */
    code: string;
    
    /** Human-readable error message */
    message: string;
    
    /** HTTP status code */
    statusCode: number;
    
    /** Whether the error is retryable */
    retryable: boolean;
    
    /** Connector-specific details */
    details?: Record<string, unknown>;
    
    /** Request ID for support */
    requestId?: string;
    
    /** Timestamp */
    timestamp: string;
    
    /** Original error from the API */
    originalError?: unknown;
  };
}
```

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "SLACK_CHANNEL_NOT_FOUND",
    "message": "Channel 'C1234567890' not found. The channel may have been deleted or the bot may not have access.",
    "statusCode": 404,
    "retryable": false,
    "details": {
      "channel": "C1234567890",
      "suggestion": "Verify the channel ID or check if the bot has been invited to the channel"
    },
    "requestId": "req_abc123xyz",
    "timestamp": "2025-01-27T10:30:00.000Z"
  }
}
```

---

## Best Practices

### 1. Use Standard Codes First

Always prefer standard error codes over connector-specific codes:

```typescript
// Good - Uses standard code
throw new ConnectorError(
  'AUTH_TOKEN_EXPIRED',
  'Slack token has expired',
  { statusCode: 401, retryable: true }
);

// Avoid - Only use for connector-specific situations
throw new ConnectorError(
  'SLACK_CHANNEL_ARCHIVED',
  'Channel is archived',
  { statusCode: 400, retryable: false }
);
```

### 2. Include Actionable Messages

Error messages should guide users toward resolution:

```typescript
// Good - Actionable
throw new ConnectorError(
  'SLACK_CHANNEL_NOT_FOUND',
  "Channel 'C123' not found. Verify the channel ID or invite the bot to the channel.",
  { statusCode: 404, retryable: false }
);

// Avoid - Not actionable
throw new ConnectorError(
  'SLACK_CHANNEL_NOT_FOUND',
  'Channel not found',
  { statusCode: 404, retryable: false }
);
```

### 3. Include Request IDs

Always include a request ID for debugging:

```typescript
throw new ConnectorError(
  'GITHUB_RATE_LIMITED',
  'GitHub API rate limit exceeded',
  {
    statusCode: 429,
    retryable: true,
    details: {
      resetAt: new Date(Date.now() + 3600000).toISOString()
    },
    requestId: context.requestId
  }
);
```

### 4. Map API Errors

Map external API errors to standard codes:

```typescript
function mapSlackError(error: SlackApiError): ConnectorError {
  switch (error.error) {
    case 'channel_not_found':
      return new ConnectorError(
        'SLACK_CHANNEL_NOT_FOUND',
        `Channel '${error.channel}' not found`,
        { statusCode: 404, retryable: false }
      );
    
    case 'not_authed':
    case 'invalid_auth':
      return new ConnectorError(
        'SLACK_AUTH_FAILED',
        'Authentication failed. Check your bot token.',
        { statusCode: 401, retryable: false }
      );
    
    case 'rate_limited':
      return new ConnectorError(
        'SLACK_RATE_LIMITED',
        'Rate limit exceeded',
        { 
          statusCode: 429, 
          retryable: true,
          details: { retryAfter: error.retry_after }
        }
      );
    
    default:
      return new ConnectorError(
        'SLACK_SERVER_ERROR',
        error.message || 'Unknown Slack API error',
        { statusCode: 500, retryable: true }
      );
  }
}
```

### 5. Preserve Original Errors

Always include the original error for debugging:

```typescript
try {
  await slackClient.postMessage(message);
} catch (error) {
  throw new ConnectorError(
    'SLACK_NETWORK_TIMEOUT',
    'Request to Slack timed out',
    {
      statusCode: 408,
      retryable: true,
      originalError: error
    }
  );
}
```

---

## Error Handling in Workflows

### Step-Level Error Handling

```typescript
const workflow = defineWorkflow({
  name: 'error-handling-example',
  steps: [
    {
      id: 'send-message',
      connector: 'slack',
      operation: 'sendMessage',
      input: { channel: '#alerts', text: 'Alert!' },
      
      errorHandling: {
        onError: [
          {
            error: 'SLACK_CHANNEL_NOT_FOUND',
            steps: ['create-channel', 'retry-send'],
          },
          {
            error: 'SLACK_RATE_LIMITED',
            retry: {
              maxAttempts: 3,
              backoff: 'exponential',
              baseDelayMs: 60000,
            },
          },
          {
            error: 'SLACK_AUTH_*', // Wildcard matching
            steps: ['notify-admin'],
            retry: false,
          },
        ],
      },
    },
  ],
});
```

### Global Error Handling

```typescript
const workflow = defineWorkflow({
  name: 'global-error-handling',
  
  errorHandling: {
    strategy: 'compensate',
    
    onError: [
      {
        error: '*_RATE_LIMITED',
        retry: {
          maxAttempts: 5,
          backoff: 'exponential',
          baseDelayMs: 1000,
        },
      },
      {
        error: '*_AUTH_*',
        steps: ['notify-auth-error'],
        retry: false,
      },
      {
        error: '*_NETWORK_*',
        steps: ['fallback-to-cache'],
        retry: {
          maxAttempts: 3,
        },
      },
    ],
  },
  
  steps: [/* ... */],
});
```

---

## Migration Guide

### From Legacy Error Codes

If you have existing code using non-standard error codes:

| Legacy Code | Standard Code |
|-------------|---------------|
| `AUTH_ERROR` | `<CONNECTOR>_AUTH_FAILED` |
| `RATE_LIMIT` | `<CONNECTOR>_RATE_LIMITED` |
| `NOT_FOUND` | `<CONNECTOR>_RESOURCE_NOT_FOUND` |
| `VALIDATION_ERROR` | `<CONNECTOR>_VALIDATION_INPUT_INVALID` |

Both old and new codes are supported during the migration period. Legacy codes will be deprecated in version 2.0.0.

---

**Last Updated**: 2025-01-27
**Version**: 1.0.0
