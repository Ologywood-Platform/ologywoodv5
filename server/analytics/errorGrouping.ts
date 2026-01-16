/**
 * Error Grouping & Deduplication Service
 * Groups similar errors and identifies unique error patterns
 */

export interface ErrorGroup {
  groupId: string;
  name: string;
  errorCodes: string[];
  pattern: string;
  count: number;
  affectedUsers: number;
  severity: string;
  endpoints: string[];
  lastOccurred: Date;
  firstOccurred: Date;
  examples: Array<{
    code: string;
    message: string;
    timestamp: Date;
  }>;
}

export interface ErrorPattern {
  pattern: string;
  similarity: number; // 0-1
  relatedErrors: string[];
}

/**
 * Error Grouping Service
 */
class ErrorGroupingService {
  private groups: Map<string, ErrorGroup> = new Map();
  private patterns: Map<string, ErrorPattern> = new Map();
  private groupCache: Map<string, string> = new Map(); // error code -> group id

  /**
   * Generate group ID from error pattern
   */
  private generateGroupId(pattern: string): string {
    return `group_${pattern.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
  }

  /**
   * Extract error pattern from error code and message
   */
  private extractPattern(errorCode: string, errorMessage: string): string {
    // Remove specific values and keep only the structure
    const cleanMessage = errorMessage
      .replace(/\d+/g, 'NUM') // Replace numbers
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID') // Replace UUIDs
      .replace(/\b\w+@\w+\.\w+\b/g, 'EMAIL') // Replace emails
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, 'IP') // Replace IPs
      .toLowerCase();

    // Create pattern from error code and cleaned message
    const pattern = `${errorCode}:${cleanMessage.substring(0, 100)}`;
    return pattern;
  }

  /**
   * Calculate similarity between two patterns (0-1)
   */
  private calculateSimilarity(pattern1: string, pattern2: string): number {
    const parts1 = pattern1.split(':');
    const parts2 = pattern2.split(':');

    // Same error code is a strong indicator
    if (parts1[0] === parts2[0]) {
      // Calculate string similarity using Levenshtein distance
      const similarity = this.levenshteinSimilarity(parts1[1], parts2[1]);
      return 0.7 + similarity * 0.3; // 70% weight on error code, 30% on message
    }

    return 0;
  }

  /**
   * Calculate Levenshtein similarity (0-1)
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Find or create group for error
   */
  findOrCreateGroup(
    errorCode: string,
    errorMessage: string,
    severity: string,
    endpoint: string
  ): string {
    // Check cache first
    if (this.groupCache.has(errorCode)) {
      return this.groupCache.get(errorCode)!;
    }

    const pattern = this.extractPattern(errorCode, errorMessage);
    const groupId = this.generateGroupId(pattern);

    // Check if group exists
    if (this.groups.has(groupId)) {
      this.groupCache.set(errorCode, groupId);
      return groupId;
    }

    // Check for similar patterns
    let bestMatchGroupId: string | null = null;
    let bestSimilarity = 0.7; // Threshold for grouping

    for (const [existingGroupId, group] of this.groups) {
      const similarity = this.calculateSimilarity(pattern, group.pattern);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatchGroupId = existingGroupId;
      }
    }

    // Use existing group if found similar
    if (bestMatchGroupId) {
      this.groupCache.set(errorCode, bestMatchGroupId);
      return bestMatchGroupId;
    }

    // Create new group
    const newGroup: ErrorGroup = {
      groupId,
      name: `${errorCode} - ${errorMessage.substring(0, 50)}`,
      errorCodes: [errorCode],
      pattern,
      count: 0,
      affectedUsers: 0,
      severity,
      endpoints: [endpoint],
      lastOccurred: new Date(),
      firstOccurred: new Date(),
      examples: [],
    };

    this.groups.set(groupId, newGroup);
    this.groupCache.set(errorCode, groupId);

    return groupId;
  }

  /**
   * Add error to group
   */
  addErrorToGroup(
    errorCode: string,
    errorMessage: string,
    severity: string,
    endpoint: string,
    userId?: number
  ): void {
    const groupId = this.findOrCreateGroup(
      errorCode,
      errorMessage,
      severity,
      endpoint
    );
    const group = this.groups.get(groupId);

    if (!group) return;

    // Update group stats
    group.count++;
    group.lastOccurred = new Date();

    // Add error code if not already present
    if (!group.errorCodes.includes(errorCode)) {
      group.errorCodes.push(errorCode);
    }

    // Add endpoint if not already present
    if (!group.endpoints.includes(endpoint)) {
      group.endpoints.push(endpoint);
    }

    // Track affected users
    if (userId && !group.examples.some((e) => e.code === errorCode)) {
      group.affectedUsers++;
    }

    // Keep last 5 examples
    if (group.examples.length < 5) {
      group.examples.push({
        code: errorCode,
        message: errorMessage,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get all error groups
   */
  getGroups(): ErrorGroup[] {
    return Array.from(this.groups.values()).sort(
      (a, b) => b.count - a.count
    );
  }

  /**
   * Get group by ID
   */
  getGroup(groupId: string): ErrorGroup | undefined {
    return this.groups.get(groupId);
  }

  /**
   * Get groups by severity
   */
  getGroupsBySeverity(severity: string): ErrorGroup[] {
    return Array.from(this.groups.values())
      .filter((g) => g.severity === severity)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get groups by endpoint
   */
  getGroupsByEndpoint(endpoint: string): ErrorGroup[] {
    return Array.from(this.groups.values())
      .filter((g) => g.endpoints.includes(endpoint))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get top N error groups
   */
  getTopGroups(limit: number = 10): ErrorGroup[] {
    return this.getGroups().slice(0, limit);
  }

  /**
   * Get error patterns
   */
  getPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Find related errors
   */
  findRelatedErrors(errorCode: string): string[] {
    const groupId = this.groupCache.get(errorCode);
    if (!groupId) return [];

    const group = this.groups.get(groupId);
    return group?.errorCodes || [];
  }

  /**
   * Merge groups
   */
  mergeGroups(sourceGroupId: string, targetGroupId: string): void {
    const sourceGroup = this.groups.get(sourceGroupId);
    const targetGroup = this.groups.get(targetGroupId);

    if (!sourceGroup || !targetGroup) return;

    // Merge source into target
    targetGroup.count += sourceGroup.count;
    targetGroup.affectedUsers += sourceGroup.affectedUsers;
    targetGroup.errorCodes = [
      ...new Set([...targetGroup.errorCodes, ...sourceGroup.errorCodes]),
    ];
    targetGroup.endpoints = [
      ...new Set([...targetGroup.endpoints, ...sourceGroup.endpoints]),
    ];
    targetGroup.examples = [
      ...targetGroup.examples,
      ...sourceGroup.examples,
    ].slice(-5);

    // Update cache
    for (const errorCode of sourceGroup.errorCodes) {
      this.groupCache.set(errorCode, targetGroupId);
    }

    // Remove source group
    this.groups.delete(sourceGroupId);
  }

  /**
   * Clear old groups
   */
  clearOldGroups(hoursOld: number = 72): void {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

    for (const [groupId, group] of this.groups) {
      if (group.lastOccurred < cutoffTime) {
        this.groups.delete(groupId);

        // Remove from cache
        for (const errorCode of group.errorCodes) {
          this.groupCache.delete(errorCode);
        }
      }
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalGroups: number;
    totalErrors: number;
    totalAffectedUsers: number;
    averageErrorsPerGroup: number;
    groupsBySeverity: Record<string, number>;
  } {
    const groups = this.getGroups();
    const totalErrors = groups.reduce((sum, g) => sum + g.count, 0);
    const totalAffectedUsers = groups.reduce((sum, g) => sum + g.affectedUsers, 0);

    const groupsBySeverity: Record<string, number> = {};
    for (const group of groups) {
      groupsBySeverity[group.severity] =
        (groupsBySeverity[group.severity] || 0) + 1;
    }

    return {
      totalGroups: groups.length,
      totalErrors,
      totalAffectedUsers,
      averageErrorsPerGroup:
        groups.length > 0 ? totalErrors / groups.length : 0,
      groupsBySeverity,
    };
  }
}

// Singleton instance
export const errorGroupingService = new ErrorGroupingService();

/**
 * Initialize error grouping service
 */
export function initializeErrorGrouping(): void {
  // Clear old groups every hour
  setInterval(() => {
    errorGroupingService.clearOldGroups(72);
  }, 60 * 60 * 1000);

  console.log('[Error Grouping] Service initialized');
}
