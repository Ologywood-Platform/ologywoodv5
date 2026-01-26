/**
 * Eviction Service
 * 
 * Comprehensive service for managing eviction policies and maintenance operations.
 * Handles all CRUD operations for eviction policies and maintenance logging.
 * 
 * @module server/services/evictionService
 */

import { getDb } from '../db';
import { 
  evictionPolicyConfig, 
  evictionMaintenanceLog,
  EvictionPolicyConfig,
  InsertEvictionMaintenanceLog
} from '../../drizzle/schema';
import { eq, and, desc, gte, lt } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface EvictionStatistics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: string;
  totalEmbeddingsDeleted: number;
  totalSpaceFreedMb: string;
  avgExecutionTimeMs: number;
  avgSpaceFreedMb: string;
  period: string;
}

export interface PolicyCreateInput {
  policyName: string;
  policyType: 'age-based' | 'usage-based' | 'hybrid' | 'size-based';
  ageThresholdDays?: number;
  usageThreshold?: number;
  usagePercentile?: number;
  maxCacheSizeMb?: number;
  runFrequency?: 'daily' | 'weekly' | 'monthly' | 'manual';
  runTime?: string;
  description?: string;
}

export interface PolicyUpdateInput {
  policyType?: string;
  ageThresholdDays?: number;
  usageThreshold?: number;
  usagePercentile?: number;
  maxCacheSizeMb?: number;
  runFrequency?: string;
  runTime?: string;
  description?: string;
}

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

const LOG_PREFIX = '[EvictionService]';

function logInfo(message: string, data?: any) {
  console.log(`${LOG_PREFIX} ${message}`, data || '');
}

function logError(message: string, error?: any) {
  console.error(`${LOG_PREFIX} ${message}`, error || '');
}

function logWarn(message: string, data?: any) {
  console.warn(`${LOG_PREFIX} ${message}`, data || '');
}

// ============================================================================
// POLICY CONFIGURATION OPERATIONS
// ============================================================================

/**
 * Get policy configuration by name
 * 
 * @param policyName - Name of the policy to retrieve
 * @returns Policy configuration or null if not found
 * 
 * @example
 * const policy = await getPolicyConfig('aggressive-age-based');
 * if (policy) {
 *   console.log(`Policy threshold: ${policy.ageThresholdDays} days`);
 * }
 */
export async function getPolicyConfig(policyName: string): Promise<EvictionPolicyConfig | null> {
  try {
    const db = await getDb();
    if (!db) {
      logWarn('Database connection unavailable');
      return null;
    }

    const result = await db
      .select()
      .from(evictionPolicyConfig)
      .where(eq(evictionPolicyConfig.policyName, policyName))
      .limit(1);

    if (!result.length) {
      logWarn(`Policy not found: ${policyName}`);
      return null;
    }

    logInfo(`Retrieved policy: ${policyName}`);
    return result[0];
  } catch (error) {
    logError(`Error retrieving policy ${policyName}:`, error);
    return null;
  }
}

/**
 * Get all enabled policies
 * 
 * @returns Array of enabled policies
 * 
 * @example
 * const enabledPolicies = await getEnabledPolicies();
 * for (const policy of enabledPolicies) {
 *   console.log(`Running policy: ${policy.policyName}`);
 * }
 */
export async function getEnabledPolicies(): Promise<EvictionPolicyConfig[]> {
  try {
    const db = await getDb();
    if (!db) {
      logWarn('Database connection unavailable');
      return [];
    }

    const policies = await db
      .select()
      .from(evictionPolicyConfig)
      .where(eq(evictionPolicyConfig.enabled, true));

    logInfo(`Retrieved ${policies.length} enabled policies`);
    return policies;
  } catch (error) {
    logError('Error retrieving enabled policies:', error);
    return [];
  }
}

/**
 * Get all policies (enabled and disabled)
 * 
 * @returns Array of all policies
 * 
 * @example
 * const allPolicies = await getAllPolicies();
 * console.log(`Total policies: ${allPolicies.length}`);
 */
export async function getAllPolicies(): Promise<EvictionPolicyConfig[]> {
  try {
    const db = await getDb();
    if (!db) {
      logWarn('Database connection unavailable');
      return [];
    }

    const policies = await db
      .select()
      .from(evictionPolicyConfig)
      .orderBy(evictionPolicyConfig.policyName);

    logInfo(`Retrieved ${policies.length} total policies`);
    return policies;
  } catch (error) {
    logError('Error retrieving all policies:', error);
    return [];
  }
}

/**
 * Create new policy configuration
 * 
 * @param data - Policy configuration data
 * @returns Created policy or null on error
 * 
 * @example
 * const newPolicy = await createPolicyConfig({
 *   policyName: 'conservative-age-based',
 *   policyType: 'age-based',
 *   ageThresholdDays: 30,
 *   runFrequency: 'weekly',
 *   description: 'Conservative eviction policy'
 * });
 */
export async function createPolicyConfig(
  data: PolicyCreateInput
): Promise<EvictionPolicyConfig | null> {
  try {
    const db = await getDb();
    if (!db) {
      logError('Database connection unavailable');
      return null;
    }

    // Validate required fields
    if (!data.policyName || !data.policyType) {
      logError('Missing required fields: policyName and policyType');
      return null;
    }

    // Check if policy already exists
    const existing = await getPolicyConfig(data.policyName);
    if (existing) {
      logWarn(`Policy already exists: ${data.policyName}`);
      return null;
    }

    // Insert new policy
    await db.insert(evictionPolicyConfig).values({
      policyName: data.policyName,
      policyType: data.policyType,
      ageThresholdDays: data.ageThresholdDays || 7,
      usageThreshold: data.usageThreshold || null,
      usagePercentile: data.usagePercentile || null,
      maxCacheSizeMb: data.maxCacheSizeMb || null,
      enabled: true,
      runFrequency: data.runFrequency || 'daily',
      runTime: data.runTime || '02:00:00',
      description: data.description || null,
    } as any);

    logInfo(`Created policy: ${data.policyName}`);
    return await getPolicyConfig(data.policyName);
  } catch (error) {
    logError(`Error creating policy ${data.policyName}:`, error);
    return null;
  }
}

/**
 * Update policy configuration
 * 
 * @param policyName - Name of policy to update
 * @param data - Updated policy data
 * @returns Updated policy or null on error
 * 
 * @example
 * const updated = await updatePolicyConfig('aggressive-age-based', {
 *   ageThresholdDays: 14,
 *   description: 'Updated to 14-day threshold'
 * });
 */
export async function updatePolicyConfig(
  policyName: string,
  data: PolicyUpdateInput
): Promise<EvictionPolicyConfig | null> {
  try {
    const db = await getDb();
    if (!db) {
      logError('Database connection unavailable');
      return null;
    }

    // Verify policy exists
    const existing = await getPolicyConfig(policyName);
    if (!existing) {
      logError(`Policy not found: ${policyName}`);
      return null;
    }

    // Update policy
    await db
      .update(evictionPolicyConfig)
      .set({
        ...(data.policyType && { policyType: data.policyType }),
        ...(data.ageThresholdDays !== undefined && { ageThresholdDays: data.ageThresholdDays }),
        ...(data.usageThreshold !== undefined && { usageThreshold: data.usageThreshold }),
        ...(data.usagePercentile !== undefined && { usagePercentile: data.usagePercentile }),
        ...(data.maxCacheSizeMb !== undefined && { maxCacheSizeMb: data.maxCacheSizeMb }),
        ...(data.runFrequency && { runFrequency: data.runFrequency }),
        ...(data.runTime && { runTime: data.runTime }),
        ...(data.description !== undefined && { description: data.description }),
        updatedAt: new Date(),
      } as any)
      .where(eq(evictionPolicyConfig.policyName, policyName));

    logInfo(`Updated policy: ${policyName}`);
    return await getPolicyConfig(policyName);
  } catch (error) {
    logError(`Error updating policy ${policyName}:`, error);
    return null;
  }
}

/**
 * Enable policy
 * 
 * @param policyName - Name of policy to enable
 * @returns Success status
 * 
 * @example
 * const success = await enablePolicy('aggressive-age-based');
 * if (success) {
 *   console.log('Policy enabled successfully');
 * }
 */
export async function enablePolicy(policyName: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      logError('Database connection unavailable');
      return false;
    }

    // Verify policy exists
    const existing = await getPolicyConfig(policyName);
    if (!existing) {
      logError(`Policy not found: ${policyName}`);
      return false;
    }

    if (existing.enabled) {
      logWarn(`Policy already enabled: ${policyName}`);
      return true;
    }

    await db
      .update(evictionPolicyConfig)
      .set({ enabled: true, updatedAt: new Date() } as any)
      .where(eq(evictionPolicyConfig.policyName, policyName));

    logInfo(`Enabled policy: ${policyName}`);
    return true;
  } catch (error) {
    logError(`Error enabling policy ${policyName}:`, error);
    return false;
  }
}

/**
 * Disable policy
 * 
 * @param policyName - Name of policy to disable
 * @returns Success status
 * 
 * @example
 * const success = await disablePolicy('aggressive-age-based');
 * if (success) {
 *   console.log('Policy disabled successfully');
 * }
 */
export async function disablePolicy(policyName: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      logError('Database connection unavailable');
      return false;
    }

    // Verify policy exists
    const existing = await getPolicyConfig(policyName);
    if (!existing) {
      logError(`Policy not found: ${policyName}`);
      return false;
    }

    if (!existing.enabled) {
      logWarn(`Policy already disabled: ${policyName}`);
      return true;
    }

    await db
      .update(evictionPolicyConfig)
      .set({ enabled: false, updatedAt: new Date() } as any)
      .where(eq(evictionPolicyConfig.policyName, policyName));

    logInfo(`Disabled policy: ${policyName}`);
    return true;
  } catch (error) {
    logError(`Error disabling policy ${policyName}:`, error);
    return false;
  }
}

/**
 * Delete policy configuration
 * 
 * @param policyName - Name of policy to delete
 * @returns Success status
 * 
 * @example
 * const success = await deletePolicyConfig('old-policy');
 * if (success) {
 *   console.log('Policy deleted successfully');
 * }
 */
export async function deletePolicyConfig(policyName: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      logError('Database connection unavailable');
      return false;
    }

    // Verify policy exists
    const existing = await getPolicyConfig(policyName);
    if (!existing) {
      logError(`Policy not found: ${policyName}`);
      return false;
    }

    await db
      .delete(evictionPolicyConfig)
      .where(eq(evictionPolicyConfig.policyName, policyName));

    logInfo(`Deleted policy: ${policyName}`);
    return true;
  } catch (error) {
    logError(`Error deleting policy ${policyName}:`, error);
    return false;
  }
}

// ============================================================================
// MAINTENANCE LOG OPERATIONS
// ============================================================================

/**
 * Log eviction operation
 * 
 * @param data - Eviction operation data
 * @returns Success status
 * 
 * @example
 * const success = await logEvictionOperation({
 *   policyName: 'aggressive-age-based',
 *   embeddingsDeleted: 1500,
 *   spaceFreedMb: 45.2,
 *   cacheSizeBeforeMb: 150,
 *   cacheSizeAfterMb: 104.8,
 *   executionTimeMs: 250,
 *   status: 'success'
 * });
 */
export async function logEvictionOperation(
  data: Omit<InsertEvictionMaintenanceLog, 'executionTimestamp'>
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      logError('Database connection unavailable');
      return false;
    }

    await db.insert(evictionMaintenanceLog).values({
      ...data,
      executionTimestamp: new Date(),
    } as any);

    logInfo(`Logged eviction operation for policy: ${data.policyName}`);
    return true;
  } catch (error) {
    logError('Error logging eviction operation:', error);
    return false;
  }
}

/**
 * Get recent eviction logs
 * 
 * @param days - Number of days to look back
 * @param limit - Maximum number of logs to return
 * @returns Array of eviction logs
 * 
 * @example
 * const recentLogs = await getRecentEvictionLogs(7, 50);
 * console.log(`Found ${recentLogs.length} evictions in the last 7 days`);
 */
export async function getRecentEvictionLogs(
  days: number = 7,
  limit: number = 50
): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) {
      logWarn('Database connection unavailable');
      return [];
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const logs = await db
      .select()
      .from(evictionMaintenanceLog)
      .where(gte(evictionMaintenanceLog.executionTimestamp, cutoffDate))
      .orderBy(desc(evictionMaintenanceLog.executionTimestamp))
      .limit(limit);

    logInfo(`Retrieved ${logs.length} recent eviction logs (${days} days)`);
    return logs;
  } catch (error) {
    logError('Error fetching recent logs:', error);
    return [];
  }
}

/**
 * Get eviction logs by policy
 * 
 * @param policyName - Name of policy
 * @param limit - Maximum number of logs to return
 * @returns Array of eviction logs for the policy
 * 
 * @example
 * const policyLogs = await getEvictionLogsByPolicy('aggressive-age-based', 100);
 * console.log(`Policy has ${policyLogs.length} eviction records`);
 */
export async function getEvictionLogsByPolicy(
  policyName: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) {
      logWarn('Database connection unavailable');
      return [];
    }

    const logs = await db
      .select()
      .from(evictionMaintenanceLog)
      .where(eq(evictionMaintenanceLog.policyName, policyName))
      .orderBy(desc(evictionMaintenanceLog.executionTimestamp))
      .limit(limit);

    logInfo(`Retrieved ${logs.length} logs for policy: ${policyName}`);
    return logs;
  } catch (error) {
    logError(`Error fetching logs for policy ${policyName}:`, error);
    return [];
  }
}

/**
 * Get eviction statistics
 * 
 * @param days - Number of days to analyze
 * @returns Statistics object with aggregated metrics
 * 
 * @example
 * const stats = await getEvictionStatistics(30);
 * console.log(`Success rate: ${stats.successRate}`);
 * console.log(`Total space freed: ${stats.totalSpaceFreedMb} MB`);
 */
export async function getEvictionStatistics(days: number = 30): Promise<EvictionStatistics | null> {
  try {
    const db = await getDb();
    if (!db) {
      logError('Database connection unavailable');
      return null;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const logs = await db
      .select()
      .from(evictionMaintenanceLog)
      .where(gte(evictionMaintenanceLog.executionTimestamp, cutoffDate));

    if (logs.length === 0) {
      logWarn(`No eviction logs found for the last ${days} days`);
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        successRate: '0%',
        totalEmbeddingsDeleted: 0,
        totalSpaceFreedMb: '0',
        avgExecutionTimeMs: 0,
        avgSpaceFreedMb: '0',
        period: `${days} days`,
      };
    }

    const successfulRuns = logs.filter((log: any) => log.status === 'success').length;
    const failedRuns = logs.filter((log: any) => log.status === 'error').length;
    const totalEmbeddingsDeleted = logs.reduce((sum: number, log: any) => sum + (log.embeddingsDeleted || 0), 0);
    const totalSpaceFreedMb = logs.reduce((sum: number, log: any) => sum + (parseFloat(log.spaceFreedMb) || 0), 0);
    const avgExecutionTimeMs = Math.round(
      logs.reduce((sum: number, log: any) => sum + (log.executionTimeMs || 0), 0) / logs.length
    );

    const statistics: EvictionStatistics = {
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

    logInfo(`Calculated statistics for ${days} days`);
    return statistics;
  } catch (error) {
    logError('Error calculating statistics:', error);
    return null;
  }
}

/**
 * Get failed eviction operations
 * 
 * @param limit - Maximum number of failed operations to return
 * @returns Array of failed eviction operations
 * 
 * @example
 * const failures = await getFailedEvictions(10);
 * for (const failure of failures) {
 *   console.log(`Failed: ${failure.errorMessage}`);
 * }
 */
export async function getFailedEvictions(limit: number = 50): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) {
      logWarn('Database connection unavailable');
      return [];
    }

    const failures = await db
      .select()
      .from(evictionMaintenanceLog)
      .where(eq(evictionMaintenanceLog.status, 'error'))
      .orderBy(desc(evictionMaintenanceLog.executionTimestamp))
      .limit(limit);

    logInfo(`Retrieved ${failures.length} failed evictions`);
    return failures;
  } catch (error) {
    logError('Error fetching failed evictions:', error);
    return [];
  }
}

/**
 * Get last eviction for policy
 * 
 * @param policyName - Name of policy
 * @returns Last eviction log or null if none found
 * 
 * @example
 * const lastEviction = await getLastEvictionForPolicy('aggressive-age-based');
 * if (lastEviction) {
 *   console.log(`Last eviction: ${lastEviction.executionTimestamp}`);
 *   console.log(`Status: ${lastEviction.status}`);
 * }
 */
export async function getLastEvictionForPolicy(policyName: string): Promise<any | null> {
  try {
    const db = await getDb();
    if (!db) {
      logWarn('Database connection unavailable');
      return null;
    }

    const result = await db
      .select()
      .from(evictionMaintenanceLog)
      .where(eq(evictionMaintenanceLog.policyName, policyName))
      .orderBy(desc(evictionMaintenanceLog.executionTimestamp))
      .limit(1);

    if (!result.length) {
      logWarn(`No eviction history found for policy: ${policyName}`);
      return null;
    }

    logInfo(`Retrieved last eviction for policy: ${policyName}`);
    return result[0];
  } catch (error) {
    logError(`Error fetching last eviction for policy ${policyName}:`, error);
    return null;
  }
}

/**
 * Delete old logs (cleanup operation)
 * 
 * @param daysToKeep - Number of days of logs to retain
 * @returns Number of logs deleted
 * 
 * @example
 * const deleted = await deleteOldLogs(90);
 * console.log(`Deleted ${deleted} old eviction logs`);
 */
export async function deleteOldLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      logError('Database connection unavailable');
      return 0;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db
      .delete(evictionMaintenanceLog)
      .where(lt(evictionMaintenanceLog.executionTimestamp, cutoffDate));

    // Extract affected rows count from result
    const deletedCount = (result as any)[0]?.affectedRows || 0;
    logInfo(`Deleted ${deletedCount} old eviction logs (older than ${daysToKeep} days)`);
    return deletedCount;
  } catch (error) {
    logError('Error deleting old logs:', error);
    return 0;
  }
}

// ============================================================================
// ADVANCED OPERATIONS
// ============================================================================

/**
 * Get cache health metrics
 * 
 * @returns Object with cache health information
 * 
 * @example
 * const health = await getCacheHealth();
 * console.log(`Cache health: ${health.healthScore}/100`);
 */
export async function getCacheHealth(): Promise<any | null> {
  try {
    const db = await getDb();
    if (!db) {
      logError('Database connection unavailable');
      return null;
    }

    // Get recent statistics
    const stats = await getEvictionStatistics(7);
    const lastEviction = await db
      .select()
      .from(evictionMaintenanceLog)
      .orderBy(desc(evictionMaintenanceLog.executionTimestamp))
      .limit(1);

    if (!lastEviction.length) {
      return {
        healthScore: 50,
        status: 'unknown',
        message: 'No eviction history available',
      };
    }

    const last = lastEviction[0];
    let healthScore = 100;

    // Deduct points for failures
    if (stats && stats.failedRuns > 0) {
      healthScore -= Math.min(stats.failedRuns * 10, 30);
    }

    // Deduct points if last eviction failed
    if (last.status === 'error') {
      healthScore -= 20;
    }

    // Deduct points if eviction is stale (> 2 days)
    const lastEvictionTime = new Date(last.executionTimestamp).getTime();
    const now = Date.now();
    const daysSinceEviction = (now - lastEvictionTime) / (1000 * 60 * 60 * 24);
    if (daysSinceEviction > 2) {
      healthScore -= Math.min(Math.floor(daysSinceEviction * 5), 20);
    }

    const status = healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'warning' : 'critical';

    return {
      healthScore: Math.max(0, healthScore),
      status,
      lastEvictionTime: last.executionTimestamp,
      daysSinceEviction: daysSinceEviction.toFixed(2),
      statistics: stats,
    };
  } catch (error) {
    logError('Error calculating cache health:', error);
    return null;
  }
}

/**
 * Get policy recommendations
 * 
 * @returns Array of policy recommendations
 * 
 * @example
 * const recommendations = await getPolicyRecommendations();
 * for (const rec of recommendations) {
 *   console.log(`Recommendation: ${rec.message}`);
 * }
 */
export async function getPolicyRecommendations(): Promise<any[]> {
  try {
    const recommendations: any[] = [];
    const health = await getCacheHealth();
    const stats = await getEvictionStatistics(30);

    if (!health || !stats) {
      return recommendations;
    }

    // Recommendation 1: Health status
    if (health.status === 'critical') {
      recommendations.push({
        severity: 'critical',
        message: 'Cache health is critical. Review eviction policies immediately.',
        action: 'Check failed evictions and adjust policy parameters.',
      });
    }

    // Recommendation 2: Success rate
    if (stats.failedRuns > 0) {
      const failureRate = (stats.failedRuns / stats.totalRuns) * 100;
      if (failureRate > 10) {
        recommendations.push({
          severity: 'warning',
          message: `High failure rate: ${failureRate.toFixed(2)}%`,
          action: 'Review error logs and adjust policy configuration.',
        });
      }
    }

    // Recommendation 3: Execution time
    if (stats.avgExecutionTimeMs > 1000) {
      recommendations.push({
        severity: 'info',
        message: `Eviction is slow: ${stats.avgExecutionTimeMs}ms average`,
        action: 'Consider optimizing database indexes or reducing batch size.',
      });
    }

    logInfo(`Generated ${recommendations.length} policy recommendations`);
    return recommendations;
  } catch (error) {
    logError('Error generating policy recommendations:', error);
    return [];
  }
}

// ============================================================================
// INITIALIZATION AND SETUP
// ============================================================================

/**
 * Initialize default eviction policies
 * 
 * @returns Success status
 * 
 * @example
 * const success = await initializeDefaultPolicies();
 * if (success) {
 *   console.log('Default policies initialized');
 * }
 */
export async function initializeDefaultPolicies(): Promise<boolean> {
  try {
    logInfo('Initializing default eviction policies...');

    const policies: PolicyCreateInput[] = [
      {
        policyName: 'aggressive-age-based',
        policyType: 'age-based',
        ageThresholdDays: 7,
        runFrequency: 'daily',
        runTime: '02:00:00',
        description: 'Aggressive age-based eviction: Delete embeddings unused for 7+ days',
      },
      {
        policyName: 'balanced-hybrid',
        policyType: 'hybrid',
        ageThresholdDays: 30,
        usagePercentile: 0.75,
        runFrequency: 'weekly',
        runTime: '03:00:00',
        description: 'Balanced hybrid policy: Age (30 days) + usage (keep top 25%)',
      },
      {
        policyName: 'conservative-age-based',
        policyType: 'age-based',
        ageThresholdDays: 90,
        runFrequency: 'monthly',
        runTime: '04:00:00',
        description: 'Conservative age-based eviction: Delete embeddings unused for 90+ days',
      },
    ];

    for (const policy of policies) {
      const existing = await getPolicyConfig(policy.policyName);
      if (!existing) {
        await createPolicyConfig(policy);
      }
    }

    logInfo('Default eviction policies initialized successfully');
    return true;
  } catch (error) {
    logError('Error initializing default policies:', error);
    return false;
  }
}

export default {
  // Policy operations
  getPolicyConfig,
  getEnabledPolicies,
  getAllPolicies,
  createPolicyConfig,
  updatePolicyConfig,
  enablePolicy,
  disablePolicy,
  deletePolicyConfig,

  // Log operations
  logEvictionOperation,
  getRecentEvictionLogs,
  getEvictionLogsByPolicy,
  getEvictionStatistics,
  getFailedEvictions,
  getLastEvictionForPolicy,
  deleteOldLogs,

  // Advanced operations
  getCacheHealth,
  getPolicyRecommendations,
  initializeDefaultPolicies,
};
