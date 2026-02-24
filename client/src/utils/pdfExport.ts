import html2pdf from 'html2pdf.js';

interface RiderTemplate {
  id: number;
  templateName: string;
  technicalRequirements?: {
    stageWidth?: string;
    stageDepth?: string;
    soundSystem?: string;
    lighting?: string;
    backline?: string;
    other?: string;
  } | null;
  hospitalityRequirements?: {
    dressingRooms?: string;
    catering?: string;
    beverages?: string;
    accommodation?: string;
    other?: string;
  } | null;
  financialTerms?: {
    depositAmount?: string;
    paymentMethod?: string;
    cancellationPolicy?: string;
    other?: string;
  } | null;
}

interface SignatureInfo {
  signerRole: string;
  signerName: string;
  signatureData: string;
  signedAt: string;
}

export const generateRiderPDF = (template: RiderTemplate, signatures?: SignatureInfo[]) => {
  const signatureSection = signatures && signatures.length > 0
    ? `
      <div class="section" style="margin-top: 40px; border-top: 3px solid #1e40af; padding-top: 20px;">
        <div class="section-title">Digital Signatures</div>
        <div style="display: flex; gap: 40px; margin-top: 15px;">
          ${signatures.map(sig => `
            <div style="flex: 1; padding: 15px; border: 2px solid ${sig.signerRole === 'artist' ? '#6c5ce7' : '#00b894'}; border-radius: 8px;">
              <p style="font-size: 11px; font-weight: 700; color: ${sig.signerRole === 'artist' ? '#6c5ce7' : '#00b894'}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                ${sig.signerRole === 'artist' ? 'Artist' : 'Venue'} Signature
              </p>
              <img src="${sig.signatureData}" style="max-height: 60px; max-width: 200px; margin-bottom: 10px; display: block;" />
              <p style="font-size: 14px; font-weight: 600; margin: 4px 0;">${sig.signerName}</p>
              <p style="font-size: 11px; color: #666;">Signed: ${new Date(sig.signedAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `
    : `
      <div class="section" style="margin-top: 40px; border-top: 3px solid #1e40af; padding-top: 20px;">
        <div class="section-title">Signatures</div>
        <div style="display: flex; gap: 40px; margin-top: 15px;">
          <div style="flex: 1;">
            <p style="font-size: 12px; font-weight: 600; color: #666; margin-bottom: 40px;">Artist Signature</p>
            <div style="border-bottom: 2px solid #333; margin-bottom: 8px;"></div>
            <p style="font-size: 11px; color: #999;">Name: ____________________</p>
            <p style="font-size: 11px; color: #999; margin-top: 4px;">Date: ____________________</p>
          </div>
          <div style="flex: 1;">
            <p style="font-size: 12px; font-weight: 600; color: #666; margin-bottom: 40px;">Venue Signature</p>
            <div style="border-bottom: 2px solid #333; margin-bottom: 8px;"></div>
            <p style="font-size: 11px; color: #999;">Name: ____________________</p>
            <p style="font-size: 11px; color: #999; margin-top: 4px;">Date: ____________________</p>
          </div>
        </div>
      </div>
    `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${template.templateName} - Artist Rider</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #1e40af;
            font-size: 28px;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
          }
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .section-title {
            background-color: #1e40af;
            color: white;
            padding: 10px 15px;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 4px;
          }
          .section-content {
            padding-left: 15px;
          }
          .item {
            margin-bottom: 12px;
          }
          .item-label {
            font-weight: 600;
            color: #1e40af;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .item-value {
            color: #333;
            margin-top: 4px;
            padding-left: 10px;
            border-left: 2px solid #e5e7eb;
            font-size: 14px;
          }
          .empty-value {
            color: #999;
            font-style: italic;
            font-size: 13px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${template.templateName}</h1>
            <p>Artist Performance Rider</p>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          ${template.technicalRequirements ? `
            <div class="section">
              <div class="section-title">Technical Requirements</div>
              <div class="section-content">
                ${template.technicalRequirements.stageWidth ? `
                  <div class="item">
                    <div class="item-label">Stage Width</div>
                    <div class="item-value">${template.technicalRequirements.stageWidth}</div>
                  </div>
                ` : ''}
                ${template.technicalRequirements.stageDepth ? `
                  <div class="item">
                    <div class="item-label">Stage Depth</div>
                    <div class="item-value">${template.technicalRequirements.stageDepth}</div>
                  </div>
                ` : ''}
                ${template.technicalRequirements.soundSystem ? `
                  <div class="item">
                    <div class="item-label">Sound System</div>
                    <div class="item-value">${template.technicalRequirements.soundSystem}</div>
                  </div>
                ` : ''}
                ${template.technicalRequirements.lighting ? `
                  <div class="item">
                    <div class="item-label">Lighting</div>
                    <div class="item-value">${template.technicalRequirements.lighting}</div>
                  </div>
                ` : ''}
                ${template.technicalRequirements.backline ? `
                  <div class="item">
                    <div class="item-label">Backline</div>
                    <div class="item-value">${template.technicalRequirements.backline}</div>
                  </div>
                ` : ''}
                ${template.technicalRequirements.other ? `
                  <div class="item">
                    <div class="item-label">Other Requirements</div>
                    <div class="item-value">${template.technicalRequirements.other}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${template.hospitalityRequirements ? `
            <div class="section">
              <div class="section-title">Hospitality Requirements</div>
              <div class="section-content">
                ${template.hospitalityRequirements.dressingRooms ? `
                  <div class="item">
                    <div class="item-label">Dressing Rooms</div>
                    <div class="item-value">${template.hospitalityRequirements.dressingRooms}</div>
                  </div>
                ` : ''}
                ${template.hospitalityRequirements.catering ? `
                  <div class="item">
                    <div class="item-label">Catering</div>
                    <div class="item-value">${template.hospitalityRequirements.catering}</div>
                  </div>
                ` : ''}
                ${template.hospitalityRequirements.beverages ? `
                  <div class="item">
                    <div class="item-label">Beverages</div>
                    <div class="item-value">${template.hospitalityRequirements.beverages}</div>
                  </div>
                ` : ''}
                ${template.hospitalityRequirements.accommodation ? `
                  <div class="item">
                    <div class="item-label">Accommodation</div>
                    <div class="item-value">${template.hospitalityRequirements.accommodation}</div>
                  </div>
                ` : ''}
                ${template.hospitalityRequirements.other ? `
                  <div class="item">
                    <div class="item-label">Other Requirements</div>
                    <div class="item-value">${template.hospitalityRequirements.other}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${template.financialTerms ? `
            <div class="section">
              <div class="section-title">Financial Terms</div>
              <div class="section-content">
                ${template.financialTerms.depositAmount ? `
                  <div class="item">
                    <div class="item-label">Deposit Amount</div>
                    <div class="item-value">${template.financialTerms.depositAmount}</div>
                  </div>
                ` : ''}
                ${template.financialTerms.paymentMethod ? `
                  <div class="item">
                    <div class="item-label">Payment Method</div>
                    <div class="item-value">${template.financialTerms.paymentMethod}</div>
                  </div>
                ` : ''}
                ${template.financialTerms.cancellationPolicy ? `
                  <div class="item">
                    <div class="item-label">Cancellation Policy</div>
                    <div class="item-value">${template.financialTerms.cancellationPolicy}</div>
                  </div>
                ` : ''}
                ${template.financialTerms.other ? `
                  <div class="item">
                    <div class="item-label">Other Terms</div>
                    <div class="item-value">${template.financialTerms.other}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${signatureSection}

          <div class="footer">
            <p>This rider is a professional specification document for event planning and coordination.</p>
            <p>Generated by Ologywood - Artist Booking Platform</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const element = document.createElement('div');
  element.innerHTML = htmlContent;

  const options = {
    margin: 10,
    filename: `${template.templateName.replace(/\s+/g, '_')}_Rider.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
  };

  html2pdf().set(options as any).from(element).save();
};
