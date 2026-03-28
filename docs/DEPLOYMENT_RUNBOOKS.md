# Deployment Runbooks

This document provides operational runbooks for deploying and maintaining Constraint Flow in production environments.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Standard Deployment](#standard-deployment)
- [Blue-Green Deployment](#blue-green-deployment)
- [Canary Deployment](#canary-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Scaling Operations](#scaling-operations)
- [Incident Response](#incident-response)
- [Maintenance Windows](#maintenance-windows)

---

## Pre-Deployment Checklist

### Infrastructure Verification

```bash
# Verify cluster health
kubectl get nodes
kubectl get pods -n constraint-flow

# Verify database connectivity
psql -h $DB_HOST -U $DB_USER -d constraint_flow -c "SELECT 1"

# Verify Redis connectivity
redis-cli -h $REDIS_HOST ping

# Verify secrets are configured
kubectl get secrets -n constraint-flow
kubectl describe secret constraint-flow-secrets -n constraint-flow
```

### Configuration Validation

```bash
# Validate configuration
constraint-flow config validate --environment production

# Check environment variables
constraint-flow doctor --check-env

# Verify connector credentials
constraint-flow connectors test --all
```

### Security Checklist

- [ ] All secrets stored in Kubernetes secrets or vault
- [ ] TLS certificates valid and not expiring soon
- [ ] Network policies configured correctly
- [ ] RBAC permissions reviewed
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] Security headers configured

### Capacity Verification

```bash
# Check current resource usage
kubectl top nodes
kubectl top pods -n constraint-flow

# Verify autoscaling is configured
kubectl get hpa -n constraint-flow

# Check database capacity
psql -c "SELECT pg_database_size('constraint_flow') as size;"
```

---

## Standard Deployment

### Deployment Command

```bash
# Deploy latest version
kubectl apply -f k8s/constraint-flow/

# Or using Helm
helm upgrade constraint-flow ./charts/constraint-flow \
  --namespace constraint-flow \
  --values values-production.yaml \
  --set image.tag=$VERSION
```

### Deployment Verification

```bash
# Wait for rollout to complete
kubectl rollout status deployment/constraint-flow -n constraint-flow --timeout=300s

# Verify pod health
kubectl get pods -n constraint-flow -l app=constraint-flow

# Check logs
kubectl logs -f deployment/constraint-flow -n constraint-flow

# Run health checks
curl -f https://constraint-flow/health/ready
curl -f https://constraint-flow/health/detail
```

### Post-Deployment Validation

```bash
# Run smoke tests
npm run test:smoke -- --environment production

# Verify metrics are flowing
curl https://constraint-flow/metrics | grep constraint_flow

# Check error rates
curl 'https://grafana.internal/api/datasources/prometheus/query' \
  --data-urlencode 'query=rate(constraint_flow_errors_total[5m])'
```

---

## Blue-Green Deployment

### Overview

Blue-green deployment maintains two identical production environments and switches traffic between them.

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLUE-GREEN ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌──────────────┐                             │
│                    │ Load Balancer│                             │
│                    └──────┬───────┘                             │
│                           │                                      │
│              ┌────────────┼────────────┐                        │
│              │                         │                         │
│     ┌────────▼────────┐     ┌────────▼────────┐               │
│     │    BLUE (v1)    │     │   GREEN (v2)    │               │
│     │    ACTIVE       │     │    STANDBY      │               │
│     │                 │     │                 │               │
│     │  ┌───────────┐  │     │  ┌───────────┐  │               │
│     │  │ API Pods  │  │     │  │ API Pods  │  │               │
│     │  └───────────┘  │     │  └───────────┘  │               │
│     │  ┌───────────┐  │     │  ┌───────────┐  │               │
│     │  │ Workers   │  │     │  │ Workers   │  │               │
│     │  └───────────┘  │     │  └───────────┘  │               │
│     └─────────────────┘     └─────────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Blue-Green Deployment Steps

```bash
# 1. Deploy to GREEN environment
kubectl apply -f k8s/constraint-flow-green/

# 2. Wait for GREEN to be ready
kubectl rollout status deployment/constraint-flow-green -n constraint-flow

# 3. Run validation on GREEN
./scripts/validate-deployment.sh green

# 4. Switch traffic to GREEN
kubectl patch service constraint-flow \
  -n constraint-flow \
  -p '{"spec":{"selector":{"version":"green"}}}'

# 5. Monitor for issues
./scripts/monitor-deployment.sh 300  # Monitor for 5 minutes

# 6. If successful, decommission BLUE
kubectl scale deployment/constraint-flow-blue -n constraint-flow --replicas=0

# 7. If issues, rollback
kubectl patch service constraint-flow \
  -n constraint-flow \
  -p '{"spec":{"selector":{"version":"blue"}}}'
```

### Automated Blue-Green Script

```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

set -e

VERSION=$1
CURRENT=$(kubectl get service constraint-flow -o jsonpath='{.spec.selector.version}')
TARGET="green"
if [ "$CURRENT" == "green" ]; then
  TARGET="blue"
fi

echo "Current: $CURRENT, Target: $TARGET, Version: $VERSION"

# Deploy to target
helm upgrade constraint-flow-$TARGET ./charts/constraint-flow \
  --namespace constraint-flow \
  --set image.tag=$VERSION \
  --set deployment.name=constraint-flow-$TARGET \
  --set deployment.version=$TARGET

# Wait for ready
kubectl rollout status deployment/constraint-flow-$TARGET -n constraint-flow --timeout=300s

# Run tests
./scripts/smoke-test.sh $TARGET

# Switch traffic
kubectl patch service constraint-flow -n constraint-flow \
  -p "{\"spec\":{\"selector\":{\"version\":\"$TARGET\"}}}"

echo "Deployment complete. Traffic now on $TARGET"
```

---

## Canary Deployment

### Overview

Canary deployment gradually shifts traffic to the new version while monitoring for issues.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CANARY DEPLOYMENT                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌──────────────┐                             │
│                    │ Load Balancer│                             │
│                    └──────┬───────┘                             │
│                           │                                      │
│              ┌────────────┼────────────┐                        │
│              │            │            │                         │
│         90%  │       10%  │            │                         │
│     ┌────────▼────────┐ ┌─▼──────────┐                         │
│     │     STABLE      │ │   CANARY   │                         │
│     │    (v1.2.3)     │ │  (v1.2.4)  │                         │
│     │                 │ │            │                         │
│     │  ┌───────────┐  │ │ ┌────────┐ │                         │
│     │  │  9 pods   │  │ │ │ 1 pod  │ │                         │
│     │  └───────────┘  │ │ └────────┘ │                         │
│     └─────────────────┘ └────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Canary Configuration

```yaml
# canary-config.yaml
canary:
  enabled: true
  targetVersion: v1.2.4
  
  # Traffic stages
  stages:
    - percentage: 5
      duration: 10m
      successThreshold: 0.99
    - percentage: 20
      duration: 15m
      successThreshold: 0.99
    - percentage: 50
      duration: 20m
      successThreshold: 0.995
    - percentage: 100
      duration: 5m
      successThreshold: 0.999
  
  # Rollback conditions
  rollback:
    errorRateThreshold: 0.01
    latencyP99Threshold: 5000ms
    automaticRollback: true
  
  # Monitoring
  monitoring:
    metricsInterval: 30s
    analysisWindow: 5m
```

### Canary Deployment Script

```bash
#!/bin/bash
# scripts/canary-deploy.sh

set -e

VERSION=$1

# Initialize canary
kubectl apply -f k8s/constraint-flow-canary.yaml \
  --set image.tag=$VERSION \
  --set canary.enabled=true

# Stage 1: 5% traffic
kubectl patch service constraint-flow -n constraint-flow \
  -p '{"spec":{"trafficPolicy":{"canary":{"weight":5}}}}'

sleep 600  # 10 minutes
./scripts/analyze-canary-metrics.sh || ./scripts/rollback-canary.sh

# Stage 2: 20% traffic
kubectl patch service constraint-flow -n constraint-flow \
  -p '{"spec":{"trafficPolicy":{"canary":{"weight":20}}}}'

sleep 900  # 15 minutes
./scripts/analyze-canary-metrics.sh || ./scripts/rollback-canary.sh

# Stage 3: 50% traffic
kubectl patch service constraint-flow -n constraint-flow \
  -p '{"spec":{"trafficPolicy":{"canary":{"weight":50}}}}'

sleep 1200  # 20 minutes
./scripts/analyze-canary-metrics.sh || ./scripts/rollback-canary.sh

# Stage 4: 100% traffic
kubectl patch service constraint-flow -n constraint-flow \
  -p '{"spec":{"trafficPolicy":{"canary":{"weight":100}}}}'

echo "Canary deployment complete"
```

---

## Rollback Procedures

### Quick Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/constraint-flow -n constraint-flow

# Rollback to specific revision
kubectl rollout undo deployment/constraint-flow -n constraint-flow --to-revision=3

# Verify rollback
kubectl rollout status deployment/constraint-flow -n constraint-flow
```

### Database Rollback

```bash
#!/bin/bash
# scripts/db-rollback.sh

# Stop application
kubectl scale deployment/constraint-flow -n constraint-flow --replicas=0

# Find most recent backup
LATEST_BACKUP=$(aws s3 ls s3://backups/database/ | sort | tail -1 | awk '{print $4}')

# Restore database
pg_restore --clean --if-exists \
  --dbname=constraint_flow \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  s3://backups/database/$LATEST_BACKUP

# Verify data integrity
psql -c "SELECT count(*) FROM workflows;"
psql -c "SELECT count(*) FROM executions;"

# Restart application
kubectl scale deployment/constraint-flow -n constraint-flow --replicas=3
```

### Emergency Rollback

```bash
#!/bin/bash
# scripts/emergency-rollback.sh

set -e

echo "🚨 EMERGENCY ROLLBACK INITIATED"

# 1. Stop all traffic
kubectl patch service constraint-flow -n constraint-flow \
  -p '{"spec":{"type":"ClusterIP"}}'

# 2. Scale down
kubectl scale deployment/constraint-flow -n constraint-flow --replicas=0

# 3. Restore from last known good backup
./scripts/db-rollback.sh

# 4. Deploy last known good version
helm upgrade constraint-flow ./charts/constraint-flow \
  --namespace constraint-flow \
  --values values-production.yaml \
  --set image.tag=$LAST_KNOWN_GOOD_VERSION

# 5. Scale up
kubectl scale deployment/constraint-flow -n constraint-flow --replicas=3

# 6. Restore traffic
kubectl patch service constraint-flow -n constraint-flow \
  -p '{"spec":{"type":"LoadBalancer"}}'

# 7. Notify team
./scripts/notify-rollback.sh

echo "✅ Emergency rollback complete"
```

---

## Scaling Operations

### Horizontal Scaling

```bash
# Scale API servers
kubectl scale deployment/constraint-flow-api -n constraint-flow --replicas=10

# Scale workers
kubectl scale deployment/constraint-flow-worker -n constraint-flow --replicas=20

# Configure autoscaling
kubectl autoscale deployment constraint-flow-api \
  --cpu-percent=70 \
  --min=3 \
  --max=20 \
  -n constraint-flow
```

### Vertical Scaling

```bash
# Update resource limits
kubectl patch deployment constraint-flow-api -n constraint-flow \
  --type='json' \
  -p='[{
    "op": "replace",
    "path": "/spec/template/spec/containers/0/resources/requests/memory",
    "value": "4Gi"
  }]'
```

### Database Scaling

```bash
# Add read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier constraint-flow-read-replica-1 \
  --source-db-instance-identifier constraint-flow-primary

# Update connection pool to use read replicas
kubectl set env deployment/constraint-flow-api \
  DB_READ_REPLICAS=constraint-flow-read-replica-1.cluster-xyz.us-east-1.rds.amazonaws.com
```

---

## Incident Response

### Runbook: High Error Rate

```markdown
# High Error Rate Runbook

## Detection
- Alert: HighErrorRate
- Dashboard shows > 1% error rate

## Assessment
1. Check error logs
   ```bash
   kubectl logs -l app=constraint-flow --since=10m | grep ERROR
   ```

2. Identify error patterns
   ```bash
   ./scripts/analyze-errors.sh
   ```

3. Check recent deployments
   ```bash
   kubectl rollout history deployment/constraint-flow
   ```

## Mitigation
### If caused by recent deployment
1. Rollback to previous version
   ```bash
   kubectl rollout undo deployment/constraint-flow -n constraint-flow
   ```

### If caused by external service
1. Enable fallback mode
   ```bash
   kubectl set env deployment/constraint-flow EXTERNAL_SERVICE_FALLBACK=true
   ```

### If caused by database issues
1. Enable read-only mode
   ```bash
   kubectl set env deployment/constraint-flow READ_ONLY_MODE=true
   ```

## Communication
1. Update status page
2. Notify stakeholders via Slack
3. Create incident ticket

## Post-Incident
1. Document timeline
2. Conduct postmortem
3. Update runbook if needed
```

### Runbook: Database Connection Issues

```markdown
# Database Connection Issues Runbook

## Detection
- Alert: DatabaseConnectionFailed
- API returning 503 errors

## Assessment
1. Check database status
   ```bash
   aws rds describe-db-instances --db-instance-identifier constraint-flow
   ```

2. Check connection pool
   ```bash
   ./scripts/check-db-connections.sh
   ```

3. Check network connectivity
   ```bash
   kubectl exec -it constraint-flow-api-xxx -- nc -zv $DB_HOST 5432
   ```

## Mitigation
### If connection pool exhausted
1. Increase pool size
   ```bash
   kubectl set env deployment/constraint-flow DB_POOL_SIZE=100
   ```

2. Restart affected pods
   ```bash
   kubectl rollout restart deployment/constraint-flow-api
   ```

### If database overloaded
1. Scale up database
   ```bash
   aws rds modify-db-instance \
     --db-instance-identifier constraint-flow \
     --db-instance-class db.r5.xlarge
   ```

2. Route read queries to replicas
   ```bash
   kubectl set env deployment/constraint-flow DB_READ_REPLICA_ENABLED=true
   ```

### If database down
1. Activate maintenance mode
2. Initiate failover to DR
3. Notify all stakeholders
```

---

## Maintenance Windows

### Planned Maintenance

```bash
#!/bin/bash
# scripts/maintenance-mode.sh

# Enable maintenance mode
kubectl apply -f k8s/maintenance-mode.yaml

# Notify users
./scripts/notify-maintenance.sh start

# Perform maintenance
./scripts/run-maintenance-tasks.sh

# Verify systems
./scripts/verify-health.sh

# Disable maintenance mode
kubectl delete -f k8s/maintenance-mode.yaml

# Notify users
./scripts/notify-maintenance.sh end
```

### Maintenance Mode Configuration

```yaml
# k8s/maintenance-mode.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: maintenance-mode
  namespace: constraint-flow
data:
  enabled: "true"
  message: "Scheduled maintenance in progress. Expected completion: 2025-01-28 04:00 UTC"
  allowedIPs: "10.0.0.0/8,192.168.0.0/16"
```

### Zero-Downtime Maintenance

```bash
# Database schema migration without downtime
kubectl apply -f k8s/schema-migration-job.yaml

# Monitor migration
kubectl logs -f job/schema-migration -n constraint-flow

# Verify migration
psql -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;"
```

---

## Monitoring and Alerting

### Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 1% | Page on-call |
| P99 Latency | > 5s | Scale up |
| CPU Usage | > 80% | Scale up |
| Memory Usage | > 85% | Scale up |
| DB Connections | > 80% pool | Increase pool |
| Queue Depth | > 1000 | Add workers |

### Alert Channels

```yaml
# alertmanager-config.yaml
receivers:
  - name: 'constraint-flow-critical'
    slack_configs:
      - channel: '#constraint-flow-alerts'
        send_resolved: true
    pagerduty_configs:
      - service_key: $PAGERDUTY_KEY
        
  - name: 'constraint-flow-warning'
    slack_configs:
      - channel: '#constraint-flow-warnings'
```

---

## Related Documentation

- [Enterprise Guide](./ENTERPRISE.md) - SSO, audit logging, compliance
- [Production Guide](./PRODUCTION.md) - Rate limiting, monitoring
- [Security Guide](./SECURITY.md) - Security best practices

---

**Last Updated**: 2025-01-27
**Document Version**: 1.0.0
