# Enterprise Integration Guide

This guide covers enterprise integration features for Constraint Flow including Single Sign-On (SSO), audit logging, compliance, and disaster recovery.

## Table of Contents

- [Single Sign-On (SSO)](#single-sign-on-sso)
- [Audit Logging](#audit-logging)
- [Compliance](#compliance)
- [Disaster Recovery](#disaster-recovery)

---

## Single Sign-On (SSO)

### Supported SSO Providers

| Provider | Protocol | Status |
|----------|----------|--------|
| Okta | SAML 2.0, OIDC | ✅ Supported |
| Microsoft Entra ID (Azure AD) | SAML 2.0, OIDC | ✅ Supported |
| Google Workspace | SAML 2.0, OIDC | ✅ Supported |
| Ping Identity | SAML 2.0 | ✅ Supported |
| OneLogin | SAML 2.0, OIDC | ✅ Supported |
| Auth0 | OIDC | ✅ Supported |
| Custom IdP | SAML 2.0, OIDC | ✅ Supported |

### SAML 2.0 Configuration

#### Service Provider Configuration

```typescript
const samlConfig = {
  // Service Provider settings
  sp: {
    entityId: 'https://constraint-flow.yourcompany.com/saml/metadata',
    assertionConsumerService: {
      url: 'https://constraint-flow.yourcompany.com/saml/acs',
      binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    },
    singleLogoutService: {
      url: 'https://constraint-flow.yourcompany.com/saml/slo',
      binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
    },
    NameIDFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    wantAssertionsSigned: true,
    wantMessageSigned: true,
  },
  
  // Identity Provider settings
  idp: {
    entityId: 'https://sso.yourcompany.com',
    singleSignOnService: {
      url: 'https://sso.yourcompany.com/sso/saml',
      binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
    },
    singleLogoutService: {
      url: 'https://sso.yourcompany.com/slo/saml',
      binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
    },
    certificates: [
      '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
    ],
  },
  
  // Security settings
  security: {
    authnRequestsSigned: true,
    logoutRequestSigned: true,
    logoutResponseSigned: true,
    signMetadata: true,
    wantAssertionsEncrypted: false,
    wantNameIdEncrypted: false,
    signatureAlgorithm: 'sha256',
    digestAlgorithm: 'sha256',
  },
};
```

#### Attribute Mapping

```typescript
const attributeMapping = {
  // Standard attributes
  email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
  lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
  
  // Group/role attributes
  groups: 'http://schemas.xmlsoap.org/claims/Group',
  roles: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  
  // Custom attributes
  department: 'http://yourcompany.com/claims/department',
  manager: 'http://yourcompany.com/claims/manager',
};
```

### OpenID Connect (OIDC) Configuration

```typescript
const oidcConfig = {
  // Provider settings
  issuer: 'https://sso.yourcompany.com',
  authorizationEndpoint: 'https://sso.yourcompany.com/oauth/authorize',
  tokenEndpoint: 'https://sso.yourcompany.com/oauth/token',
  userInfoEndpoint: 'https://sso.yourcompany.com/oauth/userinfo',
  jwksUri: 'https://sso.yourcompany.com/.well-known/jwks.json',
  
  // Client settings
  clientId: 'constraint-flow',
  clientSecret: process.env.OIDC_CLIENT_SECRET,
  redirectUri: 'https://constraint-flow.yourcompany.com/callback',
  postLogoutRedirectUri: 'https://constraint-flow.yourcompany.com',
  
  // Scopes
  scopes: ['openid', 'profile', 'email', 'groups'],
  
  // Security settings
  responseMode: 'query',
  responseType: 'code',
  pkce: true,
  stateRequired: true,
  nonceRequired: true,
  
  // Token settings
  accessTokenLifetime: 3600,
  refreshTokenLifetime: 86400,
  useRefreshTokens: true,
};
```

### Just-in-Time (JIT) Provisioning

```typescript
const jitProvisioning = {
  enabled: true,
  
  // User attribute mapping from SSO
  userMapping: {
    email: '${sso.email}',
    firstName: '${sso.given_name}',
    lastName: '${sso.family_name}',
    displayName: '${sso.name}',
  },
  
  // Role assignment from groups
  roleMapping: {
    admin: ['ConstraintFlow-Admins', 'IT-Administrators'],
    operator: ['ConstraintFlow-Operators', 'DevOps-Team'],
    viewer: ['ConstraintFlow-Viewers', 'All-Users'],
  },
  
  // Auto-create users
  autoCreate: true,
  
  // Update user info on each login
  updateOnLogin: true,
  
  // Suspend users removed from IdP
  suspendOnRemoval: true,
};
```

### SSO Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SSO AUTHENTICATION FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User → Constraint Flow: Access protected resource           │
│                                                                  │
│  2. Constraint Flow → IdP: Redirect to SSO login                │
│     └─ SAML AuthnRequest / OIDC Authorization Request           │
│                                                                  │
│  3. User → IdP: Authenticate (if not already)                   │
│                                                                  │
│  4. IdP → Constraint Flow: Return assertion/token               │
│     └─ SAML Response / OIDC Authorization Code                  │
│                                                                  │
│  5. Constraint Flow: Validate & create session                  │
│     └─ Verify signature, check audience, extract claims         │
│                                                                  │
│  6. Constraint Flow → User: Access granted                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Audit Logging

### Audit Log Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUDIT LOG ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Application ───► Audit Service ───► Immutable Storage          │
│        │               │                   │                     │
│        │               ▼                   ▼                     │
│        │         Real-time            Cold Storage              │
│        │         Processing          (S3/Glacier)               │
│        │               │                   │                     │
│        │               ▼                   ▼                     │
│        │         SIEM Integration    Compliance Archive         │
│        │         (Splunk/QRadar)     (7+ years)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Audit Event Schema

```typescript
interface AuditEvent {
  // Event identification
  id: string;                    // UUID
  version: '1.0';
  timestamp: string;             // ISO 8601
  
  // Event classification
  type: AuditEventType;
  category: 'authentication' | 'authorization' | 'data' | 'configuration' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  // Actor (who performed the action)
  actor: {
    type: 'user' | 'service' | 'system' | 'api-key';
    id: string;
    email?: string;
    name?: string;
    
    // Session context
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    geoLocation?: {
      country?: string;
      region?: string;
      city?: string;
    };
  };
  
  // Target (what was acted upon)
  target: {
    type: 'workflow' | 'execution' | 'connector' | 'user' | 'configuration' | 'secret';
    id: string;
    name?: string;
    
    // Resource details
    metadata?: Record<string, unknown>;
  };
  
  // Action details
  action: {
    operation: string;
    success: boolean;
    
    // Change tracking
    changes?: {
      before?: unknown;
      after?: unknown;
      diff?: Array<{
        path: string;
        oldValue: unknown;
        newValue: unknown;
      }>;
    };
    
    // Error details if failed
    error?: {
      code: string;
      message: string;
    };
  };
  
  // Context
  context: {
    requestId: string;
    correlationId?: string;
    traceId?: string;
    workflowId?: string;
    executionId?: string;
    tenantId: string;
  };
  
  // Integrity
  integrity: {
    hash: string;              // SHA-256 of event
    previousHash?: string;     // Blockchain-style chaining
    signature?: string;        // Digital signature
  };
}
```

### Audit Event Types

| Category | Event Types |
|----------|-------------|
| **Authentication** | `auth.login`, `auth.logout`, `auth.failed`, `auth.password_reset`, `auth.mfa_enabled`, `auth.session_expired` |
| **Authorization** | `authz.access_granted`, `authz.access_denied`, `authz.role_assigned`, `authz.role_revoked`, `authz.permission_changed` |
| **Data** | `data.read`, `data.create`, `data.update`, `data.delete`, `data.export`, `data.import` |
| **Configuration** | `config.workflow_created`, `config.workflow_updated`, `config.workflow_deleted`, `config.connector_added`, `config.settings_changed` |
| **System** | `system.startup`, `system.shutdown`, `system.error`, `system.backup`, `system.restore`, `system.maintenance` |

### Audit Log Retention

```typescript
const retentionPolicy = {
  // Default retention
  default: '1 year',
  
  // Compliance-specific retention
  byType: {
    'auth.login': '90 days',
    'auth.failed': '1 year',
    'authz.access_denied': '1 year',
    'data.export': '7 years',
    'config.*': '7 years',
    'system.*': '1 year',
  },
  
  // Compliance requirements
  compliance: {
    sox: '7 years',
    hipaa: '6 years',
    gdpr: 'As required',
    pci: '1 year',
  },
  
  // Archival
  archive: {
    enabled: true,
    afterDays: 90,
    storage: 's3://audit-archive',
    compression: 'gzip',
    encryption: 'AES-256',
  },
};
```

### SIEM Integration

```typescript
const siemConfig = {
  // Splunk integration
  splunk: {
    enabled: true,
    url: 'https://splunk.yourcompany.com:8088',
    token: process.env.SPLUNK_TOKEN,
    source: 'constraint-flow',
    sourcetype: 'audit',
    index: 'security',
    
    // Event filtering
    filter: {
      severity: ['warning', 'error', 'critical'],
      types: ['auth.*', 'authz.*', 'data.export'],
    },
  },
  
  // Generic webhook
  webhook: {
    enabled: true,
    url: 'https://siem.yourcompany.com/api/events',
    headers: {
      'Authorization': 'Bearer ${SIEM_TOKEN}',
    },
    batchSize: 100,
    flushInterval: 5000,
  },
};
```

---

## Compliance

### Compliance Frameworks

| Framework | Status | Documentation |
|-----------|--------|---------------|
| SOC 2 Type II | ✅ Compliant | [SOC2 Report] |
| ISO 27001 | ✅ Compliant | [ISO Certificate] |
| HIPAA | ✅ Compliant | [HIPAA BAA] |
| GDPR | ✅ Compliant | [GDPR DPA] |
| PCI DSS | ✅ Level 1 | [PCI AOC] |
| FedRAMP | 🔄 In Progress | Expected Q3 2025 |

### Compliance Status Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE STATUS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SOC 2 Type II     ████████████████████  100% Compliant        │
│  ISO 27001         ████████████████████  100% Compliant        │
│  HIPAA             ████████████████████  100% Compliant        │
│  GDPR              ████████████████████  100% Compliant        │
│  PCI DSS L1        ████████████████████  100% Compliant        │
│  FedRAMP Moderate  ████████░░░░░░░░░░░░   45% In Progress      │
│                                                                  │
│  Last Assessment: 2024-Q4                                       │
│  Next Assessment: 2025-Q2                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### FedRAMP Progress

Constraint Flow is currently pursuing FedRAMP Moderate authorization:

| Phase | Status | Target |
|-------|--------|--------|
| Initial Assessment | ✅ Complete | Q1 2024 |
| Readiness Assessment | ✅ Complete | Q2 2024 |
| 3PAO Assessment | 🔄 In Progress | Q1 2025 |
| Agency Review | ⏳ Pending | Q2 2025 |
| Authorization | ⏳ Pending | Q3 2025 |

**Current Progress**: 45% complete

Key FedRAMP controls implemented:
- [x] NIST 800-53 control mapping
- [x] Continuous monitoring (ConMon)
- [x] Incident response procedures
- [x] Configuration management
- [ ] ATO package submission
- [ ] Agency sponsor identified

### Compliance Checklist

#### SOC 2 Type II

- [x] Security policies documented
- [x] Access control implemented
- [x] Encryption at rest (AES-256)
- [x] Encryption in transit (TLS 1.3)
- [x] Multi-factor authentication
- [x] Audit logging enabled
- [x] Vulnerability scanning (weekly)
- [x] Penetration testing (annual)
- [x] Incident response procedures
- [x] Business continuity plan
- [x] Disaster recovery plan
- [x] Change management process
- [x] Employee security training
- [x] Vendor risk management

#### HIPAA

- [x] Business Associate Agreement (BAA)
- [x] PHI encryption at rest
- [x] PHI encryption in transit
- [x] Access logging for PHI
- [x] Minimum necessary principle
- [x] Automatic logoff (15 min)
- [x] Password policies enforced
- [x] Risk assessment (annual)
- [x] Incident notification procedures
- [x] Backup and recovery
- [x] Workstation security
- [x] Device and media controls

#### GDPR

- [x] Data processing agreement
- [x] Lawful basis documented
- [x] Consent management
- [x] Data subject rights
  - [x] Right to access
  - [x] Right to rectification
  - [x] Right to erasure
  - [x] Right to portability
  - [x] Right to restrict processing
- [x] Data Protection Impact Assessment
- [x] Cross-border transfer safeguards
- [x] Breach notification (72 hours)
- [x] Records of processing activities

### Data Subject Requests

```typescript
// Right to Access
async function handleAccessRequest(userId: string): Promise<DataAccessReport> {
  return {
    personalData: await collectPersonalData(userId),
    processingActivities: await getProcessingActivities(userId),
    thirdParties: await getThirdPartySharing(userId),
    retentionPeriods: await getRetentionInfo(userId),
  };
}

// Right to Erasure
async function handleErasureRequest(userId: string): Promise<ErasureReport> {
  const result = await db.transaction(async (tx) => {
    // Anonymize or delete personal data
    await anonymizeUserData(tx, userId);
    await deletePII(tx, userId);
    await revokeConsents(tx, userId);
    
    // Keep audit trail (required)
    await createErasureAuditEntry(tx, userId);
  });
  
  return {
    status: 'completed',
    deletedData: result.deletedRecords,
    retainedData: 'audit_logs', // Always retained
    completedAt: new Date().toISOString(),
  };
}

// Right to Portability
async function handlePortabilityRequest(userId: string): Promise<PortableData> {
  const data = await exportUserData(userId);
  
  return {
    format: 'JSON',
    data: data,
    exportedAt: new Date().toISOString(),
  };
}
```

---

## Disaster Recovery

### Recovery Objectives

| Metric | Target | Description |
|--------|--------|-------------|
| **RPO** (Recovery Point Objective) | 1 hour | Maximum data loss |
| **RTO** (Recovery Time Objective) | 4 hours | Maximum downtime |
| **RTA** (Recovery Time Actual) | < 2 hours | Target achieved |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISASTER RECOVERY ARCHITECTURE                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PRIMARY REGION                    DR REGION                     │
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │   Load Balancer │              │   Load Balancer │           │
│  └────────┬────────┘              └────────┬────────┘           │
│           │                                │                     │
│  ┌────────▼────────┐              ┌────────▼────────┐           │
│  │  API Servers    │              │  API Servers    │           │
│  │  (Active)       │              │  (Standby)      │           │
│  └────────┬────────┘              └────────┬────────┘           │
│           │                                │                     │
│  ┌────────▼────────┐    Sync      ┌────────▼────────┐           │
│  │    Database     │──────────────▶│    Database     │           │
│  │   (Primary)     │   Async      │   (Replica)     │           │
│  └────────┬────────┘              └────────┬────────┘           │
│           │                                │                     │
│  ┌────────▼────────┐              ┌────────▼────────┐           │
│  │     Storage     │              │     Storage     │           │
│  │   (S3 Primary)  │──────────────▶│  (S3 Replica)  │           │
│  └─────────────────┘              └─────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Backup Strategy

```typescript
const backupConfig = {
  // Database backups
  database: {
    // Continuous archiving
    walArchiving: {
      enabled: true,
      destination: 's3://backups/wal/',
      compression: true,
      encryption: 'AES-256',
    },
    
    // Full backups
    fullBackup: {
      schedule: '0 2 * * *', // Daily at 2 AM
      retention: 30, // days
      destination: 's3://backups/database/',
      verification: true,
    },
    
    // Incremental backups
    incremental: {
      schedule: '0 */6 * * *', // Every 6 hours
      retention: 7, // days
    },
  },
  
  // Application state
  application: {
    configBackup: {
      schedule: '0 3 * * *',
      destination: 's3://backups/config/',
      retention: 90,
    },
    
    secretsBackup: {
      schedule: '0 4 * * *',
      destination: 'vault://backup/',
      retention: 90,
      encryption: true,
    },
  },
  
  // Workflow definitions
  workflows: {
    versionHistory: true,
    maxVersions: 50,
    exportSchedule: '0 5 * * *',
    destination: 's3://backups/workflows/',
  },
};
```

### Recovery Procedures

#### Database Recovery

```bash
#!/bin/bash
# database-recovery.sh

# 1. Stop application services
kubectl scale deployment constraint-flow --replicas=0

# 2. Verify backup integrity
aws s3 ls s3://backups/database/latest/

# 3. Restore database
pg_restore --clean --if-exists \
  --dbname=constraint_flow \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  s3://backups/database/latest/backup.dump

# 4. Verify data integrity
psql -c "SELECT count(*) FROM workflows;"

# 5. Restart application
kubectl scale deployment constraint-flow --replicas=3

# 6. Verify application health
curl -f https://constraint-flow/health/ready || exit 1
```

#### Full Region Failover

```bash
#!/bin/bash
# region-failover.sh

# 1. Update DNS to DR region
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://dr-dns-update.json

# 2. Promote DR database to primary
aws rds promote-read-replica \
  --db-instance-identifier constraint-flow-dr

# 3. Scale up DR application servers
kubectl scale deployment constraint-flow \
  --replicas=5 \
  --context=dr-cluster

# 4. Update configuration
kubectl set env deployment/constraint-flow \
  DATABASE_URL=$DR_DATABASE_URL \
  --context=dr-cluster

# 5. Verify health
./scripts/verify-health.sh dr-region

# 6. Notify team
./scripts/notify-failover.sh "DR failover completed"
```

### Recovery Testing

| Test Type | Frequency | Scope |
|-----------|-----------|-------|
| Backup Verification | Daily | Automated integrity check |
| Table Recovery | Weekly | Single table restore test |
| Database Recovery | Monthly | Full database restore |
| DR Failover Test | Quarterly | Full region failover |
| Full DR Exercise | Annually | Complete DR simulation |

### Runbook: Database Outage

```markdown
# Database Outage Runbook

## Detection
- Alert: DatabaseConnectionFailed
- Dashboard: Database metrics show connection errors

## Assessment
1. Check database status: `aws rds describe-db-instances`
2. Check application logs for error patterns
3. Determine if partial or complete outage

## Mitigation
### If Primary Database Degraded
1. Enable connection pooling bypass
2. Scale read replicas for read traffic
3. Enable circuit breakers for write operations

### If Primary Database Down
1. Activate read-only mode
2. Assess recovery time estimate
3. If > 15 min, initiate DR failover

## Recovery
1. Restore from most recent backup
2. Apply WAL logs to point of failure
3. Verify data integrity
4. Resume normal operations

## Post-Incident
1. Document timeline
2. Update runbook if needed
3. Conduct blameless postmortem
```

### Communication Templates

#### Internal Incident Notification

```
Subject: [SEVERITY] Constraint Flow Incident - Database Outage

Summary: Database connectivity issues affecting workflow execution

Impact: 
- Workflow executions failing since [TIME]
- [X] users affected

Current Status: Investigating

Next Update: [TIME + 15 min]

Incident Commander: [NAME]
```

#### Customer Notification

```
Subject: Constraint Flow Service Update

We are currently experiencing issues with workflow execution.
Our team is actively working to resolve this.

Impact: Workflow executions may fail or be delayed
StartTime: [TIME]
Current Status: [STATUS]
ETA for Resolution: [TIME]

We will provide updates every 30 minutes.

Status Page: https://status.constraint-flow.ai
```

---

**Last Updated**: 2025-01-27
**Document Version**: 1.0.0
