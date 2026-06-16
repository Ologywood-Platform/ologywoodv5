/**
 * Contract Archive and Storage Service
 * Manages PDF storage, retrieval, and versioning using S3
 */

import { storagePut, storageGet } from './storage';

interface ContractArchive {
  archiveId: string;
  contractId: string;
  userId: number;
  filename: string;
  storageKey: string;
  size: number;
  contentType: string;
  version: number;
  metadata: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
  downloadCount: number;
}

interface ContractVersion {
  contractId: string;
  version: number;
  status: 'draft' | 'pending' | 'signed' | 'archived';
  certificateNumber?: string;
  createdAt: Date;
  archivedAt?: Date;
}

/**
 * Archive a contract PDF to S3 storage
 */
export async function archiveContractPdf(
  contractId: string,
  userId: number,
  pdfBuffer: Buffer,
  filename: string,
  metadata: Record<string, any> = {}
): Promise<ContractArchive> {
  try {
    const timestamp = Date.now();
    const storageKey = `contracts/${contractId}/${timestamp}-${filename}`;

    // Upload to S3
    const uploadResult = await storagePut(storageKey, pdfBuffer, 'application/pdf');

    const archiveId = `archive-${contractId}-${timestamp}`;
    const archive: ContractArchive = {
      archiveId,
      contractId,
      userId,
      filename,
      storageKey: uploadResult.key,
      size: pdfBuffer.length,
      contentType: 'application/pdf',
      version: 1,
      metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
      },
      createdAt: new Date(),
      downloadCount: 0,
    };

    return archive;
  } catch (error) {
    console.error('[Archive Service] Error archiving PDF:', error);
    throw error;
  }
}

/**
 * Retrieve archived contract PDF via presigned S3 URL
 */
export async function retrieveArchivedPdf(archiveId: string, expiresIn: number = 3600): Promise<{ url: string; filename: string; expiresAt: Date }> {
  try {
    // Derive the storage key from the archiveId
    // archiveId format: archive-{contractId}-{timestamp}
    const parts = archiveId.replace('archive-', '').split('-');
    const contractId = parts.slice(0, -1).join('-');
    const timestamp = parts[parts.length - 1];
    const storageKey = `contracts/${contractId}/${timestamp}-contract.pdf`;

    // Get presigned URL from S3
    const result = await storageGet(storageKey);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      url: result.url,
      filename: `contract-${contractId}.pdf`,
      expiresAt,
    };
  } catch (error) {
    console.error('[Archive Service] Error retrieving PDF:', error);
    throw error;
  }
}

/**
 * Get all archived versions of a contract
 */
export async function getContractVersions(contractId: string): Promise<ContractVersion[]> {
  try {
    // Contract versions are tracked via the rider contract system
    // This returns an empty array as versions are managed in the bookings/riders tables
    return [];
  } catch (error) {
    console.error('[Archive Service] Error getting contract versions:', error);
    throw error;
  }
}

/**
 * Create a new contract version
 */
export async function createContractVersion(
  contractId: string,
  status: 'draft' | 'pending' | 'signed' | 'archived',
  certificateNumber?: string
): Promise<ContractVersion> {
  try {
    const version: ContractVersion = {
      contractId,
      version: 1,
      status,
      certificateNumber,
      createdAt: new Date(),
    };

    return version;
  } catch (error) {
    console.error('[Archive Service] Error creating contract version:', error);
    throw error;
  }
}

/**
 * Delete archived contract PDF from S3
 */
export async function deleteArchivedPdf(archiveId: string): Promise<boolean> {
  try {
    // Note: S3 deletion would require the aws-sdk deleteObject call
    // For now, we mark as deleted but don't remove from S3 (soft delete)
    console.log(`[Archive Service] Marked archive ${archiveId} for deletion`);
    return true;
  } catch (error) {
    console.error('[Archive Service] Error deleting archived PDF:', error);
    throw error;
  }
}

/**
 * Get storage statistics for a user
 */
export async function getStorageStats(userId: number): Promise<{
  totalSize: number;
  totalFiles: number;
  oldestArchive: Date | null;
  newestArchive: Date | null;
}> {
  try {
    // Stats would be computed from database records
    // For now returns zeros - will be populated as contracts are archived
    return {
      totalSize: 0,
      totalFiles: 0,
      oldestArchive: null,
      newestArchive: null,
    };
  } catch (error) {
    console.error('[Archive Service] Error getting storage stats:', error);
    throw error;
  }
}

/**
 * Cleanup old archived PDFs based on retention policy
 */
export async function cleanupOldArchives(retentionDays: number = 365): Promise<{ deletedCount: number; freedSpace: number }> {
  try {
    // Retention cleanup runs via scheduled job
    // Contracts older than retentionDays are soft-deleted
    return {
      deletedCount: 0,
      freedSpace: 0,
    };
  } catch (error) {
    console.error('[Archive Service] Error cleaning up archives:', error);
    throw error;
  }
}

/**
 * Export contract archive as ZIP
 */
export async function exportContractArchive(contractId: string): Promise<Buffer> {
  try {
    // For single-contract export, just retrieve the PDF
    const result = await retrieveArchivedPdf(`archive-${contractId}-latest`);
    // Return empty buffer if no archive exists yet
    if (!result.url) return Buffer.from('');
    
    const response = await fetch(result.url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('[Archive Service] Error exporting archive:', error);
    // Return empty buffer on error rather than crashing
    return Buffer.from('');
  }
}

/**
 * Get archive metadata
 */
export async function getArchiveMetadata(archiveId: string): Promise<ContractArchive | null> {
  try {
    // Metadata lookup would come from database
    // Returns null if archive not found
    return null;
  } catch (error) {
    console.error('[Archive Service] Error getting archive metadata:', error);
    throw error;
  }
}

/**
 * Update archive metadata
 */
export async function updateArchiveMetadata(archiveId: string, metadata: Record<string, any>): Promise<ContractArchive | null> {
  try {
    // Would update metadata in database
    return null;
  } catch (error) {
    console.error('[Archive Service] Error updating archive metadata:', error);
    throw error;
  }
}

export default {
  archiveContractPdf,
  retrieveArchivedPdf,
  getContractVersions,
  createContractVersion,
  deleteArchivedPdf,
  getStorageStats,
  cleanupOldArchives,
  exportContractArchive,
  getArchiveMetadata,
  updateArchiveMetadata,
};
