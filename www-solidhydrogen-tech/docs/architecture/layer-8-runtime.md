# Layer 8 — Runtime Module Reference

## Overview

Layer 8 runtime modules provide type definitions and infrastructure helpers for the delivery pipeline. These modules define the data structures, state machines, event types, and configuration used by the deployment system.

## Modules

### delivery-status.ts
**Purpose:** Delivery pipeline status tracking — phase states, progress, and timing.

**Exports:**
- `DeliveryPhase` — Union type of 9 pipeline phases (idle, building, pushing, deploying, configuring, verifying, completed, failed, rolling-back)
- `DeliveryStepStatus` — Per-step status (id, phase, status, timing)
- `DeliveryPipelineStatus` — Full pipeline status (current phase, progress, steps)
- `DeliveryPhaseDefinition` — Phase label and description
- `DELIVERY_PHASE_DEFINITIONS` — All phase definitions
- `DELIVERY_STATE_TRANSITIONS` — Valid phase transitions
- `DEFAULT_DELIVERY_STEPS` — 9-step default pipeline configuration

### delivery-health.ts
**Purpose:** Delivery pipeline health state — scoring, thresholds, and monitoring.

**Exports:**
- `DeliveryHealthState` — Union type (healthy, degraded, unhealthy, unknown)
- `DeliveryHealthScoreWeights` — Category weight configuration
- `DeliveryHealthThresholds` — Score thresholds for state transitions
- `DeliveryHealthCheckConfig` — Per-check configuration (category, weight, critical flag)
- `DELIVERY_HEALTH_STATE_DEFINITIONS` — All health state definitions
- `DEFAULT_DELIVERY_HEALTH_SCORE_WEIGHTS` — Default weights (infrastructure 0.25, network 0.25, content 0.25, auth 0.15, seo 0.10)
- `DEFAULT_DELIVERY_HEALTH_THRESHOLDS` — Default thresholds (healthy ≥90, degraded ≥70, unhealthy <70)
- `DELIVERY_HEALTH_CHECK_CONFIGS` — 14 health check configurations

### delivery-metrics.ts
**Purpose:** Delivery pipeline metrics — timing, success rates, and statistics.

**Exports:**
- `DeliveryMetricName` — 15 metric names (deployment counts, timing, verification)
- `DeliveryMetricDefinition` — Metric name, label, unit, description
- `DELIVERY_METRIC_DEFINITIONS` — All 15 metric definitions
- `DeliveryMetricsWindow` — Time windows (current, 1h, 24h, 7d, 30d)
- `DeliveryMetricsAggregationConfig` — Aggregation settings
- `DEFAULT_DELIVERY_METRICS_AGGREGATION` — Default aggregation config
- `DeliveryMetricsRetentionConfig` — Retention policy (100 records, 90 days)
- `DEFAULT_DELIVERY_METRICS_RETENTION` — Default retention config
- `DeliveryMetricsSummary` — Summary metrics (counts, rates, averages)

### delivery-context.ts
**Purpose:** Delivery pipeline context — active deployment state, configuration, and environment.

**Exports:**
- `DeliveryStepContext` — Per-step execution context
- `DeliveryDeploymentContext` — Active deployment context
- `DeliverySessionContext` — Session-level context
- `DeliveryConfiguration` — Full pipeline configuration
- `DEFAULT_DELIVERY_CONFIGURATION` — Default configuration
- `DELIVERY_STATE_TRANSITIONS_CONTEXT` — State transitions (mirrors delivery-status)

### delivery-events.ts
**Purpose:** Event types for deployment lifecycle, verification, rollback, and errors.

**Exports:**
- `DeliveryEventType` — 17 event types
- `DeliveryEvent` — Base event interface
- `DeliveryDeploymentStartedEvent` — Deployment started
- `DeliveryDeploymentCompletedEvent` — Deployment completed
- `DeliveryDeploymentFailedEvent` — Deployment failed
- `DeliveryStepStartedEvent` — Step started
- `DeliveryStepCompletedEvent` — Step completed
- `DeliveryStepFailedEvent` — Step failed
- `DeliveryHealthChangedEvent` — Health state changed
- `DeliveryRollbackStartedEvent` — Rollback started
- `DeliveryRollbackCompletedEvent` — Rollback completed
- `DeliveryErrorOccurredEvent` — Error occurred
- `DeliveryEventHistoryLimits` — History limits (500 events, 24h retention)
- `DEFAULT_DELIVERY_EVENT_HISTORY_LIMITS` — Default limits

### delivery-state.ts
**Purpose:** Session state tracking, state transition rules, deployment/verification status.

**Exports:**
- `DeliveryStepOutcome` — Step outcomes (success, failure, skipped, pending)
- `DeliveryStepStatus` — Step status with outcome
- `DeliveryDeploymentOutcome` — Deployment outcomes (success, failure, rolled-back)
- `DeliveryDeploymentStatus` — Full deployment status
- `DeliveryVerificationOutcome` — Verification outcomes (pass, fail, warn, skip)
- `DeliveryVerificationStatus` — Verification status
- `DeliveryStateSummary` — State summary
- `DELIVERY_STEP_TRANSITIONS` — Valid step outcome transitions
- `DELIVERY_DEPLOYMENT_TRANSITIONS` — Valid deployment outcome transitions

### delivery-runtime.ts
**Purpose:** Runtime metadata types, orchestration interfaces for the delivery pipeline.

**Exports:**
- `RuntimeDeliveryStepStatus` — Runtime step status
- `RuntimeDeliveryDeployment` — Runtime deployment record
- `RuntimeDeliveryVerification` — Runtime verification record
- `RuntimeDeliveryFailure` — Runtime failure record
- `RuntimeDeliveryHistoryLimits` — History limits (100 deployments, 200 verifications, 50 failures)
- `DEFAULT_DELIVERY_HISTORY_LIMITS` — Default limits
- `RuntimeDeliveryStatus` — Full runtime status

## Import Graph

```
delivery-status.ts   → (terminal — no imports)
delivery-health.ts   → (terminal — no imports)
delivery-metrics.ts  → (terminal — no imports)
delivery-context.ts  → delivery-health, delivery-status
delivery-events.ts   → delivery-health
delivery-state.ts    → delivery-status, delivery-health, delivery-context
delivery-runtime.ts  → delivery-status, delivery-health
```

DAG structure: 3 root nodes, 4 dependents. No circular dependencies.
