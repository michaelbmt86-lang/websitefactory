# Layer 6 — Policy Reference

## Overview

This document provides a complete reference for all Layer 6 Data Storage policies. Policies define rules, constraints, and best practices for storage operations.

## Policies

### 1. SQLite Policy (`sqlite-policy.json`)

**Purpose:** Single source of truth for all data, connection management, pragma configuration, and lifecycle.

**Key Rules:**
- ALL data is stored in SQLite — no secondary databases
- WAL journal mode for concurrent reads
- Foreign keys enforced
- Synchronous mode NORMAL for balance
- Ephemeral `/tmp` on Vercel, persistent locally
- Idempotent schema creation with IF NOT EXISTS

### 2. Storage Policy (`storage-policy.json`)

**Purpose:** Write/read patterns, batch operations, query optimization.

**Key Rules:**
- All writes go through Layer 6
- Batch operations for bulk data
- Indexed queries for performance
- Pagination for large result sets
- No unbounded queries

### 3. Transaction Policy (`transaction-policy.json`)

**Purpose:** When to use transactions, isolation levels, commit/rollback rules.

**Key Rules:**
- Use transactions for multi-statement operations
- Deferred by default, immediate for write-heavy
- Exclusive for schema migrations
- Always rollback on error
- No nested transactions (use savepoints)

### 4. Backup Policy (`backup-policy.json`)

**Purpose:** Backup frequency, retention, storage location, recovery.

**Key Rules:**
- Backup before migrations
- Backup before schema changes
- Retain last 7 daily, 4 weekly, 12 monthly
- Verify backup integrity after creation
- Store backups in `backups/` directory

### 5. Integrity Policy (`integrity-policy.json`)

**Purpose:** Constraint enforcement, referential integrity, corruption detection.

**Key Rules:**
- Run PRAGMA integrity_check daily
- Run before and after migrations
- Detect and report corruption immediately
- Forensic backup before recovery attempts
- Never silently swallow integrity failures

### 6. Migration Policy (`migration-policy.json`)

**Purpose:** Schema versioning, migration execution, rollback procedures.

**Key Rules:**
- Version-numbered migrations
- Backup before migration
- Test migration on copy first
- Rollback plan for every migration
- Never modify production without backup

## Policy Enforcement

Policies are machine-readable JSON files used by:
- Layer 3 (Extraction Manager) — for storage decisions during extraction
- Layer 5 (AI Analysis) — for understanding storage constraints
- Layer 6 (Data Storage) — for runtime enforcement

## Policy Updates

To update a policy:
1. Edit the JSON file in `policies/`
2. Update the version number
3. Update `generatedAt` timestamp
4. Run validation: `npm run check`
