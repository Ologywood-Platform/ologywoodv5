import crypto from 'crypto';

interface SignatureData {
  id: string;
  signerName: string;
  signerEmail: string;
  signerRole: 'artist' | 'venue';
  signatureImage: string; // Base64 encoded image
  contractId: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface VerificationResult {
  isValid: boolean;
  signatureHash: string;
  verificationHash: string;
  timestamp: string;
  expiresAt: string;
  tamperDetected: boolean;
  reason?: string;
}

interface SignatureCertificate {
  signatureId: string;
  contractId: string;
  signerName: string;
  signerEmail: string;
  signerRole: string;
  signatureHash: string;
  verificationHash: string;
  timestamp: string;
  expiresAt: string;
  issuedAt: string;
  certificateNumber: string;
}

class SignatureVerificationService {
  private readonly SIGNATURE_VALIDITY_DAYS = 365; // Signatures valid for 1 year
  private readonly HASH_ALGORITHM = 'sha256';
  private readonly SECRET_KEY = process.env.SIGNATURE_SECRET_KEY || 'ologywood-signature-key';

  /**
   * Generate a cryptographic hash of the signature image
   */
  private generateSignatureHash(signatureImage: string): string {
    return crypto
      .createHash(this.HASH_ALGORITHM)
      .update(signatureImage)
      .digest('hex');
  }

  /**
   * Generate a verification hash that includes timestamp and metadata
   */
  private generateVerificationHash(
    signatureHash: string,
    timestamp: string,
    signerEmail: string,
    contractId: string
  ): string {
    const data = `${signatureHash}|${timestamp}|${signerEmail}|${contractId}|${this.SECRET_KEY}`;
    return crypto
      .createHmac(this.HASH_ALGORITHM, this.SECRET_KEY)
      .update(data)
      .digest('hex');
  }

  /**
   * Generate a unique certificate number for the signature
   */
  private generateCertificateNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `SIG-${timestamp}-${random}`;
  }

  /**
   * Capture and verify a signature
   */
  async captureSignature(data: SignatureData): Promise<SignatureCertificate> {
    try {
      // Generate hashes
      const signatureHash = this.generateSignatureHash(data.signatureImage);
      const verificationHash = this.generateVerificationHash(
        signatureHash,
        data.timestamp,
        data.signerEmail,
        data.contractId
      );

      // Calculate expiration date
      const expiresAt = new Date(Date.now() + this.SIGNATURE_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

      // Generate certificate
      const certificate: SignatureCertificate = {
        signatureId: data.id,
        contractId: data.contractId,
        signerName: data.signerName,
        signerEmail: data.signerEmail,
        signerRole: data.signerRole,
        signatureHash,
        verificationHash,
        timestamp: data.timestamp,
        expiresAt: expiresAt.toISOString(),
        issuedAt: new Date().toISOString(),
        certificateNumber: this.generateCertificateNumber(),
      };

      console.log(`[SignatureVerificationService] Signature captured for ${data.signerName} (${data.signerRole})`);
      console.log(`[SignatureVerificationService] Certificate: ${certificate.certificateNumber}`);

      return certificate;
    } catch (error) {
      console.error('[SignatureVerificationService] Error capturing signature:', error);
      throw new Error('Failed to capture signature');
    }
  }

  /**
   * Verify a previously captured signature
   */
  async verifySignature(
    certificate: SignatureCertificate,
    signatureImage: string
  ): Promise<VerificationResult> {
    try {
      const currentTime = new Date();
      const expiresAt = new Date(certificate.expiresAt);

      // Check if signature has expired
      if (currentTime > expiresAt) {
        return {
          isValid: false,
          signatureHash: certificate.signatureHash,
          verificationHash: certificate.verificationHash,
          timestamp: certificate.timestamp,
          expiresAt: certificate.expiresAt,
          tamperDetected: false,
          reason: 'Signature has expired',
        };
      }

      // Generate hash of provided signature image
      const providedSignatureHash = this.generateSignatureHash(signatureImage);

      // Compare hashes
      const hashesMatch = providedSignatureHash === certificate.signatureHash;

      // Verify the verification hash
      const expectedVerificationHash = this.generateVerificationHash(
        certificate.signatureHash,
        certificate.timestamp,
        certificate.signerEmail,
        certificate.contractId
      );

      const verificationHashValid = expectedVerificationHash === certificate.verificationHash;

      const result: VerificationResult = {
        isValid: hashesMatch && verificationHashValid,
        signatureHash: certificate.signatureHash,
        verificationHash: certificate.verificationHash,
        timestamp: certificate.timestamp,
        expiresAt: certificate.expiresAt,
        tamperDetected: !hashesMatch || !verificationHashValid,
      };

      if (!result.isValid) {
        result.reason = !hashesMatch
          ? 'Signature image does not match stored signature'
          : 'Verification hash mismatch - possible tampering detected';
      }

      console.log(
        `[SignatureVerificationService] Signature verification: ${result.isValid ? 'VALID' : 'INVALID'}`
      );

      return result;
    } catch (error) {
      console.error('[SignatureVerificationService] Error verifying signature:', error);
      throw new Error('Failed to verify signature');
    }
  }

  /**
   * Batch verify multiple signatures
   */
  async batchVerifySignatures(
    certificates: SignatureCertificate[],
    signatureImages: Record<string, string>
  ): Promise<Record<string, VerificationResult>> {
    const results: Record<string, VerificationResult> = {};

    for (const certificate of certificates) {
      const signatureImage = signatureImages[certificate.signatureId];
      if (!signatureImage) {
        results[certificate.signatureId] = {
          isValid: false,
          signatureHash: certificate.signatureHash,
          verificationHash: certificate.verificationHash,
          timestamp: certificate.timestamp,
          expiresAt: certificate.expiresAt,
          tamperDetected: false,
          reason: 'Signature image not provided',
        };
        continue;
      }

      results[certificate.signatureId] = await this.verifySignature(certificate, signatureImage);
    }

    return results;
  }

  /**
   * Generate a digital certificate for display/printing
   */
  generateDigitalCertificate(certificate: SignatureCertificate, verificationResult: VerificationResult): string {
    const issuedDate = new Date(certificate.issuedAt).toLocaleDateString();
    const expiresDate = new Date(certificate.expiresAt).toLocaleDateString();
    const status = verificationResult.isValid ? 'VERIFIED' : 'INVALID';
    const statusColor = verificationResult.isValid ? '#10b981' : '#ef4444';

    return `
    <div style="
      border: 2px solid ${statusColor};
      border-radius: 8px;
      padding: 24px;
      background: white;
      font-family: 'Courier New', monospace;
      max-width: 600px;
      margin: 20px auto;
    ">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: ${statusColor}; margin: 0;">DIGITAL SIGNATURE CERTIFICATE</h2>
        <p style="color: #6b7280; margin: 8px 0 0 0;">Ologywood Artist Booking Platform</p>
      </div>

      <div style="border-top: 2px solid #e5e7eb; border-bottom: 2px solid #e5e7eb; padding: 16px 0; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Certificate Number:</strong> ${certificate.certificateNumber}</p>
        <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status}</span></p>
        <p style="margin: 8px 0;"><strong>Signer:</strong> ${certificate.signerName}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${certificate.signerEmail}</p>
        <p style="margin: 8px 0;"><strong>Role:</strong> ${certificate.signerRole}</p>
      </div>

      <div style="margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Contract ID:</strong> ${certificate.contractId}</p>
        <p style="margin: 8px 0;"><strong>Signed:</strong> ${certificate.timestamp}</p>
        <p style="margin: 8px 0;"><strong>Issued:</strong> ${issuedDate}</p>
        <p style="margin: 8px 0;"><strong>Expires:</strong> ${expiresDate}</p>
      </div>

      <div style="background: #f9fafb; padding: 12px; border-radius: 6px; margin: 20px 0; word-break: break-all;">
        <p style="margin: 0; font-size: 11px; color: #6b7280;">
          <strong>Signature Hash:</strong><br/>
          ${certificate.signatureHash}
        </p>
      </div>

      <div style="background: #f9fafb; padding: 12px; border-radius: 6px; margin: 20px 0; word-break: break-all;">
        <p style="margin: 0; font-size: 11px; color: #6b7280;">
          <strong>Verification Hash:</strong><br/>
          ${certificate.verificationHash}
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          This certificate verifies the authenticity and integrity of the digital signature.
          <br/>
          Generated by Ologywood Signature Verification System
        </p>
      </div>
    </div>
    `;
  }

  /**
   * Check if a signature is approaching expiration
   */
  isSignatureExpiringSoon(certificate: SignatureCertificate, daysThreshold: number = 30): boolean {
    const expiresAt = new Date(certificate.expiresAt);
    const thresholdDate = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000);
    return expiresAt <= thresholdDate;
  }

  /**
   * Generate a signature audit trail entry
   */
  generateAuditTrailEntry(
    certificate: SignatureCertificate,
    action: 'created' | 'verified' | 'expired' | 'revoked',
    details?: Record<string, any>
  ): string {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      action,
      certificateNumber: certificate.certificateNumber,
      signerName: certificate.signerName,
      signerEmail: certificate.signerEmail,
      contractId: certificate.contractId,
      details: details || {},
    };

    return JSON.stringify(entry);
  }
}

export const signatureVerificationService = new SignatureVerificationService();
