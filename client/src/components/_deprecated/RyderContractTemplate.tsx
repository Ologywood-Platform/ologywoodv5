import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface RyderContractTemplateProps {
  artistName: string;
  venueName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  totalFee: number;
  depositAmount: number;
  riderData?: {
    technical?: Record<string, string>;
    hospitality?: Record<string, string>;
    financial?: Record<string, string>;
  };
  onGenerate?: (contractContent: string) => void;
}

export function RyderContractTemplate({
  artistName,
  venueName,
  eventDate,
  eventTime,
  eventLocation,
  totalFee,
  depositAmount,
  riderData,
  onGenerate,
}: RyderContractTemplateProps) {
  const [customTerms, setCustomTerms] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('standard');

  const generateContractContent = () => {
    const contractHTML = `
      <div class="contract-document">
        <h1 style="text-align: center; margin-bottom: 30px;">PERFORMANCE AGREEMENT & RIDER</h1>
        
        <section class="contract-section">
          <h2>1. PARTIES</h2>
          <p>
            This Performance Agreement ("Agreement") is entered into between:
          </p>
          <ul>
            <li><strong>ARTIST:</strong> ${artistName}</li>
            <li><strong>VENUE/PROMOTER:</strong> ${venueName}</li>
          </ul>
        </section>

        <section class="contract-section">
          <h2>2. EVENT DETAILS</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Event Date:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${eventDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Event Time:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${eventTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Venue Location:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${eventLocation}</td>
            </tr>
          </table>
        </section>

        <section class="contract-section">
          <h2>3. FINANCIAL TERMS</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Performance Fee:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">$${totalFee.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Deposit Required:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">$${depositAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Balance Due:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">$${(totalFee - depositAmount).toFixed(2)}</td>
            </tr>
          </table>
          <p style="margin-top: 12px;">
            <strong>Payment Schedule:</strong> Deposit due upon booking confirmation. Balance due 7 days prior to event date.
          </p>
        </section>

        <section class="contract-section">
          <h2>4. TECHNICAL REQUIREMENTS</h2>
          ${riderData?.technical ? `
            <ul>
              ${Object.entries(riderData.technical)
                .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
                .join('')}
            </ul>
          ` : '<p>Standard sound and lighting setup as agreed upon.</p>'}
        </section>

        <section class="contract-section">
          <h2>5. HOSPITALITY REQUIREMENTS</h2>
          ${riderData?.hospitality ? `
            <ul>
              ${Object.entries(riderData.hospitality)
                .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
                .join('')}
            </ul>
          ` : '<p>Standard hospitality as agreed upon.</p>'}
        </section>

        <section class="contract-section">
          <h2>6. CANCELLATION POLICY</h2>
          ${cancellationPolicy === 'standard' ? `
            <ul>
              <li><strong>Cancellation by Venue (more than 30 days before):</strong> Full refund of deposit</li>
              <li><strong>Cancellation by Venue (15-30 days before):</strong> 50% of deposit retained</li>
              <li><strong>Cancellation by Venue (less than 15 days before):</strong> Full performance fee retained</li>
              <li><strong>Cancellation by Artist:</strong> Full refund of deposit, artist remains available for rescheduling</li>
            </ul>
          ` : `
            <p>${cancellationPolicy}</p>
          `}
        </section>

        <section class="contract-section">
          <h2>7. SOUND CHECK & SETUP</h2>
          <p>
            Venue shall provide a minimum of 60 minutes for sound check and setup prior to performance start time.
            Artist shall be provided access to venue at least 90 minutes before performance.
          </p>
        </section>

        <section class="contract-section">
          <h2>8. PERFORMANCE DURATION</h2>
          <p>
            Artist agrees to perform a minimum of 60 minutes of music. Performance may be extended at artist's discretion.
          </p>
        </section>

        <section class="contract-section">
          <h2>9. ADDITIONAL TERMS & CONDITIONS</h2>
          ${customTerms ? `<p>${customTerms}</p>` : '<p>No additional terms specified.</p>'}
        </section>

        <section class="contract-section">
          <h2>10. SIGNATURES</h2>
          <div style="margin-top: 40px;">
            <div style="margin-bottom: 40px;">
              <p><strong>ARTIST:</strong> ${artistName}</p>
              <div style="border-bottom: 1px solid #000; width: 300px; margin: 20px 0;"></div>
              <p style="font-size: 12px;">Signature</p>
              <div style="border-bottom: 1px solid #000; width: 300px; margin: 20px 0;"></div>
              <p style="font-size: 12px;">Date</p>
            </div>

            <div>
              <p><strong>VENUE/PROMOTER:</strong> ${venueName}</p>
              <div style="border-bottom: 1px solid #000; width: 300px; margin: 20px 0;"></div>
              <p style="font-size: 12px;">Authorized Signature</p>
              <div style="border-bottom: 1px solid #000; width: 300px; margin: 20px 0;"></div>
              <p style="font-size: 12px;">Date</p>
            </div>
          </div>
        </section>
      </div>
    `;

    onGenerate?.(contractHTML);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Contract Customization</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Cancellation Policy</label>
            <select
              value={cancellationPolicy}
              onChange={(e) => setCancellationPolicy(e.currentTarget.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="standard">Standard Policy (30/15 day tiers)</option>
              <option value="flexible">Flexible Policy (full refund up to 7 days)</option>
              <option value="strict">Strict Policy (no refunds within 60 days)</option>
              <option value="custom">Custom Policy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Additional Terms & Conditions</label>
            <Textarea
              value={customTerms}
              onChange={(e) => setCustomTerms(e.currentTarget.value)}
              placeholder="Add any additional terms, special requirements, or conditions..."
              rows={4}
            />
          </div>

          <Button
            onClick={generateContractContent}
            className="w-full bg-primary text-white"
          >
            Generate Contract
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-blue-50">
        <h3 className="text-lg font-semibold mb-4">Contract Preview</h3>
        <div className="bg-white p-6 rounded-lg border max-h-96 overflow-y-auto">
          <div className="contract-document">
            <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }}>
              PERFORMANCE AGREEMENT & RIDER
            </h1>

            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Event Details</h2>
              <p><strong>Artist:</strong> {artistName}</p>
              <p><strong>Venue:</strong> {venueName}</p>
              <p><strong>Date:</strong> {eventDate} at {eventTime}</p>
              <p><strong>Location:</strong> {eventLocation}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Financial Terms</h2>
              <p><strong>Total Fee:</strong> ${totalFee.toFixed(2)}</p>
              <p><strong>Deposit:</strong> ${depositAmount.toFixed(2)}</p>
              <p><strong>Balance Due:</strong> ${(totalFee - depositAmount).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
