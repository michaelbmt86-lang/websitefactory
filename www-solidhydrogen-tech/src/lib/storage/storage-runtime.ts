// ============================================================================
// STORAGE RUNTIME
//
// Defines storage runtime metadata types and structures for the Layer 6
// Data Storage Layer. This module provides type definitions and runtime
// structures only — no execution logic.
// ============================================================================

import type { StorageModuleState } from "./storage-status";
import type { StorageHealthState } from "./storage-health";

// ---------------------------------------------------------------------------
// Runtime Module Status
// ---------------------------------------------------------------------------

export interface RuntimeModuleStatus {
  name: string;
  displayName: string;
  status: StorageHealthState | "unknown";
  lastHealthCheck: string | null;
  lastSuccessfulWrite: string | null;
  lastFailedWrite: string | null;
  consecutiveFailures: number;
  activeOperations: number;
  totalOperationsToday: number;
}

// ---------------------------------------------------------------------------
// Runtime Session State
// ---------------------------------------------------------------------------

export interface RuntimeStorageSessionState {
  state: StorageModuleState;
  count: number;
}

// ---------------------------------------------------------------------------
// Runtime Write Record
// ---------------------------------------------------------------------------

export interface RuntimeWriteRecord {
  id: string;
  table: string;
  operation: "insert" | "update" | "upsert" | "delete";
  recordsAffected: number;
  durationMs: number;
  transactionId: string | null;
  status: "success" | "failed" | "partial";
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime Read Record
// ---------------------------------------------------------------------------

export interface RuntimeReadRecord {
  id: string;
  table: string;
  queryType: "select" | "count" | "aggregate" | "join";
  rowsReturned: number;
  durationMs: number;
  status: "success" | "failed" | "empty";
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime Transaction Record
// ---------------------------------------------------------------------------

export interface RuntimeTransactionRecord {
  id: string;
  operation: "begin" | "commit" | "rollback" | "savepoint";
  tables: string[];
  statements: number;
  durationMs: number;
  status: "committed" | "rolled-back" | "timeout";
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime Failure Record
// ---------------------------------------------------------------------------

export interface RuntimeStorageFailureRecord {
  id: string;
  table: string;
  operation: string;
  type: "constraint" | "timeout" | "corruption" | "disk-full" | "lock" | "unknown";
  error: string;
  recoverable: boolean;
  durationMs: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Runtime History Limits
// ---------------------------------------------------------------------------

export interface RuntimeStorageHistoryLimits {
  maxRecentWrites: number;
  maxRecentReads: number;
  maxRecentTransactions: number;
  maxRecentFailures: number;
}

export const DEFAULT_STORAGE_HISTORY_LIMITS: RuntimeStorageHistoryLimits = {
  maxRecentWrites: 100,
  maxRecentReads: 100,
  maxRecentTransactions: 100,
  maxRecentFailures: 50,
};

// ---------------------------------------------------------------------------
// Runtime Pragma Status
// ---------------------------------------------------------------------------

export interface RuntimePragmaStatus {
  journalMode: { current: string; expected: string; status: StorageHealthState };
  foreignKeys: { current: string; expected: string; status: StorageHealthState };
  synchronous: { current: string; expected: string; status: StorageHealthState };
  cacheSize: { current: number | null; expected: number; status: StorageHealthState };
}

// ---------------------------------------------------------------------------
// Runtime Database Status
// ---------------------------------------------------------------------------

export interface RuntimeDatabaseStatus {
  path: string;
  exists: boolean;
  readable: boolean;
  writable: boolean;
  sizeBytes: number;
  journalMode: string;
  lastModified: string | null;
  pragmas: RuntimePragmaStatus;
}
