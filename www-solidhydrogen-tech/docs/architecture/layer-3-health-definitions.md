# Layer 3 — Health Definitions

**Date:** 2026-07-18
**Scope:** Engine health states and transitions for the Layer 3 Extraction Manager

---

## Engine Health States

### Engine Alive

| Attribute | Detail |
|---|---|
| **State** | `alive` |
| **Description** | Engine is responsive and successfully completing extractions |
| **Indicators** | Success rate above 80%, average duration within 2x baseline, no recent errors |
| **Transitions** | Can transition to: `busy`, `failed`, `disabled` |
| **Action** | Continue normal extraction operations |

### Engine Busy

| Attribute | Detail |
|---|---|
| **State** | `busy` |
| **Description** | Engine is processing requests but may be slow |
| **Indicators** | Success rate 50-80%, average duration above 2x baseline, queue depth above 0 |
| **Transitions** | Can transition to: `alive`, `failed`, `disabled` |
| **Action** | Continue extraction with awareness of potential delays |

### Engine Failed

| Attribute | Detail |
|---|---|
| **State** | `failed` |
| **Description** | Engine is returning errors or timing out |
| **Indicators** | Success rate below 50%, consecutive failures above 3, timeout errors |
| **Transitions** | Can transition to: `alive`, `disabled` |
| **Action** | Trigger recovery switching to next engine in priority chain |

### Engine Disabled

| Attribute | Detail |
|---|---|
| **State** | `disabled` |
| **Description** | Engine is manually disabled or auto-disabled due to persistent failures |
| **Indicators** | Manual disable, auto-disable after 10 consecutive failures |
| **Transitions** | Can transition to: `alive` |
| **Action** | Skip this engine in priority chain, use next available engine |

### Engine Timeout

| Attribute | Detail |
|---|---|
| **State** | `timeout` |
| **Description** | Engine is responding but exceeding timeout thresholds |
| **Indicators** | Average duration above 5x baseline, timeout errors increasing |
| **Transitions** | Can transition to: `alive`, `failed`, `disabled` |
| **Action** | Apply timeout policy, consider engine health degradation |

---

## Recovery States

### Recovery Running

| Attribute | Detail |
|---|---|
| **State** | `recovery-running` |
| **Description** | Recovery engine is actively attempting extraction after primary failure |
| **Indicators** | Primary engine failed, fallback engine active |
| **Action** | Monitor recovery progress, apply timeout policy |

### Recovery Completed

| Attribute | Detail |
|---|---|
| **State** | `recovery-completed` |
| **Description** | Recovery engine successfully completed extraction |
| **Indicators** | Fallback success, product extracted |
| **Action** | Record recovery success, update engine health metrics |

### Recovery Failed

| Attribute | Detail |
|---|---|
| **State** | `recovery-failed` |
| **Description** | Recovery engine also failed — terminal failure |
| **Indicators** | All engines failed, product skipped |
| **Action** | Record terminal failure, skip product, log failure reason |

---

## State Transitions

### Valid Transitions

| From | To | Trigger |
|---|---|---|
| `alive` | `busy` | Queue depth increases, response times slow |
| `alive` | `failed` | Consecutive failures exceed threshold |
| `alive` | `disabled` | Manual disable or auto-disable |
| `busy` | `alive` | Queue clears, response times normalize |
| `busy` | `failed` | Failures increase while busy |
| `busy` | `disabled` | Manual disable or auto-disable |
| `failed` | `alive` | Successful extractions resume |
| `failed` | `disabled` | Persistent failures exceed auto-disable threshold |
| `disabled` | `alive` | Manual re-enable or auto-reenable after cooldown |
| `timeout` | `alive` | Response times normalize |
| `timeout` | `failed` | Timeouts persist or increase |
| `timeout` | `disabled` | Manual disable or auto-disable |

### Forbidden Transitions

| From | To | Reason |
|---|---|---|
| `disabled` | `busy` | Disabled engines should not accept new requests |
| `disabled` | `failed` | Disabled engines are already in a failed state |
| `disabled` | `timeout` | Disabled engines should not be monitored for timeouts |

---

## Health Monitoring

| Configuration | Value | Notes |
|---|---|---|
| **Check Interval** | 300000ms (5 minutes) | How often to check engine health |
| **Window Size** | 50 | Number of recent attempts to consider for health calculation |
| **Auto-Disable Threshold** | 10 | Consecutive failures before auto-disabling engine |
| **Auto-Reenable After** | 1800000ms (30 minutes) | Time before auto-reenabling disabled engine |
| **Log Health Changes** | true | Log all health state transitions |

---

## Recovery Chain

```
Primary: Chrome DevTools MCP
    ↓ (on failure)
Recovery Level 1: JCodesMore Browser
    ↓ (on failure)
Recovery Level 2: Firecrawl
    ↓ (on failure)
Terminal failure — record failure reason, skip product
```

**Critical Constraint:** Firecrawl must NEVER become primary. Engine priority is FIXED and cannot be reordered.
