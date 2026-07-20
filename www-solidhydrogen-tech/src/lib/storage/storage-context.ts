// ============================================================================
// STORAGE CONTEXT
//
// Defines storage context types and interfaces for the Layer 6 Data
// Storage Layer. This module provides type definitions for storage
// execution context, configuration, and active operation context only.
// ============================================================================

import type { StorageHealthState } from "./storage-health";
import type { StorageModuleState } from "./storage-status";

// ---------------------------------------------------------------------------
// Storage Module Context
// ---------------------------------------------------------------------------

export interface StorageModuleContext {
  name: string;
  displayName: string;
  priority: number;
  role: "write" | "read" | "transaction" | "migration" | "backup" | "recovery";
  timeoutMs: number;
  retryLimit: number;
  healthState: StorageHealthState;
  capabilities: string[];
  limitations: string[];
}

// ---------------------------------------------------------------------------
// Storage Execution Context
// ---------------------------------------------------------------------------

export interface StorageWriteContext {
  table: string;
  operation: "insert" | "update" | "upsert" | "delete";
  records: Array<Record<string, unknown>>;
  moduleContext: StorageModuleContext;
  startTime: string;
  timeoutMs: number;
  retryCount: number;
  maxRetries: number;
}

export interface StorageReadContext {
  table: string;
  queryType: "select" | "count" | "aggregate" | "join";
  filters: Record<string, unknown>;
  moduleContext: StorageModuleContext;
  startTime: string;
  timeoutMs: number;
}

export interface StorageTransactionContext {
  id: string;
  tables: string[];
  statements: Array<{ sql: string; params: unknown[] }>;
  moduleContext: StorageModuleContext;
  startTime: string;
  timeoutMs: string;
  isolation: "deferred" | "immediate" | "exclusive";
}

// ---------------------------------------------------------------------------
// Storage Backup Context
// ---------------------------------------------------------------------------

export interface StorageBackupContext {
  sourcePath: string;
  backupPath: string;
  trigger: "manual" | "scheduled" | "pre-deploy" | "pre-migration";
  moduleContext: StorageModuleContext;
  startTime: string;
}

// ---------------------------------------------------------------------------
// Storage Recovery Context
// ---------------------------------------------------------------------------

export interface StorageRecoveryContext {
  databasePath: string;
  errorType: "corruption" | "lock" | "timeout" | "disk-full" | "unknown";
  moduleContext: StorageModuleContext;
  startTime: string;
  backupPath: string | null;
}

// ---------------------------------------------------------------------------
// Storage Session Context
// ---------------------------------------------------------------------------

export interface StorageSessionContext {
  id: string;
  table: string;
  state: StorageModuleState;
  currentStep: string;
  startTime: string;
  lastActivity: string;
  operations: string[];
  retryCount: number;
}

// ---------------------------------------------------------------------------
// Storage Configuration
// ---------------------------------------------------------------------------

export interface StorageConfiguration {
  databasePath: string;
  vercelPath: string;
  journalMode: "WAL" | "DELETE" | "TRUNCATE" | "MEMORY" | "OFF";
  foreignKeys: boolean;
  synchronous: "OFF" | "NORMAL" | "FULL" | "EXTRA";
  cacheSize: number;
  tempStore: "DEFAULT" | "FILE" | "MEMORY";
  mmapSize: number;
  maxRetries: number;
  retryDelayMs: number;
  transactionTimeoutMs: number;
  queryTimeoutMs: number;
  enableWALCheckpoint: boolean;
  enableIntegrityCheck: boolean;
  integrityCheckIntervalMs: number;
}

export const DEFAULT_STORAGE_CONFIGURATION: StorageConfiguration = {
  databasePath: "database/site.db",
  vercelPath: "/tmp/database/site.db",
  journalMode: "WAL",
  foreignKeys: true,
  synchronous: "NORMAL",
  cacheSize: 8000,
  tempStore: "MEMORY",
  mmapSize: 268435456,
  maxRetries: 3,
  retryDelayMs: 1000,
  transactionTimeoutMs: 30000,
  queryTimeoutMs: 60000,
  enableWALCheckpoint: true,
  enableIntegrityCheck: true,
  integrityCheckIntervalMs: 86400000,
};

// ---------------------------------------------------------------------------
// Module Context Definitions
// ---------------------------------------------------------------------------

export const STORAGE_MODULE_CONTEXTS: Record<string, StorageModuleContext> = {
  "write-operations": {
    name: "write-operations",
    displayName: "Write Operations",
    priority: 1,
    role: "write",
    timeoutMs: 10000,
    retryLimit: 3,
    healthState: "unknown",
    capabilities: ["insert", "update", "upsert", "delete", "batch-write"],
    limitations: ["no-nested-transactions"],
  },
  "read-operations": {
    name: "read-operations",
    displayName: "Read Operations",
    priority: 2,
    role: "read",
    timeoutMs: 5000,
    retryLimit: 2,
    healthState: "unknown",
    capabilities: ["select", "count", "aggregate", "join", "cursor"],
    limitations: ["read-only"],
  },
  "transaction-manager": {
    name: "transaction-manager",
    displayName: "Transaction Manager",
    priority: 3,
    role: "transaction",
    timeoutMs: 30000,
    retryLimit: 1,
    healthState: "unknown",
    capabilities: ["begin", "commit", "rollback", "savepoint", "deferred", "immediate", "exclusive"],
    limitations: ["single-writer-wal"],
  },
  "migration-manager": {
    name: "migration-manager",
    displayName: "Migration Manager",
    priority: 4,
    role: "migration",
    timeoutMs: 60000,
    retryLimit: 1,
    healthState: "unknown",
    capabilities: ["schema-version", "add-column", "add-index", "alter-table", "rollback"],
    limitations: ["destructive-changes-require-backup"],
  },
  "backup-manager": {
    name: "backup-manager",
    displayName: "Backup Manager",
    priority: 5,
    role: "backup",
    timeoutMs: 120000,
    retryLimit: 2,
    healthState: "unknown",
    capabilities: ["full-backup", "incremental", "verify", "retention", "list"],
    limitations: ["requires-disk-space"],
  },
  "recovery-manager": {
    name: "recovery-manager",
    displayName: "Recovery Manager",
    priority: 6,
    role: "recovery",
    timeoutMs: 300000,
    retryLimit: 1,
    healthState: "unknown",
    capabilities: ["integrity-check", "repair", "restore-backup", "seed-data", "forensic-backup"],
    limitations: ["last-resort-only"],
  },
};

// ---------------------------------------------------------------------------
// State Transition Rules
// ---------------------------------------------------------------------------

export const STORAGE_CONTEXT_STATE_TRANSITIONS: Record<StorageModuleState, StorageModuleState[]> = {
  idle: ["writing", "reading", "migrating", "backing-up", "recovering", "failed", "timeout"],
  writing: ["idle", "failed"],
  reading: ["idle", "failed"],
  migrating: ["idle", "failed"],
  "backing-up": ["idle", "failed"],
  recovering: ["idle", "failed"],
  completed: ["idle"],
  failed: ["idle"],
  timeout: ["idle"],
  unknown: ["idle", "writing", "reading", "migrating", "backing-up", "recovering"],
};
