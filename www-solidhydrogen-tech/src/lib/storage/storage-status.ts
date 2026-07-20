// ============================================================================
// STORAGE STATUS
//
// Defines storage status types, module states, and status monitoring
// interfaces for the Layer 6 Data Storage Layer. This module provides type
// definitions and runtime structures only — no execution logic.
// ============================================================================

// ---------------------------------------------------------------------------
// Storage Module States
// ---------------------------------------------------------------------------

export type StorageModuleState =
  | "idle"
  | "writing"
  | "reading"
  | "migrating"
  | "backing-up"
  | "recovering"
  | "completed"
  | "failed"
  | "timeout"
  | "unknown";

// ---------------------------------------------------------------------------
// Overall Storage Status
// ---------------------------------------------------------------------------

export type OverallStorageStatus =
  | "idle"
  | "processing"
  | "completed"
  | "failed"
  | "partial"
  | "unknown";

// ---------------------------------------------------------------------------
// Table Status Definition
// ---------------------------------------------------------------------------

export interface TableStatusDefinition {
  name: string;
  rowCount: number;
  lastWrite: string | null;
  lastRead: string | null;
  status: StorageModuleState;
  healthState: StorageHealthState;
}

// ---------------------------------------------------------------------------
// Database Status Definition
// ---------------------------------------------------------------------------

export interface DatabaseStatusDefinition {
  path: string;
  exists: boolean;
  readable: boolean;
  writable: boolean;
  sizeBytes: number;
  journalMode: string;
  foreignKeys: string;
  lastModified: string | null;
  integrityCheck: string | null;
  lastIntegrityCheck: string | null;
}

// ---------------------------------------------------------------------------
// Storage Status Summary
// ---------------------------------------------------------------------------

export interface StorageStatusSummary {
  overallStatus: OverallStorageStatus;
  database: DatabaseStatusDefinition;
  tables: Record<string, TableStatusDefinition>;
  activeOperations: number;
  totalOperationsToday: number;
  lastUpdated: string | null;
}

// Import for cross-reference (health state)
import type { StorageHealthState } from "./storage-health";

// ---------------------------------------------------------------------------
// State Definitions
// ---------------------------------------------------------------------------

export const STORAGE_MODULE_STATE_DEFINITIONS: Record<StorageModuleState, string> = {
  idle: "Module is idle, no active storage operations",
  writing: "Module is actively writing data to database",
  reading: "Module is reading data from database",
  migrating: "Module is running schema migration",
  "backing-up": "Module is creating database backup",
  recovering: "Module is recovering from database failure",
  completed: "Module completed storage operation successfully",
  failed: "Module failed during storage operation",
  timeout: "Module timed out during storage operation",
  unknown: "Module status is unknown",
};

// ---------------------------------------------------------------------------
// State Transition Rules
// ---------------------------------------------------------------------------

export const STORAGE_STATE_TRANSITIONS: Record<StorageModuleState, StorageModuleState[]> = {
  idle: ["writing", "reading", "migrating", "backing-up", "recovering", "failed", "timeout"],
  writing: ["idle", "completed", "failed", "timeout"],
  reading: ["idle", "completed", "failed", "timeout"],
  migrating: ["idle", "completed", "failed", "timeout"],
  "backing-up": ["idle", "completed", "failed", "timeout"],
  recovering: ["idle", "completed", "failed"],
  completed: ["idle"],
  failed: ["idle"],
  timeout: ["idle"],
  unknown: ["idle", "writing", "reading", "migrating", "backing-up", "recovering"],
};
