# Layer 4 — Runtime

## Overview

Layer 4 Runtime is the runtime metadata framework for the Browser Extraction Layer. It defines session lifecycle tracking, navigation history, capture history, health monitoring state, and metrics aggregation for browser-level operations.

---

## Runtime Files

| File | Purpose | Owner |
|---|---|---|
| `runtime/browser-status.json` | Current state of each browser engine | Layer 4 |
| `runtime/browser-session.json` | Session lifecycle tracking | Layer 4 |
| `runtime/browser-health.json` | Health states, scores, and trends | Layer 4 |
| `runtime/browser-metrics.json` | Navigation, capture, and performance metrics | Layer 4 |
| `runtime/browser-history.json` | Recent events, sessions, and failure records | Layer 4 |

---

## Session Lifecycle

```
Created → Active → Busy → Active → Idle → Closed
    ↓         ↓       ↓
  Failed    Failed  Timeout
    ↓         ↓       ↓
 Recovered  Closed  Recovered → Active
```

### Session States

| State | Description | Transitions To |
|---|---|---|
| `created` | Session initialized but not yet active | active, failed, closed |
| `active` | Session is ready for navigation | busy, idle, failed, closed |
| `busy` | Session is processing a request | active, failed, timeout |
| `idle` | Session is active but not processing | active, closed, timeout |
| `failed` | Session has encountered an error | closed, recovered |
| `closed` | Session has been closed and cleaned up | (none) |
| `recovered` | Session has recovered from failure | active, busy |
| `timeout` | Session has timed out | closed, recovered |

---

## Navigation Tracking

Each navigation event records:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique navigation ID |
| `url` | string | Target URL |
| `engine` | string | Engine used |
| `status` | string | success, failed, timeout, redirected |
| `finalUrl` | string | Final URL after redirects |
| `responseCode` | number | HTTP response code |
| `durationMs` | number | Navigation duration |
| `sessionId` | string | Browser session ID |
| `timestamp` | string | ISO 8601 timestamp |

---

## Capture Tracking

Each capture event records:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique capture ID |
| `url` | string | Target URL |
| `engine` | string | Engine used |
| `status` | string | success, failed, empty, invalid |
| `contentLength` | number | HTML content length in bytes |
| `title` | string | Captured page title |
| `durationMs` | number | Capture duration |
| `sessionId` | string | Browser session ID |
| `timestamp` | string | ISO 8601 timestamp |

---

## History Limits

| Limit | Default | Description |
|---|---|---|
| `maxRecentNavigations` | 100 | Maximum navigation records to retain |
| `maxRecentCaptures` | 100 | Maximum capture records to retain |
| `maxRecentSessions` | 50 | Maximum session records to retain |
| `maxRecentFailures` | 50 | Maximum failure records to retain |

---

## Integration

### Layer 3 Consumption

Layer 4 runtime metadata is consumed by Layer 3 for:
- Engine health assessment
- Extraction metrics aggregation
- Recovery decision support
- Performance reporting

### Runtime File Ownership

| File | Written By | Read By |
|---|---|---|
| `browser-status.json` | Layer 4 | Layer 3 |
| `browser-session.json` | Layer 4 | Layer 4 |
| `browser-health.json` | Layer 4 | Layer 3, Layer 4 |
| `browser-metrics.json` | Layer 4 | Layer 3 |
| `browser-history.json` | Layer 4 | Layer 3, Layer 4 |

---

## Layer Boundary

Layer 4 runtime metadata is:
- **Written by** Layer 4 (Browser Extraction Layer)
- **Read by** Layer 3 (Extraction Manager) for health and metrics
- **NOT written to** SQLite (Layer 3 responsibility)
- **NOT used by** Layer 2 (Workflow/Execution)
