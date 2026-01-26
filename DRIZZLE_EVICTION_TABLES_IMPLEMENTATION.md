# Drizzle ORM Implementation - Eviction Tables

## 📋 Overview

This guide provides complete Drizzle ORM code for implementing the `eviction_maintenance_log` and `eviction_policy_config` tables in your application layer.

---

## 🗄️ Part 1: Schema Definitions in Drizzle

### **Location**: `/home/ubuntu/ologywood/drizzle/schema.ts`

Add these table definitions to your existing schema file:

```typescript
import { 
  mysqlTable, 
  int, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  decimal,
  json,
  time,
  serial,
  index,
  unique
} from 'drizzle-orm/mysql-core';

// ============================================================================
// EVICTION POLICY CONFIGURATION TABLE
// ============================================================================
// Purpose: Store configurable eviction policy parameters
// Enables multiple policies with different configurations

export const evictionPolicyConfig = mysqlTable('eviction_policy_config', {
  id: serial('id').primaryKey(),
  
  // Policy identification
  policyName: varchar('policy_name', { length: 50 }).unique().notNull(),
  policyType: varchar('policy_type', { length: 50 }).notNull(), // 'age-based', 'usage-based', 'hybrid', 'size-based'
  
  // Configuration parameters
  ageThresholdDays: int('age_threshold_days').default(7),
  usageThreshold: int('usage_threshold'),
  usagePercentile: decimal('usage_percentile', { precision: 3, scale: 2 }),
  maxCacheSizeMb: int('max_cache_size_mb'),
  
  // Policy control
  enabled: boolean('enabled').default(true).notNull(),
  
  // Scheduling
  runFrequency: varchar('run_frequency', { length: 50 }).default('daily').notNull(), // 'daily', 'weekly', 'monthly', 'manual'
  runTime: time('run_time').default('02:00:00'),
  
  // Documentation
  description: text('description'),
  
  // Audit trail
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  policyNameIdx: index('idx_policy_name').on(table.policyName),
  enabledIdx: index('idx_enabled').on(table.enabled),
}));

// Type exports
export type EvictionPolicyConfig = typeof evictionPolicyConfig.$inferSelect;
export type InsertEvictionPolicyConfig = typeof evictionPolicyConfig.$inferInsert;

// ============================================================================
// EVICTION MAINTENANCE LOG TABLE
// ============================================================================
// Purpose: Track all eviction operations for monitoring and auditing
// Enables performance tracking and troubleshooting

export const evictionMaintenanceLog = mysqlTable('eviction_maintenance_log', {
  id: serial('id').primaryKey(),
  
  // Policy reference
  policyName: varchar('policy_name', { length: 50 }).default('aggressive-age-based').notNull(),
  
  // Execution details
  executionTimestamp: timestamp('execution_timestamp').defaultNow().notNull(),
  
  // Operation results
  embeddingsDeleted: int('embeddings_deleted').default(0).notNull(),
  spaceFreedMb: decimal('space_freed_mb', { precision: 10, scale: 2 }).default(0).notNull(),
  
  // Cache metrics
  cacheSizeBeforeMb: decimal('cache_size_before_mb', { precision: 10, scale: 2 }).default(0).notNull(),
  cacheSizeAfterMb: decimal('cache_size_after_mb', { precision: 10, scale: 2 }).default(0).notNull(),
  
  // Performance metrics
  executionTimeMs: int('execution_time_ms').default(0).notNull(),
  
  // Status tracking
  status: varchar('status', { length: 20 }).default('success').notNull(), // 'success', 'error', 'running', 'skipped'
  errorMessage: text('error_message'),
  
  // Additional data
  parameters: json('parameters').$type<Record<string, any>>(),
  notes: text('notes'),
}, (table) => ({
  executionTimestampIdx: index('idx_execution_timestamp').on(table.executionTimestamp),
  policyNameIdx: index('idx_policy_name').on(table.policyName),
  statusIdx: index('idx_status').on(table.status),
}));

// Type exports
export type EvictionMaintenanceLog = typeof evictionMaintenanceLog.$inferSelect;
export type InsertEvictionMaintenanceLog = typeof evictionMaintenanceLog.$inferInsert;
```

---

## 🔧 Part 2: Service Layer Implementation

### **Location**: `/home/ubuntu/ologywood/server/services/evictionService.ts`

```typescript
import { getDb } from '../db';
import { 
  evictionPolicyConfig, 
  evictionMaintenanceLog,
  EvictionPolicyConfig,
  InsertEvictionMaintenanceLog
} from '../../drizzle/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

/**
 * Eviction Service
 * Handles all eviction policy operations and maintenance logging
 */

// ============================================================================
// POLICY CONFIGURATION OPERATIONS
// ============================================================================

/**
 * Get policy configuration by name
 */
export async function getPolicyConfig(policyName: string): Promise<EvictionPolicyConfig | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(evictionPolicyConfig)
    .where(eq(evictionPolicyConfig.policyName, policyName))
    .limit(1);

  return result[0] || null;
}

/**
 * Get all enabled policies
 */
export async function getEnabledPolicies(): Promise<EvictionPolicyConfig[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(evictionPolicyConfig)
    .where(eq(evictionPolicyConfig.enabled, true));
}

/**
 * Get all policies
 */
export async function getAllPolicies(): Promise<EvictionPolicyConfig[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(evictionPolicyConfig)
    .orderBy(evictionPolicyConfig.policyName);
}

/**
 * Create new policy configuration
 */
export async function createPolicyConfig(
  data: Omit<EvictionPolicyConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<EvictionPolicyConfig | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.insert(evictionPolicyConfig).values(data as any);
    return await getPolicyConfig(data.policyName);
  } catch (error) {
    console.error('[EvictionService] Error creating policy config:', error);
    return null;
  }
}

/**
 * Update policy configuration
 */
export async function updatePolicyConfig(
  policyName: string,
  data: Partial<Omit<EvictionPolicyConfig, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<EvictionPolicyConfig | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db
      .update(evictionPolicyConfig)
      .set({
        ...data,
        updatedAt: new Date(),
      } as any)
      .where(eq(evictionPolicyConfig.policyName, policyName));

    return await getPolicyConfig(policyName);
  } catch (error) {
    console.error('[EvictionService] Error updating policy config:', error);
    return null;
  }
}

/**
 * Enable policy
 */
export async function enablePolicy(policyName: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(evictionPolicyConfig)
      .set({ enabled: true, updatedAt: new Date() } as any)
      .where(eq(evictionPolicyConfig.policyName, policyName));
    return true;
  } catch (error) {
    console.error('[EvictionService] Error enabling policy:', error);
    return false;
  }
}

/**
 * Disable policy
 */
export async function disablePolicy(policyName: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(evictionPolicyConfig)
      .set({ enabled: false, updatedAt: new Date() } as any)
      .where(eq(evictionPolicyConfig.policyName, policyName));
    return true;
  } catch (error) {
    console.error('[EvictionService] Error disabling policy:', error);
    return false;
  }
}

/**
 * Delete policy configuration
 */
export async function deletePolicyConfig(policyName: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .delete(evictionPolicyConfig)
      .where(eq(evictionPolicyConfig.policyName, policyName));
    return true;
  } catch (error) {
    console.error('[EvictionService] Error deleting policy config:', error);
    return false;
  }
}

// ============================================================================
// MAINTENANCE LOG OPERATIONS
// ============================================================================

/**
 * Log eviction operation
 */
export async function logEvictionOperation(
  data: Omit<InsertEvictionMaintenanceLog, 'executionTimestamp'>
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(evictionMaintenanceLog).values({
      ...data,
      executionTimestamp: new Date(),
    } as any);
    return true;
  } catch (error) {
    console.error('[EvictionService] Error logging eviction operation:', error);
    return false;
  }
}

/**
 * Get recent eviction logs
 */
export async function getRecentEvictionLogs(
  days: number = 7,
  limit: number = 50
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await db
      .select()
      .from(evictionMaintenanceLog)
      .where(gte(evictionMaintenanceLog.executionTimestamp, cutoffDate))
      .orderBy(desc(evictionMaintenanceLog.executionTimestamp))
      .limit(limit);
  } catch (error) {
    console.error('[EvictionService] Error fetching recent logs:', error);
    return [];
  }
}

/**
 * Get eviction logs by policy
 */
export async function getEvictionLogsByPolicy(
  policyName: string,
  limit: number = 50
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(evictionMaintenanceLog)
      .where(eq(evictionMaintenanceLog.policyName, policyName))
      .orderBy(desc(evictionMaintenanceLog.executionTimestamp))
      .limit(limit);
  } catch (error) {
    console.error('[EvictionService] Error fetching logs by policy:', error);
    return [];
  }
}

/**
 * Get eviction statistics
 */
export async function getEvictionStatistics(days: number = 30): Promise<any> {
  const db = await getDb();
  if (!db) return null;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const logs = await db
      .select()
      .from(evictionMaintenanceLog)
      .where(gte(evictionMaintenanceLog.executionTimestamp, cutoffDate));

    if (logs.length === 0) {
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        totalEmbeddingsDeleted: 0,
        totalSpaceFreedMb: 0,
        avgExecutionTimeMs: 0,
        avgSpaceFreedMb: 0,
      };
    }

    const successfulRuns = logs.filter((log: any) => log.status === 'success').length;
    const failedRuns = logs.filter((log: any) => log.status === 'error').length;
    const totalEmbeddingsDeleted = logs.reduce((sum: number, log: any) => sum + (log.embeddingsDeleted || 0), 0);
    const totalSpaceFreedMb = logs.reduce((sum: number, log: any) => sum + (parseFloat(log.spaceFreedMb) || 0), 0);
    const avgExecutionTimeMs = Math.round(
      logs.reduce((sum: number, log: any) => sum + (log.executionTimeMs || 0), 0) / logs.length
    );

    return {
      totalRuns: logs.length,
      successfulRuns,
      failedRuns,
      successRate: ((successfulRuns / logs.length) * 100).toFixed(2) + '%',
      totalEmbeddingsDeleted,
      totalSpaceFreedMb: totalSpaceFreedMb.toFixed(2),
      avgExecutionTimeMs,
      avgSpaceFreedMb: (totalSpaceFreedMb / logs.length).toFixed(2),
      period: `${days} days`,
    };
  } catch (error) {
    console.error('[EvictionService] Error calculating statistics:', error);
    return null;
  }
}

/**
 * Get failed eviction operations
 */
export async function getFailedEvictions(limit: number = 50): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(evictionMaintenanceLog)
      .where(eq(evictionMaintenanceLog.status, 'error'))
      .orderBy(desc(evictionMaintenanceLog.executionTimestamp))
      .limit(limit);
  } catch (error) {
    console.error('[EvictionService] Error fetching failed evictions:', error);
    return [];
  }
}

/**
 * Get last eviction for policy
 */
export async function getLastEvictionForPolicy(policyName: string): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(evictionMaintenanceLog)
      .where(eq(evictionMaintenanceLog.policyName, policyName))
      .orderBy(desc(evictionMaintenanceLog.executionTimestamp))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('[EvictionService] Error fetching last eviction:', error);
    return null;
  }
}

/**
 * Delete old logs (cleanup)
 */
export async function deleteOldLogs(daysToKeep: number = 90): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db
      .delete(evictionMaintenanceLog)
      .where(sql`${evictionMaintenanceLog.executionTimestamp} < ${cutoffDate}`);

    return result.rowsAffected || 0;
  } catch (error) {
    console.error('[EvictionService] Error deleting old logs:', error);
    return 0;
  }
}
```

---

## 🛣️ Part 3: Router/API Layer

### **Location**: `/home/ubuntu/ologywood/server/routers/evictionRouter.ts`

```typescript
import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  getPolicyConfig,
  getEnabledPolicies,
  getAllPolicies,
  createPolicyConfig,
  updatePolicyConfig,
  enablePolicy,
  disablePolicy,
  deletePolicyConfig,
  getRecentEvictionLogs,
  getEvictionLogsByPolicy,
  getEvictionStatistics,
  getFailedEvictions,
  getLastEvictionForPolicy,
} from '../services/evictionService';

export const evictionRouter = router({
  // ========================================================================
  // POLICY CONFIGURATION PROCEDURES
  // ========================================================================

  /**
   * Get policy configuration by name
   */
  getPolicy: protectedProcedure
    .input(z.object({ policyName: z.string() }))
    .query(async ({ input }) => {
      const policy = await getPolicyConfig(input.policyName);
      if (!policy) {
        throw new Error(`Policy not found: ${input.policyName}`);
      }
      return policy;
    }),

  /**
   * Get all enabled policies
   */
  getEnabledPolicies: protectedProcedure
    .query(async () => {
      return await getEnabledPolicies();
    }),

  /**
   * Get all policies
   */
  getAllPolicies: protectedProcedure
    .query(async () => {
      return await getAllPolicies();
    }),

  /**
   * Create new policy
   */
  createPolicy: protectedProcedure
    .input(z.object({
      policyName: z.string().min(1),
      policyType: z.enum(['age-based', 'usage-based', 'hybrid', 'size-based']),
      ageThresholdDays: z.number().optional(),
      usageThreshold: z.number().optional(),
      usagePercentile: z.number().optional(),
      maxCacheSizeMb: z.number().optional(),
      runFrequency: z.enum(['daily', 'weekly', 'monthly', 'manual']).optional(),
      runTime: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const policy = await createPolicyConfig(input as any);
      if (!policy) {
        throw new Error('Failed to create policy');
      }
      return policy;
    }),

  /**
   * Update policy
   */
  updatePolicy: protectedProcedure
    .input(z.object({
      policyName: z.string(),
      updates: z.object({
        policyType: z.string().optional(),
        ageThresholdDays: z.number().optional(),
        usageThreshold: z.number().optional(),
        usagePercentile: z.number().optional(),
        maxCacheSizeMb: z.number().optional(),
        runFrequency: z.string().optional(),
        runTime: z.string().optional(),
        description: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const policy = await updatePolicyConfig(input.policyName, input.updates as any);
      if (!policy) {
        throw new Error('Failed to update policy');
      }
      return policy;
    }),

  /**
   * Enable policy
   */
  enablePolicy: protectedProcedure
    .input(z.object({ policyName: z.string() }))
    .mutation(async ({ input }) => {
      const success = await enablePolicy(input.policyName);
      if (!success) {
        throw new Error('Failed to enable policy');
      }
      return { success: true };
    }),

  /**
   * Disable policy
   */
  disablePolicy: protectedProcedure
    .input(z.object({ policyName: z.string() }))
    .mutation(async ({ input }) => {
      const success = await disablePolicy(input.policyName);
      if (!success) {
        throw new Error('Failed to disable policy');
      }
      return { success: true };
    }),

  /**
   * Delete policy
   */
  deletePolicy: protectedProcedure
    .input(z.object({ policyName: z.string() }))
    .mutation(async ({ input }) => {
      const success = await deletePolicyConfig(input.policyName);
      if (!success) {
        throw new Error('Failed to delete policy');
      }
      return { success: true };
    }),

  // ========================================================================
  // MAINTENANCE LOG PROCEDURES
  // ========================================================================

  /**
   * Get recent eviction logs
   */
  getRecentLogs: protectedProcedure
    .input(z.object({
      days: z.number().default(7),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      return await getRecentEvictionLogs(input.days, input.limit);
    }),

  /**
   * Get logs by policy
   */
  getLogsByPolicy: protectedProcedure
    .input(z.object({
      policyName: z.string(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      return await getEvictionLogsByPolicy(input.policyName, input.limit);
    }),

  /**
   * Get eviction statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      return await getEvictionStatistics(input.days);
    }),

  /**
   * Get failed evictions
   */
  getFailedEvictions: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      return await getFailedEvictions(input.limit);
    }),

  /**
   * Get last eviction for policy
   */
  getLastEviction: protectedProcedure
    .input(z.object({
      policyName: z.string(),
    }))
    .query(async ({ input }) => {
      return await getLastEvictionForPolicy(input.policyName);
    }),
});
```

---

## 🎯 Part 4: Client-Side Usage

### **Location**: `/home/ubuntu/ologywood/client/src/hooks/useEvictionMonitoring.ts`

```typescript
import { trpc } from '../lib/trpc';

/**
 * Hook for monitoring eviction policies and logs
 */
export function useEvictionMonitoring() {
  // Get all policies
  const { data: policies, isLoading: policiesLoading } = trpc.eviction.getAllPolicies.useQuery();

  // Get recent logs
  const { data: recentLogs, isLoading: logsLoading } = trpc.eviction.getRecentLogs.useQuery({
    days: 7,
    limit: 50,
  });

  // Get statistics
  const { data: statistics, isLoading: statsLoading } = trpc.eviction.getStatistics.useQuery({
    days: 30,
  });

  // Get failed evictions
  const { data: failedEvictions, isLoading: failedLoading } = trpc.eviction.getFailedEvictions.useQuery({
    limit: 50,
  });

  return {
    policies,
    recentLogs,
    statistics,
    failedEvictions,
    isLoading: policiesLoading || logsLoading || statsLoading || failedLoading,
  };
}
```

---

## 📋 Integration Checklist

- [ ] Add table definitions to `drizzle/schema.ts`
- [ ] Create `server/services/evictionService.ts`
- [ ] Create `server/routers/evictionRouter.ts`
- [ ] Register evictionRouter in `server/routers.ts`
- [ ] Create `client/src/hooks/useEvictionMonitoring.ts`
- [ ] Run `pnpm db:push` to apply migration
- [ ] Test policy CRUD operations
- [ ] Test log retrieval
- [ ] Test statistics calculation
- [ ] Create monitoring dashboard component
- [ ] Deploy to production

---

## ✅ Summary

This implementation provides:

✅ **Complete Drizzle ORM schema** for both tables
✅ **Service layer** with 15+ functions
✅ **Router/API layer** with 11 procedures
✅ **Client-side hooks** for easy integration
✅ **Type-safe operations** with Zod validation
✅ **Error handling** throughout
✅ **Production-ready code**

Ready for immediate integration into your application!
