/**
 * Eviction Router
 * 
 * TRPC router for managing eviction policies and monitoring maintenance operations.
 * Exposes all eviction service functions as protected procedures.
 * 
 * @module server/routers/evictionRouter
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
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
} from '../services/evictionService';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Policy creation input schema
 */
const createPolicySchema = z.object({
  policyName: z.string().min(1).max(50),
  policyType: z.enum(['age-based', 'usage-based', 'hybrid', 'size-based']),
  ageThresholdDays: z.number().int().positive().optional(),
  usageThreshold: z.number().int().positive().optional(),
  usagePercentile: z.number().min(0).max(1).optional(),
  maxCacheSizeMb: z.number().int().positive().optional(),
  runFrequency: z.enum(['daily', 'weekly', 'monthly', 'manual']).optional(),
  runTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/).optional(),
  description: z.string().max(500).optional(),
});

/**
 * Policy update input schema
 */
const updatePolicySchema = z.object({
  policyName: z.string().min(1).max(50),
  updates: z.object({
    policyType: z.enum(['age-based', 'usage-based', 'hybrid', 'size-based']).optional(),
    ageThresholdDays: z.number().int().positive().optional(),
    usageThreshold: z.number().int().positive().optional(),
    usagePercentile: z.number().min(0).max(1).optional(),
    maxCacheSizeMb: z.number().int().positive().optional(),
    runFrequency: z.enum(['daily', 'weekly', 'monthly', 'manual']).optional(),
    runTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/).optional(),
    description: z.string().max(500).optional(),
  }),
});

/**
 * Eviction log input schema
 */
const logEvictionSchema = z.object({
  policyName: z.string().min(1).max(50),
  embeddingsDeleted: z.number().int().nonnegative(),
  spaceFreedMb: z.number().nonnegative(),
  cacheSizeBeforeMb: z.number().nonnegative(),
  cacheSizeAfterMb: z.number().nonnegative(),
  executionTimeMs: z.number().int().nonnegative(),
  status: z.enum(['success', 'error', 'running', 'skipped']),
  errorMessage: z.string().optional(),
  parameters: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
});

// ============================================================================
// EVICTION ROUTER
// ============================================================================

export const evictionRouter = router({
  // ========================================================================
  // POLICY CONFIGURATION PROCEDURES
  // ========================================================================

  /**
   * Get policy configuration by name
   * 
   * @query
   * @param policyName - Name of the policy
   * @returns Policy configuration or null
   * 
   * @example
   * const policy = await trpc.eviction.getPolicy.useQuery({ policyName: 'aggressive-age-based' });
   */
  getPolicy: protectedProcedure
    .input(z.object({ policyName: z.string().min(1) }))
    .query(async ({ input }) => {
      const policy = await getPolicyConfig(input.policyName);
      if (!policy) {
        throw new Error(`Policy not found: ${input.policyName}`);
      }
      return policy;
    }),

  /**
   * Get all enabled policies
   * 
   * @query
   * @returns Array of enabled policies
   * 
   * @example
   * const policies = await trpc.eviction.getEnabledPolicies.useQuery();
   */
  getEnabledPolicies: protectedProcedure
    .query(async () => {
      const policies = await getEnabledPolicies();
      return {
        count: policies.length,
        policies,
      };
    }),

  /**
   * Get all policies (enabled and disabled)
   * 
   * @query
   * @returns Array of all policies
   * 
   * @example
   * const allPolicies = await trpc.eviction.getAllPolicies.useQuery();
   */
  getAllPolicies: protectedProcedure
    .query(async () => {
      const policies = await getAllPolicies();
      const enabledCount = policies.filter((p: any) => p.enabled).length;
      return {
        total: policies.length,
        enabled: enabledCount,
        disabled: policies.length - enabledCount,
        policies,
      };
    }),

  /**
   * Create new policy configuration
   * 
   * @mutation
   * @param input - Policy configuration data
   * @returns Created policy
   * 
   * @example
   * const newPolicy = await trpc.eviction.createPolicy.useMutation();
   * newPolicy.mutate({
   *   policyName: 'custom-policy',
   *   policyType: 'age-based',
   *   ageThresholdDays: 14
   * });
   */
  createPolicy: protectedProcedure
    .input(createPolicySchema)
    .mutation(async ({ input }) => {
      const policy = await createPolicyConfig(input);
      if (!policy) {
        throw new Error(`Failed to create policy: ${input.policyName}`);
      }
      return {
        success: true,
        policy,
        message: `Policy '${input.policyName}' created successfully`,
      };
    }),

  /**
   * Update policy configuration
   * 
   * @mutation
   * @param input - Policy name and updates
   * @returns Updated policy
   * 
   * @example
   * const mutation = await trpc.eviction.updatePolicy.useMutation();
   * mutation.mutate({
   *   policyName: 'aggressive-age-based',
   *   updates: { ageThresholdDays: 14 }
   * });
   */
  updatePolicy: protectedProcedure
    .input(updatePolicySchema)
    .mutation(async ({ input }) => {
      const policy = await updatePolicyConfig(input.policyName, input.updates as any);
      if (!policy) {
        throw new Error(`Failed to update policy: ${input.policyName}`);
      }
      return {
        success: true,
        policy,
        message: `Policy '${input.policyName}' updated successfully`,
      };
    }),

  /**
   * Enable policy
   * 
   * @mutation
   * @param policyName - Name of policy to enable
   * @returns Success status
   * 
   * @example
   * const mutation = await trpc.eviction.enablePolicy.useMutation();
   * mutation.mutate({ policyName: 'aggressive-age-based' });
   */
  enablePolicy: protectedProcedure
    .input(z.object({ policyName: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const success = await enablePolicy(input.policyName);
      if (!success) {
        throw new Error(`Failed to enable policy: ${input.policyName}`);
      }
      return {
        success: true,
        message: `Policy '${input.policyName}' enabled successfully`,
      };
    }),

  /**
   * Disable policy
   * 
   * @mutation
   * @param policyName - Name of policy to disable
   * @returns Success status
   * 
   * @example
   * const mutation = await trpc.eviction.disablePolicy.useMutation();
   * mutation.mutate({ policyName: 'aggressive-age-based' });
   */
  disablePolicy: protectedProcedure
    .input(z.object({ policyName: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const success = await disablePolicy(input.policyName);
      if (!success) {
        throw new Error(`Failed to disable policy: ${input.policyName}`);
      }
      return {
        success: true,
        message: `Policy '${input.policyName}' disabled successfully`,
      };
    }),

  /**
   * Delete policy configuration
   * 
   * @mutation
   * @param policyName - Name of policy to delete
   * @returns Success status
   * 
   * @example
   * const mutation = await trpc.eviction.deletePolicy.useMutation();
   * mutation.mutate({ policyName: 'old-policy' });
   */
  deletePolicy: protectedProcedure
    .input(z.object({ policyName: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const success = await deletePolicyConfig(input.policyName);
      if (!success) {
        throw new Error(`Failed to delete policy: ${input.policyName}`);
      }
      return {
        success: true,
        message: `Policy '${input.policyName}' deleted successfully`,
      };
    }),

  // ========================================================================
  // MAINTENANCE LOG PROCEDURES
  // ========================================================================

  /**
   * Log eviction operation
   * 
   * @mutation
   * @param input - Eviction operation data
   * @returns Success status
   * 
   * @example
   * const mutation = await trpc.eviction.logEviction.useMutation();
   * mutation.mutate({
   *   policyName: 'aggressive-age-based',
   *   embeddingsDeleted: 1500,
   *   spaceFreedMb: 45.2,
   *   cacheSizeBeforeMb: 150,
   *   cacheSizeAfterMb: 104.8,
   *   executionTimeMs: 250,
   *   status: 'success'
   * });
   */
  logEviction: protectedProcedure
    .input(logEvictionSchema)
    .mutation(async ({ input }) => {
      const success = await logEvictionOperation({
        ...input,
        spaceFreedMb: String(input.spaceFreedMb),
        cacheSizeBeforeMb: String(input.cacheSizeBeforeMb),
        cacheSizeAfterMb: String(input.cacheSizeAfterMb),
      })
      if (!success) {
        throw new Error('Failed to log eviction operation');
      }
      return {
        success: true,
        message: 'Eviction operation logged successfully',
      };
    }),

  /**
   * Get recent eviction logs
   * 
   * @query
   * @param days - Number of days to look back (default: 7)
   * @param limit - Maximum number of logs (default: 50)
   * @returns Array of recent eviction logs
   * 
   * @example
   * const logs = await trpc.eviction.getRecentLogs.useQuery({ days: 7, limit: 50 });
   */
  getRecentLogs: protectedProcedure
    .input(z.object({
      days: z.number().int().positive().default(7),
      limit: z.number().int().positive().default(50),
    }))
    .query(async ({ input }) => {
      const logs = await getRecentEvictionLogs(input.days, input.limit);
      const successCount = logs.filter((log: any) => log.status === 'success').length;
      const errorCount = logs.filter((log: any) => log.status === 'error').length;
      return {
        count: logs.length,
        successCount,
        errorCount,
        period: `${input.days} days`,
        logs,
      };
    }),

  /**
   * Get eviction logs by policy
   * 
   * @query
   * @param policyName - Name of policy
   * @param limit - Maximum number of logs (default: 50)
   * @returns Array of logs for the policy
   * 
   * @example
   * const logs = await trpc.eviction.getLogsByPolicy.useQuery({ 
   *   policyName: 'aggressive-age-based',
   *   limit: 100
   * });
   */
  getLogsByPolicy: protectedProcedure
    .input(z.object({
      policyName: z.string().min(1),
      limit: z.number().int().positive().default(50),
    }))
    .query(async ({ input }) => {
      const logs = await getEvictionLogsByPolicy(input.policyName, input.limit);
      const successCount = logs.filter((log: any) => log.status === 'success').length;
      const errorCount = logs.filter((log: any) => log.status === 'error').length;
      return {
        policyName: input.policyName,
        count: logs.length,
        successCount,
        errorCount,
        logs,
      };
    }),

  /**
   * Get eviction statistics
   * 
   * @query
   * @param days - Number of days to analyze (default: 30)
   * @returns Statistics object with aggregated metrics
   * 
   * @example
   * const stats = await trpc.eviction.getStatistics.useQuery({ days: 30 });
   */
  getStatistics: protectedProcedure
    .input(z.object({
      days: z.number().int().positive().default(30),
    }))
    .query(async ({ input }) => {
      const stats = await getEvictionStatistics(input.days);
      if (!stats) {
        throw new Error('Failed to calculate statistics');
      }
      return stats;
    }),

  /**
   * Get failed eviction operations
   * 
   * @query
   * @param limit - Maximum number of failures to return (default: 50)
   * @returns Array of failed eviction operations
   * 
   * @example
   * const failures = await trpc.eviction.getFailedEvictions.useQuery({ limit: 10 });
   */
  getFailedEvictions: protectedProcedure
    .input(z.object({
      limit: z.number().int().positive().default(50),
    }))
    .query(async ({ input }) => {
      const failures = await getFailedEvictions(input.limit);
      return {
        count: failures.length,
        failures,
      };
    }),

  /**
   * Get last eviction for policy
   * 
   * @query
   * @param policyName - Name of policy
   * @returns Last eviction log or null
   * 
   * @example
   * const lastEviction = await trpc.eviction.getLastEviction.useQuery({ 
   *   policyName: 'aggressive-age-based'
   * });
   */
  getLastEviction: protectedProcedure
    .input(z.object({
      policyName: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const eviction = await getLastEvictionForPolicy(input.policyName);
      return {
        policyName: input.policyName,
        lastEviction: eviction,
        hasHistory: eviction !== null,
      };
    }),

  /**
   * Delete old logs (cleanup)
   * 
   * @mutation
   * @param daysToKeep - Number of days of logs to retain (default: 90)
   * @returns Number of logs deleted
   * 
   * @example
   * const mutation = await trpc.eviction.deleteOldLogs.useMutation();
   * mutation.mutate({ daysToKeep: 90 });
   */
  deleteOldLogs: protectedProcedure
    .input(z.object({
      daysToKeep: z.number().int().positive().default(90),
    }))
    .mutation(async ({ input }) => {
      const deletedCount = await deleteOldLogs(input.daysToKeep);
      return {
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} logs older than ${input.daysToKeep} days`,
      };
    }),

  // ========================================================================
  // ADVANCED OPERATIONS
  // ========================================================================

  /**
   * Get cache health metrics
   * 
   * @query
   * @returns Cache health information
   * 
   * @example
   * const health = await trpc.eviction.getCacheHealth.useQuery();
   */
  getCacheHealth: protectedProcedure
    .query(async () => {
      const health = await getCacheHealth();
      if (!health) {
        throw new Error('Failed to calculate cache health');
      }
      return health;
    }),

  /**
   * Get policy recommendations
   * 
   * @query
   * @returns Array of policy recommendations
   * 
   * @example
   * const recommendations = await trpc.eviction.getRecommendations.useQuery();
   */
  getRecommendations: protectedProcedure
    .query(async () => {
      const recommendations = await getPolicyRecommendations();
      return {
        count: recommendations.length,
        recommendations,
      };
    }),

  /**
   * Initialize default policies
   * 
   * @mutation
   * @returns Success status
   * 
   * @example
   * const mutation = await trpc.eviction.initializeDefaults.useMutation();
   * mutation.mutate();
   */
  initializeDefaults: protectedProcedure
    .mutation(async () => {
      const success = await initializeDefaultPolicies();
      if (!success) {
        throw new Error('Failed to initialize default policies');
      }
      return {
        success: true,
        message: 'Default policies initialized successfully',
        policies: [
          'aggressive-age-based',
          'balanced-hybrid',
          'conservative-age-based',
        ],
      };
    }),

  // ========================================================================
  // DASHBOARD PROCEDURES
  // ========================================================================

  /**
   * Get complete dashboard data
   * 
   * @query
   * @returns Comprehensive dashboard information
   * 
   * @example
   * const dashboard = await trpc.eviction.getDashboard.useQuery();
   */
  getDashboard: protectedProcedure
    .query(async () => {
      const [
        policies,
        recentLogs,
        statistics,
        health,
        recommendations,
      ] = await Promise.all([
        getAllPolicies(),
        getRecentEvictionLogs(7, 20),
        getEvictionStatistics(30),
        getCacheHealth(),
        getPolicyRecommendations(),
      ]);

      const enabledCount = policies.filter((p: any) => p.enabled).length;

      return {
        policies: {
          total: policies.length,
          enabled: enabledCount,
          disabled: policies.length - enabledCount,
          list: policies,
        },
        recentLogs: {
          count: recentLogs.length,
          logs: recentLogs,
        },
        statistics,
        health,
        recommendations: {
          count: recommendations.length,
          items: recommendations,
        },
      };
    }),

  /**
   * Get policy details with history
   * 
   * @query
   * @param policyName - Name of policy
   * @returns Policy details with execution history
   * 
   * @example
   * const details = await trpc.eviction.getPolicyDetails.useQuery({ 
   *   policyName: 'aggressive-age-based'
   * });
   */
  getPolicyDetails: protectedProcedure
    .input(z.object({
      policyName: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const [policy, logs, lastEviction] = await Promise.all([
        getPolicyConfig(input.policyName),
        getEvictionLogsByPolicy(input.policyName, 50),
        getLastEvictionForPolicy(input.policyName),
      ]);

      if (!policy) {
        throw new Error(`Policy not found: ${input.policyName}`);
      }

      const successCount = logs.filter((log: any) => log.status === 'success').length;
      const errorCount = logs.filter((log: any) => log.status === 'error').length;

      return {
        policy,
        history: {
          totalRuns: logs.length,
          successCount,
          errorCount,
          successRate: logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(2) + '%' : 'N/A',
          logs,
        },
        lastEviction,
      };
    }),
});

export default evictionRouter;
