/**
 * Contract History and Archival Service
 * Manages contract versioning, history tracking, and archival
 */

export interface ContractVersion {
  id: string;
  contractId: number;
  versionNumber: number;
  status: 'draft' | 'sent' | 'signed' | 'executed' | 'archived' | 'cancelled';
  createdAt: Date;
  createdBy: string;
  changes: string; // Description of changes from previous version
  contractData: Record<string, any>;
}

export interface ContractArchive {
  id: string;
  contractId: number;
  archivedAt: Date;
  archivedBy: string;
  reason: string;
  retentionDays: number;
  expiresAt: Date;
  metadata: Record<string, any>;
}

export interface ContractComparison {
  versionA: ContractVersion;
  versionB: ContractVersion;
  differences: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export class ContractHistoryService {
  /**
   * Create a new contract version
   */
  static createVersion(
    contractId: number,
    versionNumber: number,
    status: ContractVersion['status'],
    createdBy: string,
    changes: string,
    contractData: Record<string, any>
  ): ContractVersion {
    return {
      id: `v_${contractId}_${versionNumber}_${Date.now()}`,
      contractId,
      versionNumber,
      status,
      createdAt: new Date(),
      createdBy,
      changes,
      contractData,
    };
  }

  /**
   * Compare two contract versions
   */
  static compareVersions(versionA: ContractVersion, versionB: ContractVersion): ContractComparison {
    const differences: ContractComparison['differences'] = [];

    // Compare all fields in contractData
    const allKeys = new Set([
      ...Object.keys(versionA.contractData),
      ...Object.keys(versionB.contractData),
    ]);

    allKeys.forEach((key) => {
      const oldValue = versionA.contractData[key];
      const newValue = versionB.contractData[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        differences.push({
          field: key,
          oldValue,
          newValue,
        });
      }
    });

    return {
      versionA,
      versionB,
      differences,
    };
  }

  /**
   * Generate version history summary
   */
  static generateHistorySummary(versions: ContractVersion[]): {
    totalVersions: number;
    firstCreated: Date;
    lastModified: Date;
    statusProgression: string[];
    totalChanges: number;
  } {
    const sortedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);

    return {
      totalVersions: versions.length,
      firstCreated: sortedVersions[0]?.createdAt || new Date(),
      lastModified: sortedVersions[sortedVersions.length - 1]?.createdAt || new Date(),
      statusProgression: sortedVersions.map((v) => v.status),
      totalChanges: sortedVersions.filter((v) => v.changes.length > 0).length,
    };
  }

  /**
   * Create contract archive
   */
  static createArchive(
    contractId: number,
    archivedBy: string,
    reason: string,
    retentionDays: number = 2555 // 7 years default
  ): ContractArchive {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    return {
      id: `archive_${contractId}_${Date.now()}`,
      contractId,
      archivedAt: new Date(),
      archivedBy,
      reason,
      retentionDays,
      expiresAt,
      metadata: {
        archived: true,
        archiveReason: reason,
        archiveDate: new Date().toISOString(),
      },
    };
  }

  /**
   * Check if archive is expired
   */
  static isArchiveExpired(archive: ContractArchive): boolean {
    return new Date() > archive.expiresAt;
  }

  /**
   * Generate audit trail
   */
  static generateAuditTrail(versions: ContractVersion[]): string {
    const sortedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);

    let trail = `CONTRACT AUDIT TRAIL\n`;
    trail += `${'='.repeat(80)}\n\n`;

    sortedVersions.forEach((version, index) => {
      trail += `Version ${version.versionNumber}\n`;
      trail += `-`.repeat(40) + '\n';
      trail += `Created: ${version.createdAt.toISOString()}\n`;
      trail += `Created By: ${version.createdBy}\n`;
      trail += `Status: ${version.status}\n`;
      trail += `Changes: ${version.changes || 'Initial version'}\n`;

      if (index < sortedVersions.length - 1) {
        const nextVersion = sortedVersions[index + 1];
        const comparison = this.compareVersions(version, nextVersion);
        if (comparison.differences.length > 0) {
          trail += `\nModifications:\n`;
          comparison.differences.forEach((diff) => {
            trail += `  - ${diff.field}: ${JSON.stringify(diff.oldValue)} → ${JSON.stringify(diff.newValue)}\n`;
          });
        }
      }

      trail += '\n';
    });

    return trail;
  }

  /**
   * Generate retention schedule
   */
  static generateRetentionSchedule(archives: ContractArchive[]): {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    schedule: {
      archive: ContractArchive;
      status: 'active' | 'expiring_soon' | 'expired';
      daysUntilExpiration: number;
    }[];
  } {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const schedule = archives.map((archive) => {
      const daysUntilExpiration = Math.ceil(
        (archive.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let status: 'active' | 'expiring_soon' | 'expired';
      if (daysUntilExpiration < 0) {
        status = 'expired';
      } else if (archive.expiresAt <= thirtyDaysFromNow) {
        status = 'expiring_soon';
      } else {
        status = 'active';
      }

      return {
        archive,
        status,
        daysUntilExpiration: Math.max(0, daysUntilExpiration),
      };
    });

    return {
      total: archives.length,
      active: schedule.filter((s) => s.status === 'active').length,
      expiringSoon: schedule.filter((s) => s.status === 'expiring_soon').length,
      expired: schedule.filter((s) => s.status === 'expired').length,
      schedule,
    };
  }

  /**
   * Generate contract lifecycle report
   */
  static generateLifecycleReport(versions: ContractVersion[], archive?: ContractArchive): string {
    const summary = this.generateHistorySummary(versions);
    const sortedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);

    let report = `CONTRACT LIFECYCLE REPORT\n`;
    report += `${'='.repeat(80)}\n\n`;

    report += `Summary:\n`;
    report += `-`.repeat(40) + '\n';
    report += `Total Versions: ${summary.totalVersions}\n`;
    report += `First Created: ${summary.firstCreated.toISOString()}\n`;
    report += `Last Modified: ${summary.lastModified.toISOString()}\n`;
    report += `Total Changes: ${summary.totalChanges}\n`;
    report += `Status Progression: ${summary.statusProgression.join(' → ')}\n\n`;

    report += `Version History:\n`;
    report += `-`.repeat(40) + '\n';
    sortedVersions.forEach((version) => {
      report += `\nVersion ${version.versionNumber} (${version.status})\n`;
      report += `  Created: ${version.createdAt.toISOString()}\n`;
      report += `  By: ${version.createdBy}\n`;
      report += `  Changes: ${version.changes || 'Initial version'}\n`;
    });

    if (archive) {
      report += `\n\nArchival Information:\n`;
      report += `-`.repeat(40) + '\n';
      report += `Archived: ${archive.archivedAt.toISOString()}\n`;
      report += `By: ${archive.archivedBy}\n`;
      report += `Reason: ${archive.reason}\n`;
      report += `Expires: ${archive.expiresAt.toISOString()}\n`;
      report += `Retention Period: ${archive.retentionDays} days\n`;
    }

    return report;
  }

  /**
   * Filter versions by date range
   */
  static filterVersionsByDateRange(
    versions: ContractVersion[],
    startDate: Date,
    endDate: Date
  ): ContractVersion[] {
    return versions.filter((v) => v.createdAt >= startDate && v.createdAt <= endDate);
  }

  /**
   * Filter versions by status
   */
  static filterVersionsByStatus(versions: ContractVersion[], status: ContractVersion['status']): ContractVersion[] {
    return versions.filter((v) => v.status === status);
  }

  /**
   * Get version statistics
   */
  static getVersionStatistics(versions: ContractVersion[]): {
    totalVersions: number;
    byStatus: Record<string, number>;
    averageTimePerVersion: number;
    mostCommonStatus: string;
  } {
    const sortedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);

    const byStatus: Record<string, number> = {};
    sortedVersions.forEach((v) => {
      byStatus[v.status] = (byStatus[v.status] || 0) + 1;
    });

    const timeSpan = sortedVersions[sortedVersions.length - 1]?.createdAt.getTime() - sortedVersions[0]?.createdAt.getTime() || 0;
    const averageTimePerVersion = sortedVersions.length > 1 ? timeSpan / (sortedVersions.length - 1) : 0;

    const mostCommonStatus = Object.entries(byStatus).sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';

    return {
      totalVersions: versions.length,
      byStatus,
      averageTimePerVersion,
      mostCommonStatus,
    };
  }
}
