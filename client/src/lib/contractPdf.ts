import html2pdf from 'html2pdf.js';

interface ContractPdfOptions {
  filename?: string;
  title?: string;
  contractContent: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  signatures?: Array<{
    signerName: string;
    signerRole: 'artist' | 'venue';
    signatureData: string;
    signedAt: Date;
  }>;
}

export async function generateContractPdf(options: ContractPdfOptions): Promise<void> {
  const {
    filename = 'contract.pdf',
    title = 'Performance Agreement & Rider',
    contractContent,
    artistName,
    venueName,
    eventDate,
    signatures = [],
  } = options;

  // Create a container for the PDF content
  const element = document.createElement('div');
  element.style.padding = '20px';
  element.style.fontFamily = 'Arial, sans-serif';
  element.style.lineHeight = '1.6';
  element.style.color = '#333';

  // Build the HTML content
  let htmlContent = `
    <div style="page-break-after: always;">
      <h1 style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        ${title}
      </h1>
      
      <div style="margin-bottom: 20px; font-size: 12px; color: #666;">
        <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Event Date:</strong> ${eventDate}</p>
      </div>

      <div style="margin: 30px 0;">
        ${contractContent}
      </div>
    </div>
  `;

  // Add signature pages if available
  if (signatures.length > 0) {
    htmlContent += `
      <div style="page-break-before: always; padding-top: 40px;">
        <h2 style="text-align: center; margin-bottom: 40px;">Signatures</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px;">
    `;

    signatures.forEach((sig) => {
      htmlContent += `
        <div style="border: 1px solid #ddd; padding: 20px; text-align: center;">
          <div style="margin-bottom: 30px; min-height: 100px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">
            <img src="${sig.signatureData}" style="max-width: 100%; max-height: 100px;" alt="Signature" />
          </div>
          <p style="margin: 10px 0;"><strong>${sig.signerName}</strong></p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">${sig.signerRole === 'artist' ? 'Artist' : 'Venue'}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">Signed: ${sig.signedAt.toLocaleDateString()}</p>
        </div>
      `;
    });

    htmlContent += `
        </div>
      </div>
    `;
  }

  element.innerHTML = htmlContent;

  // PDF generation options
  const opt = {
    margin: 10,
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' },
  };

  // Generate PDF
  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

export async function generateContractPdfBlob(options: ContractPdfOptions): Promise<Blob> {
  const {
    filename = 'contract.pdf',
    title = 'Performance Agreement & Rider',
    contractContent,
    eventDate,
    signatures = [],
  } = options;

  // Create a container for the PDF content
  const element = document.createElement('div');
  element.style.padding = '20px';
  element.style.fontFamily = 'Arial, sans-serif';
  element.style.lineHeight = '1.6';
  element.style.color = '#333';

  // Build the HTML content
  let htmlContent = `
    <div style="page-break-after: always;">
      <h1 style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        ${title}
      </h1>
      
      <div style="margin-bottom: 20px; font-size: 12px; color: #666;">
        <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Event Date:</strong> ${eventDate}</p>
      </div>

      <div style="margin: 30px 0;">
        ${contractContent}
      </div>
    </div>
  `;

  // Add signature pages if available
  if (signatures.length > 0) {
    htmlContent += `
      <div style="page-break-before: always; padding-top: 40px;">
        <h2 style="text-align: center; margin-bottom: 40px;">Signatures</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px;">
    `;

    signatures.forEach((sig) => {
      htmlContent += `
        <div style="border: 1px solid #ddd; padding: 20px; text-align: center;">
          <div style="margin-bottom: 30px; min-height: 100px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">
            <img src="${sig.signatureData}" style="max-width: 100%; max-height: 100px;" alt="Signature" />
          </div>
          <p style="margin: 10px 0;"><strong>${sig.signerName}</strong></p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">${sig.signerRole === 'artist' ? 'Artist' : 'Venue'}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">Signed: ${sig.signedAt.toLocaleDateString()}</p>
        </div>
      `;
    });

    htmlContent += `
        </div>
      </div>
    `;
  }

  element.innerHTML = htmlContent;

  // PDF generation options
  const opt = {
    margin: 10,
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' },
  };

  // Generate PDF and return as blob
  return new Promise((resolve, reject) => {
    html2pdf()
      .set(opt)
      .from(element)
      .toPdf()
      .output('blob')
      .then((blob: Blob) => {
        resolve(blob);
      })
      .catch((error: Error) => {
        console.error('Error generating PDF:', error);
        reject(new Error('Failed to generate PDF'));
      });
  });
}
