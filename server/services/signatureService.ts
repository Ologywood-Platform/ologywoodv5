/**
 * Digital Signature Service
 * Handles e-signature workflows and integrations
 * Supports multiple providers: local storage, DocuSign (future), HelloSign (future)
 */

export interface SignatureRequest {
  id: string;
  contractId: number;
  signerEmail: string;
  signerName: string;
  signerRole: 'artist' | 'venue';
  status: 'pending' | 'signed' | 'declined' | 'expired';
  signatureUrl?: string;
  signedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignatureData {
  type: 'image' | 'text' | 'initials';
  data: string; // Base64 encoded image or text
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditTrailEntry {
  id: string;
  contractId: number;
  action: 'created' | 'sent' | 'viewed' | 'signed' | 'declined' | 'expired' | 'archived';
  actor: string;
  details: Record<string, any>;
  timestamp: Date;
}

export class SignatureService {
  /**
   * Generate a unique signature request ID
   */
  static generateRequestId(): string {
    return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new signature request
   */
  static createSignatureRequest(
    contractId: number,
    signerEmail: string,
    signerName: string,
    signerRole: 'artist' | 'venue',
    expirationDays: number = 30
  ): SignatureRequest {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    return {
      id: this.generateRequestId(),
      contractId,
      signerEmail,
      signerName,
      signerRole,
      status: 'pending',
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Validate signature request expiration
   */
  static isSignatureRequestExpired(request: SignatureRequest): boolean {
    return new Date() > request.expiresAt;
  }

  /**
   * Generate signature verification token
   */
  static generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Validate signature data
   */
  static validateSignatureData(signature: SignatureData): boolean {
    if (!signature.data || !signature.timestamp) {
      return false;
    }

    if (signature.type === 'image') {
      // Validate base64 image
      return /^data:image\/(png|jpg|jpeg|gif);base64,/.test(signature.data);
    }

    if (signature.type === 'text') {
      // Validate text signature
      return signature.data.length > 0 && signature.data.length < 500;
    }

    if (signature.type === 'initials') {
      // Validate initials (2-4 characters)
      return /^[a-zA-Z]{2,4}$/.test(signature.data);
    }

    return false;
  }

  /**
   * Create audit trail entry
   */
  static createAuditEntry(
    contractId: number,
    action: AuditTrailEntry['action'],
    actor: string,
    details: Record<string, any> = {}
  ): AuditTrailEntry {
    return {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contractId,
      action,
      actor,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    };
  }

  /**
   * Generate signature summary
   */
  static generateSignatureSummary(requests: SignatureRequest[]): {
    total: number;
    signed: number;
    pending: number;
    declined: number;
    expired: number;
  } {
    return {
      total: requests.length,
      signed: requests.filter((r) => r.status === 'signed').length,
      pending: requests.filter((r) => r.status === 'pending').length,
      declined: requests.filter((r) => r.status === 'declined').length,
      expired: requests.filter((r) => r.status === 'expired').length,
    };
  }

  /**
   * Check if contract is fully signed (both parties)
   */
  static isContractFullySigned(requests: SignatureRequest[]): boolean {
    const artistSigned = requests.some((r) => r.signerRole === 'artist' && r.status === 'signed');
    const venueSigned = requests.some((r) => r.signerRole === 'venue' && r.status === 'signed');
    return artistSigned && venueSigned;
  }

  /**
   * Generate signature certificate
   */
  static generateSignatureCertificate(
    contractId: number,
    signerName: string,
    signedAt: Date,
    signatureType: string
  ): string {
    const cert = `
CERTIFICATE OF SIGNATURE
========================

Contract ID: ${contractId}
Signer: ${signerName}
Signed At: ${signedAt.toISOString()}
Signature Type: ${signatureType}
Certificate ID: cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}

This certifies that the above-named individual has digitally signed
the associated contract on the date and time specified above.

Generated: ${new Date().toISOString()}
    `.trim();

    return cert;
  }

  /**
   * Format signature request for email
   */
  static formatSignatureRequestEmail(request: SignatureRequest, contractLink: string): {
    subject: string;
    body: string;
  } {
    const daysRemaining = Math.ceil((request.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      subject: `Please Sign Contract - ${request.contractId}`,
      body: `
Hello ${request.signerName},

You have been requested to sign a contract. Please review and sign it at your earliest convenience.

Contract Link: ${contractLink}
Expires In: ${daysRemaining} days

If you have any questions, please contact the other party.

Best regards,
Ologywood Platform
      `.trim(),
    };
  }

  /**
   * Generate signature status report
   */
  static generateStatusReport(requests: SignatureRequest[]): string {
    const summary = this.generateSignatureSummary(requests);
    const fullySignedStatus = this.isContractFullySigned(requests) ? 'FULLY SIGNED' : 'PENDING';

    let report = `
SIGNATURE STATUS REPORT
=======================

Contract Status: ${fullySignedStatus}
Generated: ${new Date().toISOString()}

Summary:
- Total Signature Requests: ${summary.total}
- Signed: ${summary.signed}
- Pending: ${summary.pending}
- Declined: ${summary.declined}
- Expired: ${summary.expired}

Details:
    `.trim();

    requests.forEach((req, idx) => {
      report += `\n\n${idx + 1}. ${req.signerName} (${req.signerRole})
   Email: ${req.signerEmail}
   Status: ${req.status}
   Expires: ${req.expiresAt.toISOString()}`;

      if (req.signedAt) {
        report += `\n   Signed: ${req.signedAt.toISOString()}`;
      }
    });

    return report;
  }
}

/**
 * Signature Request Builder - Fluent API for creating signature requests
 */
export class SignatureRequestBuilder {
  private requests: SignatureRequest[] = [];

  addArtistSignature(
    contractId: number,
    artistEmail: string,
    artistName: string,
    expirationDays?: number
  ): this {
    const request = SignatureService.createSignatureRequest(
      contractId,
      artistEmail,
      artistName,
      'artist',
      expirationDays
    );
    this.requests.push(request);
    return this;
  }

  addVenueSignature(
    contractId: number,
    venueEmail: string,
    venueName: string,
    expirationDays?: number
  ): this {
    const request = SignatureService.createSignatureRequest(
      contractId,
      venueEmail,
      venueName,
      'venue',
      expirationDays
    );
    this.requests.push(request);
    return this;
  }

  build(): SignatureRequest[] {
    return this.requests;
  }

  getArtistRequest(): SignatureRequest | undefined {
    return this.requests.find((r) => r.signerRole === 'artist');
  }

  getVenueRequest(): SignatureRequest | undefined {
    return this.requests.find((r) => r.signerRole === 'venue');
  }
}
