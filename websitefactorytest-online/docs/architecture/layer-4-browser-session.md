# Layer 4 — Browser Session Framework

## Overview

The Browser Session Framework defines session lifecycle management for the Layer 4 Browser Extraction Layer. It tracks session creation, activation, navigation, capture, failure, recovery, and cleanup.

---

## Session States

| State | Description | Icon |
|---|---|---|
| **Created** | Session initialized but not yet active | 🔵 |
| **Active** | Session is ready for navigation | 🟢 |
| **Busy** | Session is processing a request | 🟡 |
| **Idle** | Session is active but not processing | ⚪ |
| **Failed** | Session has encountered an error | 🔴 |
| **Closed** | Session has been closed and cleaned up | ⚫ |
| **Recovered** | Session has recovered from failure | 🟢 |
| **Timeout** | Session has timed out | 🟠 |

---

## State Transitions

```
Created ──→ Active ──→ Busy ──→ Active ──→ Idle ──→ Closed
  │           │         │                    │
  │           │         │                    ↓
  │           │         │                  Timeout ──→ Closed
  │           │         │                    │
  │           │         │                    ↓
  │           │         │                Recovered ──→ Active
  │           │         │
  │           │         ↓
  │           │       Failed ──→ Closed
  │           │         │
  │           │         ↓
  │           │     Recovered ──→ Active
  │           │
  │           ↓
  │         Failed ──→ Closed
  │
  ↓
Closed
```

### Allowed Transitions

| From | To |
|---|---|
| `created` | `active`, `failed`, `closed` |
| `active` | `busy`, `idle`, `failed`, `closed` |
| `busy` | `active`, `failed`, `timeout` |
| `idle` | `active`, `closed`, `timeout` |
| `failed` | `closed`, `recovered` |
| `closed` | (none) |
| `recovered` | `active`, `busy` |
| `timeout` | `closed`, `recovered` |

---

## Session Lifecycle

### Creation

1. Validate engine name and session limits
2. Initialize session with configuration (timeout, user agent, viewport)
3. Set state to `created`
4. Transition to `active` when ready

### Active

1. Session is ready to receive navigation requests
2. Transition to `busy` when processing a request
3. Transition to `idle` when no active requests
4. Auto-close after idle timeout (30s default)

### Busy

1. Session is processing a navigation or capture request
2. Transition back to `active` when request completes
3. Transition to `failed` on error
4. Transition to `timeout` on timeout

### Failed

1. Session has encountered an error
2. Attempt recovery if recoverable
3. Transition to `recovered` if recovery succeeds
4. Transition to `closed` if unrecoverable or cleanup complete

### Timeout

1. Session has exceeded its timeout
2. Attempt recovery if recoverable
3. Transition to `closed` if unrecoverable
4. Transition to `recovered` if recovery succeeds

### Closed

1. Session resources released
2. Connections closed
3. Memory freed
4. Session recorded in history
5. No further transitions

---

## Session Limits

| Limit | Default | Description |
|---|---|---|
| `maxActiveSessions` | 3 | Total concurrent active sessions |
| `maxSessionsPerEngine` | 1 | Sessions per engine |
| `sessionTimeoutMs` | 60000 | Maximum session lifetime |
| `idleTimeoutMs` | 30000 | Idle timeout before auto-close |

---

## Session Configuration

| Field | Type | Default | Description |
|---|---|---|---|
| `timeoutMs` | number | 60000 | Session timeout |
| `userAgent` | string | Chrome/120.0.0.0 | Browser user agent |
| `viewport` | object | 1920x1080 | Browser viewport |
| `cookies` | Record | {} | Session cookies |
| `headers` | Record | {} | Custom headers |

---

## Session Recovery

| Scenario | Behaviour |
|---|---|
| Navigation timeout | Report to Layer 3; Layer 3 decides engine switch |
| Capture failure | Attempt retry within session; report to Layer 3 |
| Session crash | Cleanup failed session; report to Layer 3 |
| Memory limit | Force-close session; report to Layer 3 |

---

## Infrastructure Files

| File | Purpose |
|---|---|
| `src/discovery/browser/browser-session.ts` | Session types and state definitions |
| `policies/browser-session-policy.json` | Session behaviour rules |
| `runtime/browser-session.json` | Session runtime metadata |
| `workflows/browser-session-workflow.json` | Session lifecycle workflow |
