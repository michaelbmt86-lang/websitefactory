// ============================================================================
// STORAGE EVENTS
//
// Defines storage event types and interfaces for the Layer 6 Data
// Storage Layer. This module provides type definitions for write events,
// read events, transaction events, health events, and error events only.
// ============================================================================

import type { StorageHealthState } from "./storage-health";

// ---------------------------------------------------------------------------
// Storage Event Types
// ---------------------------------------------------------------------------

export type StorageEventType =
  | "storage-started"
  | "storage-completed"
  | "storage-failed"
  | "storage-timeout"
  | "write-started"
  | "write-completed"
  | "write-failed"
  | "read-started"
  | "read-completed"
  | "read-failed"
  | "transaction-started"
  | "transaction-committed"
  | "transaction-rolled-back"
  | "migration-started"
  | "migration-completed"
  | "migration-failed"
  | "backup-started"
  | "backup-completed"
  | "backup-failed"
  | "recovery-started"
  | "recovery-completed"
  | "recovery-failed"
  | "health-check"
  | "health-state-changed"
  | "health-degraded"
  | "health-recovered"
  | "integrity-check"
  | "integrity-passed"
  | "integrity-failed"
  | "corruption-detected"
  | "lock-timeout"
  | "disk-full"
  | "constraint-violation"
  | "foreignkey-violation"
  | "retry-attempted"
  | "retry-succeeded"
  | "retry-failed"
  | "metrics-recorded"
  | "error-occurred";

// ---------------------------------------------------------------------------
// Storage Event
// ---------------------------------------------------------------------------

export interface StorageEvent {
  id: string;
  type: StorageEventType;
  module: string;
  sessionId: string;
  table?: string;
  timestamp: string;
  data: Record<string, unknown>;
  severity: "info" | "warning" | "error" | "critical";
}

// ---------------------------------------------------------------------------
// Write Events
// ---------------------------------------------------------------------------

export interface WriteStartedEvent extends StorageEvent {
  type: "write-started";
  data: {
    table: string;
    operation: "insert" | "update" | "upsert" | "delete";
    recordCount: number;
  };
}

export interface WriteCompletedEvent extends StorageEvent {
  type: "write-completed";
  data: {
    table: string;
    operation: "insert" | "update" | "upsert" | "delete";
    recordsAffected: number;
    durationMs: number;
  };
}

export interface WriteFailedEvent extends StorageEvent {
  type: "write-failed";
  data: {
    table: string;
    operation: "insert" | "update" | "upsert" | "delete";
    error: string;
    failureType: string;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Read Events
// ---------------------------------------------------------------------------

export interface ReadCompletedEvent extends StorageEvent {
  type: "read-completed";
  data: {
    table: string;
    queryType: string;
    rowsReturned: number;
    durationMs: number;
  };
}

export interface ReadFailedEvent extends StorageEvent {
  type: "read-failed";
  data: {
    table: string;
    queryType: string;
    error: string;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Transaction Events
// ---------------------------------------------------------------------------

export interface TransactionStartedEvent extends StorageEvent {
  type: "transaction-started";
  data: {
    transactionId: string;
    tables: string[];
    isolation: string;
  };
}

export interface TransactionCommittedEvent extends StorageEvent {
  type: "transaction-committed";
  data: {
    transactionId: string;
    statements: number;
    durationMs: number;
  };
}

export interface TransactionRolledBackEvent extends StorageEvent {
  type: "transaction-rolled-back";
  data: {
    transactionId: string;
    reason: string;
    statements: number;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Migration Events
// ---------------------------------------------------------------------------

export interface MigrationCompletedEvent extends StorageEvent {
  type: "migration-completed";
  data: {
    migrationName: string;
    tablesAffected: string[];
    durationMs: number;
  };
}

export interface MigrationFailedEvent extends StorageEvent {
  type: "migration-failed";
  data: {
    migrationName: string;
    error: string;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Backup Events
// ---------------------------------------------------------------------------

export interface BackupCompletedEvent extends StorageEvent {
  type: "backup-completed";
  data: {
    backupPath: string;
    sizeBytes: number;
    trigger: string;
    durationMs: number;
  };
}

export interface BackupFailedEvent extends StorageEvent {
  type: "backup-failed";
  data: {
    error: string;
    trigger: string;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Recovery Events
// ---------------------------------------------------------------------------

export interface RecoveryCompletedEvent extends StorageEvent {
  type: "recovery-completed";
  data: {
    method: string;
    tablesRestored: number;
    dataIntegrity: string;
    durationMs: number;
  };
}

export interface RecoveryFailedEvent extends StorageEvent {
  type: "recovery-failed";
  data: {
    method: string;
    error: string;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Health Events
// ---------------------------------------------------------------------------

export interface HealthStateChangedEvent extends StorageEvent {
  type: "health-state-changed";
  data: {
    from: StorageHealthState;
    to: StorageHealthState;
    healthScore: number | null;
    reason: string;
  };
}

export interface HealthDegradedEvent extends StorageEvent {
  type: "health-degraded";
  data: {
    previousState: StorageHealthState;
    currentState: StorageHealthState;
    consecutiveFailures: number;
    successRate: number | null;
  };
}

// ---------------------------------------------------------------------------
// Integrity Events
// ---------------------------------------------------------------------------

export interface IntegrityCheckPassedEvent extends StorageEvent {
  type: "integrity-passed";
  data: {
    durationMs: number;
    tablesVerified: number;
  };
}

export interface IntegrityCheckFailedEvent extends StorageEvent {
  type: "integrity-failed";
  data: {
    error: string;
    tablesFailed: string[];
    durationMs: number;
  };
}

export interface CorruptionDetectedEvent extends StorageEvent {
  type: "corruption-detected";
  data: {
    tablesAffected: string[];
    corruptionType: string;
    severity: "warning" | "critical";
  };
}

// ---------------------------------------------------------------------------
// Error Events
// ---------------------------------------------------------------------------

export interface LockTimeoutEvent extends StorageEvent {
  type: "lock-timeout";
  data: {
    table: string;
    operation: string;
    timeoutMs: number;
  };
}

export interface DiskFullEvent extends StorageEvent {
  type: "disk-full";
  data: {
    availableBytes: number;
    requiredBytes: number;
    table: string;
  };
}

export interface ConstraintViolationEvent extends StorageEvent {
  type: "constraint-violation";
  data: {
    table: string;
    constraintType: "unique" | "not-null" | "check" | "foreign-key";
    column: string;
    value: unknown;
  };
}

export interface ErrorOccurredEvent extends StorageEvent {
  type: "error-occurred";
  data: {
    error: string;
    errorType: string;
    recoverable: boolean;
    stack?: string;
  };
}

// ---------------------------------------------------------------------------
// Retry Events
// ---------------------------------------------------------------------------

export interface RetryAttemptedEvent extends StorageEvent {
  type: "retry-attempted";
  data: {
    table: string;
    operation: string;
    retryCount: number;
    maxRetries: number;
    reason: string;
  };
}

export interface RetrySucceededEvent extends StorageEvent {
  type: "retry-succeeded";
  data: {
    table: string;
    operation: string;
    retryCount: number;
    durationMs: number;
  };
}

// ---------------------------------------------------------------------------
// Event History Limits
// ---------------------------------------------------------------------------

export interface StorageEventHistoryLimits {
  maxEvents: number;
  maxEventsPerTable: number;
  maxEventsPerSession: number;
  retentionMs: number;
}

export const DEFAULT_STORAGE_EVENT_HISTORY_LIMITS: StorageEventHistoryLimits = {
  maxEvents: 500,
  maxEventsPerTable: 200,
  maxEventsPerSession: 50,
  retentionMs: 86400000,
};
