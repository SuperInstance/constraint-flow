# API Deprecation Policy

This document outlines the deprecation policy for Constraint Flow APIs, connectors, and workflow definitions. We are committed to providing a stable, backward-compatible platform while enabling continuous improvement.

## Table of Contents

- [Versioning Strategy](#versioning-strategy)
- [Deprecation Process](#deprecation-process)
- [Deprecation Timeline](#deprecation-timeline)
- [Breaking vs Non-Breaking Changes](#breaking-vs-non-breaking-changes)
- [Deprecation Notices](#deprecation-notices)
- [Migration Guides](#migration-guides)
- [Current Deprecations](#current-deprecations)

---

## Versioning Strategy

Constraint Flow follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH[-PRERELEASE]

Example: 1.2.3-beta.1
```

### Version Components

| Component | Description | Breaking Changes |
|-----------|-------------|------------------|
| **MAJOR** | Incompatible API changes | Yes |
| **MINOR** | Backwards-compatible features | No |
| **PATCH** | Backwards-compatible fixes | No |
| **PRERELEASE** | Alpha/beta releases | Possible |

### API Versioning

- **Workflow Schema**: Versioned independently via `version` field
- **Connector APIs**: Versioned per connector
- **Core APIs**: Versioned via package version
- **Error Codes**: Never removed, only deprecated

---

## Deprecation Process

### 1. Announcement

When deprecating an API, connector, or feature:

1. Add `@deprecated` JSDoc annotation
2. Add `deprecated: true` to operation definition
3. Add `deprecationMessage` with migration guidance
4. Publish announcement in:
   - CHANGELOG.md
   - Release notes
   - Documentation

### 2. Warning Period

During the warning period:

1. Runtime warnings emitted when deprecated APIs are used
2. Deprecation notices appear in logs
3. Documentation clearly marks deprecated features

### 3. Sunset Period

After the warning period:

1. Deprecated features remain functional
2. Stronger warnings emitted
3. Migration deadline communicated

### 4. Removal

After the sunset period:

1. Feature is removed in next MAJOR version
2. Migration guide published
3. Breaking change documented in CHANGELOG

---

## Deprecation Timeline

### Standard Deprecation

| Phase | Duration | Actions |
|-------|----------|---------|
| **Announcement** | Day 0 | `@deprecated` annotation, documentation update |
| **Warning Period** | 90 days | Runtime warnings, logs |
| **Sunset Period** | 180 days | Final warnings, migration assistance |
| **Removal** | Next MAJOR release | Feature removed |

### Expedited Deprecation

For security issues or critical bugs:

| Phase | Duration | Actions |
|-------|----------|---------|
| **Announcement** | Day 0 | Immediate deprecation |
| **Warning Period** | 30 days | Strong warnings |
| **Sunset Period** | 60 days | Migration required |
| **Removal** | Next release | Feature removed |

### Extended Deprecation

For widely-used features:

| Phase | Duration | Actions |
|-------|----------|---------|
| **Announcement** | Day 0 | `@deprecated` annotation |
| **Warning Period** | 180 days | Runtime warnings |
| **Sunset Period** | 365 days | Migration support |
| **Removal** | Next MAJOR release | Feature removed |

---

## Breaking vs Non-Breaking Changes

### Breaking Changes (Require Major Version)

- Removing an API endpoint
- Removing a connector operation
- Changing required parameters
- Changing return type structure
- Removing error codes
- Renaming fields in workflow schema
- Changing constraint behavior

### Non-Breaking Changes (Minor/Patch Version)

- Adding new API endpoints
- Adding new connector operations
- Adding optional parameters
- Adding new error codes
- Adding new constraint types
- Performance improvements
- Bug fixes

### Gray Area

Some changes require careful consideration:

| Change Type | Breaking? | Notes |
|-------------|-----------|-------|
| Adding enum value | Maybe | If users validate against enum |
| Changing error messages | No | Unless parsed programmatically |
| Changing log format | Maybe | If users parse logs |
| Adding default values | No | Backwards compatible |
| Changing defaults | Yes | Affects existing behavior |

---

## Deprecation Notices

### In Code

```typescript
/**
 * @deprecated Use `createIssue` instead.
 * This method will be removed in version 2.0.0.
 * @see createIssue
 */
createTicket(input: TicketInput): Promise<TicketResult> {
  // Emit deprecation warning
  console.warn(
    'DEPRECATED: createTicket is deprecated. Use createIssue instead. ' +
    'Will be removed in version 2.0.0. ' +
    'See: https://docs.constraint-flow.ai/migration/createTicket'
  );
  
  return this.createIssue(input);
}
```

### In Connector Definition

```typescript
operations: {
  legacyOperation: {
    name: 'legacyOperation',
    description: 'Legacy operation - use newOperation instead',
    deprecated: true,
    deprecationMessage: 'Use newOperation instead. Will be removed in v2.0.0.',
    alternativeOperation: 'newOperation',
    sunsetDate: '2025-06-01',
    
    input: { /* ... */ },
    output: { /* ... */ }
  },
  
  newOperation: {
    name: 'newOperation',
    description: 'New and improved operation',
    input: { /* ... */ },
    output: { /* ... */ }
  }
}
```

### In Workflow Schema

```typescript
const workflow = defineWorkflow({
  name: 'my-workflow',
  version: '1.0.0',
  
  steps: [
    {
      id: 'legacy-step',
      connector: 'my-connector',
      // @deprecated - use newOperation instead
      operation: 'legacyOperation', // Warning at runtime
      input: { /* ... */ }
    }
  ]
});
```

---

## Migration Guides

### Migration Guide Template

```markdown
# Migration Guide: Operation Renamed

## Summary
Brief description of what changed and why.

## Affected APIs
- `oldOperation` → `newOperation`

## Timeline
- **Deprecated**: 2024-01-01
- **Removal**: 2025-01-01 (v2.0.0)

## Before

\`\`\`typescript
const result = await connector.oldOperation({
  param1: 'value1',
  param2: 'value2'
});
\`\`\`

## After

\`\`\`typescript
const result = await connector.newOperation({
  newParam1: 'value1',  // renamed from param1
  newParam2: 'value2'   // renamed from param2
});
\`\`\`

## Key Changes
1. `param1` renamed to `newParam1`
2. `param2` renamed to `newParam2`
3. Response now includes `newField`

## Automated Migration
If available, describe migration tools or scripts.

## Questions?
Contact support or open a GitHub issue.
```

---

## Current Deprecations

### Active Deprecations

| Feature | Deprecated | Sunset | Replacement | Version |
|---------|------------|--------|-------------|---------|
| None currently | - | - | - | - |

### Planned Deprecations

| Feature | Planned | Reason | Status |
|---------|---------|--------|--------|
| None currently | - | - | - |

### Recently Removed

| Feature | Removed In | Replacement | Migration Guide |
|---------|-----------|-------------|-----------------|
| None currently | - | - | - |

---

## Error Code Stability

Error codes are **never removed**, only deprecated:

| Error Code | Status | Notes |
|------------|--------|-------|
| All current codes | Active | Will not be removed |

When deprecating an error code:
1. Add new error code
2. Update documentation
3. Old code remains valid indefinitely
4. New code recommended but not required

---

## Connector Versioning

Each connector follows its own version schedule:

```typescript
export const slackConnector: Connector = {
  name: 'slack',
  version: '1.2.0',  // Independent of core version
  
  operations: {
    // Operations can be deprecated independently
  }
};
```

### Connector Deprecation Rules

1. Operations can be deprecated without major version bump
2. Breaking changes require major version bump
3. New operations can be added anytime
4. Minimum 6 months notice before operation removal

---

## Workflow Schema Versioning

Workflow definitions include a `version` field:

```typescript
const workflow = defineWorkflow({
  name: 'my-workflow',
  version: '1.0.0',  // Workflow schema version
  
  steps: [/* ... */]
});
```

### Schema Evolution

| Change | Version Bump | Notes |
|--------|--------------|-------|
| Add step | Minor | Backwards compatible |
| Remove step | Major | Breaking change |
| Rename step | Major | Breaking change |
| Add constraint | Minor | Backwards compatible |
| Remove constraint | Major | Breaking change |
| Change constraint config | Major | Breaking change |

---

## Contact & Support

- **Deprecation Announcements**: [GitHub Releases](https://github.com/SuperInstance/constraint-flow/releases)
- **Migration Support**: [GitHub Discussions](https://github.com/SuperInstance/constraint-flow/discussions)
- **Questions**: [Support Portal](https://support.constraint-flow.ai)

---

**Last Updated**: 2025-01-27
**Policy Version**: 1.0.0
