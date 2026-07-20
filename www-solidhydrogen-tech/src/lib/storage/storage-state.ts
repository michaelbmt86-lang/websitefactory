// ============================================================================
// STORAGE STATE
//
// Defines storage state management types and interfaces for the Layer 6
// Data Storage Layer. This module provides type definitions for storage
// session state tracking, write state, and backup state only.
// ============================================================================

import type { StorageModuleState } from "./storage-status";
import type { StorageHealthState } from "./storage-health";
import type { StorageSessionContext } from "./storage-context";

// ---------------------------------------------------------------------------
// Write State
// ---------------------------------------------------------------------------

export type WriteState = "pending" | "writing" | "completed" | "failed" | "partial";

export interface WriteStatus {
  table: string;
  state: WriteState;
  operation: "insert" | "update" | "upsert" | "delete";
  sessionId: string;
  startTime: string;
  endTime: string | null;
  recordsAffected: number;
}

// ---------------------------------------------------------------------------
// Read State
// ---------------------------------------------------------------------------

export type ReadState = "pending" | "reading" | "completed" | "failed" | "empty";

export interface ReadStatus {
  table: string;
  state: ReadState;
  queryType: string;
  sessionId: string;
  startTime: string;
  endTime: string | null;
  rowsReturned: number;
}

// ---------------------------------------------------------------------------
// Transaction State
// ---------------------------------------------------------------------------

export type TransactionState = "pending" | "active" | "committed" | "rolled-back" | "timeout";

export interface TransactionStatus {
  id: string;
  state: TransactionState;
  tables: string[];
  statements: number;
  startTime: string;
  endTime: string | null;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Migration State
// ---------------------------------------------------------------------------

export type MigrationState = "pending" | "running" | "completed" | "failed" | "rolled-back";

export interface MigrationStatus {
  name: string;
  state: MigrationState;
  version: number;
  startTime: string;
  endTime: string | null;
  tablesAffected: string[];
}

// ---------------------------------------------------------------------------
// Backup State
// ---------------------------------------------------------------------------

export type BackupState = "pending" | "running" | "completed" | "failed" | "verified";

export interface BackupStatus {
  path: string;
  state: BackupState;
  trigger: string;
  startTime: string;
  endTime: string | null;
  sizeBytes: number;
  verified: boolean;
}

// ---------------------------------------------------------------------------
// Recovery State
// ---------------------------------------------------------------------------

export type RecoveryState = "pending" | "detecting" | "repairing" | "restoring" | "completed" | "failed";

export interface RecoveryStatus {
  errorType: string;
  state: RecoveryState;
  method: string | null;
  startTime: string;
  endTime: string | null;
  tablesRestored: number;
}

// ---------------------------------------------------------------------------
// Storage State Summary
// ---------------------------------------------------------------------------

export interface StorageStateSummary {
  totalSessions: number;
  activeSessions: number;
  failedSessions: number;
  completedSessions: number;
  totalWrites: number;
  successfulWrites: number;
  failedWrites: number;
  totalReads: number;
  successfulReads: number;
  failedReads: number;
  totalTransactions: number;
  committedTransactions: number;
  rolledBackTransactions: number;
  totalMigrations: number;
  successfulMigrations: number;
  failedMigrations: number;
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  totalRecoveries: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  overallHealth: StorageHealthState;
  lastActivity: string | null;
}

// ---------------------------------------------------------------------------
// State Transition Rules
// ---------------------------------------------------------------------------

export const WRITE_STATE_TRANSITIONS: Record<WriteState, WriteState[]> = {
  pending: ["writing", "failed"],
  writing: ["completed", "failed", "partial"],
  completed: [],
  failed: [],
  partial: [],
};

export const READ_STATE_TRANSITIONS: Record<ReadState, ReadState[]> = {
  pending: ["reading", "failed"],
  reading: ["completed", "failed", "empty"],
  completed: [],
  failed: [],
  empty: [],
};

export const TRANSACTION_STATE_TRANSITIONS: Record<TransactionState, TransactionState[]> = {
  pending: ["active", "timeout"],
  active: ["committed", "rolled-back", "timeout"],
  committed: [],
  "rolled-back": [],
  timeout: [],
};

export const MIGRATION_STATE_TRANSITIONS: Record<MigrationState, MigrationState[]> = {
  pending: ["running", "failed"],
  running: ["completed", "failed", "rolled-back"],
  completed: [],
  failed: [],
  "rolled-back": [],
};

export const BACKUP_STATE_TRANSITIONS: Record<BackupState, BackupState[]> = {
  pending: ["running", "failed"],
  running: ["completed", "failed"],
  completed: ["verified"],
  failed: [],
  verified: [],
};

export const RECOVERY_STATE_TRANSITIONS: Record<RecoveryState, RecoveryState[]> = {
  pending: ["detecting", "failed"],
  detecting: ["repairing", "restoring", "completed", "failed"],
  repairing: ["restoring", "completed", "failed"],
  restoring: ["completed", "failed"],
  completed: [],
  failed: [],
};

// ---------------------------------------------------------------------------
// Session State Tracker
// ---------------------------------------------------------------------------

export interface StorageSessionStateTracker {
  session: StorageSessionContext;
  writeState: WriteStatus | null;
  readState: ReadStatus | null;
  transactionState: TransactionStatus | null;
  migrationState: MigrationStatus | null;
  backupState: BackupStatus | null;
  recoveryState: RecoveryStatus | null;
  lastStateChange: string;
  stateChanges: Array<{
    from: StorageModuleState;
    to: StorageModuleState;
    timestamp: string;
    reason: string;
  }>;
}
