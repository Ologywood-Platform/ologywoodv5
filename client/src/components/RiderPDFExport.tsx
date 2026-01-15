import { Button } from './ui/button';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

interface RiderTemplate {
  id: number;
  templateName: string;
  description?: string | null;
  genre?: string | null;
  performanceType?: string | null;
  performanceDuration?: number | null;
  setupTimeRequired?: number | null;
  soundcheckTimeRequired?: number | null;
  teardownTimeRequired?: number | null;
  numberOfPerformers?: number | null;
  
  paSystemRequired?: boolean | null;
  microphoneType?: string | null;
  monitorMixRequired?: boolean | null;
  diBoxesNeeded?: number | null;
  audioInterface?: string | null;
  lightingRequired?: boolean | null;
  lightingType?: string | null;
  specialEffects?: string | null;
  stageDimensions?: string | null;
  stageHeight?: number | null;
  backdropRequired?: boolean | null;
  backdropDetails?: string | null;
  bringingOwnEquipment?: boolean | null;
  equipmentList?: string | null;
  powerRequirements?: string | null;
  backupEquipment?: string | null;
  
  dressingRoomRequired?: boolean | null;
  roomTemperature?: string | null;
  furnitureNeeded?: any;
  amenities?: any;
  cateringProvided?: boolean | null;
  dietaryRestrictions?: any;
  specificDietaryNeeds?: string | null;
  beverages?: any;
  mealTiming?: string | null;
  parkingRequired?: boolean | null;
  parkingType?: string | null;
  loadInAccess?: string | null;
  accessibleEntrance?: boolean | null;
  
  travelProvided?: boolean | null;
  travelMethod?: string | null;
  accommodationProvided?: boolean | null;
  hotelRequirements?: string | null;
  numberOfRooms?: number | null;
  checkInCheckOut?: string | null;
  groundTransportation?: string | null;
  
  merchandiseSales?: boolean | null;
  merchandiseCut?: number | null;
  photographyAllowed?: boolean | null;
  videoRecordingAllowed?: boolean | null;
  socialMediaPermission?: boolean | null;
  broadcastingRights?: boolean | null;
  promotionalMaterials?: string | null;
  
  specialRequests?: string | null;
  emergencyContact?: string | null;
  additionalNotes?: string | null;
  artistId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RiderPDFExportProps {
  template: RiderTemplate;
  artistName?: string;
  onExportStart?: () => void;
  onExportComplete?: () => void;
}

export function RiderPDFExport({
  template,
  artistName = 'Artist',
  onExportStart,
  onExportComplete,
}: RiderPDFExportProps) {
  const handleExportPDF = async () => {
    try {
      onExportStart?.();

      const element = document.createElement('div');
      element.innerHTML = generatePDFHTML(template, artistName);

      const options: any = {
        margin: 10,
        filename: `${template.templateName.replace(/\s+/g, '_')}_rider.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' as const, unit: 'mm', format: 'a4' },
      };

      html2pdf().set(options).from(element).save();

      toast.success('Rider PDF exported successfully');
      onExportComplete?.();
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
      onExportComplete?.();
    }
  };

  return (
    <Button
      onClick={handleExportPDF}
      variant="outline"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export as PDF
    </Button>
  );
}

function generatePDFHTML(template: RiderTemplate, artistName: string): string {
  const formatBoolean = (value: boolean | null | undefined) => value ? '✓' : '✗';
  const formatArray = (arr: any) => {
    if (Array.isArray(arr)) return arr.join(', ');
    return '';
  };

  return `
    <html>
      <head>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
          }
          
          .container {
            width: 100%;
            padding: 20px;
          }
          
          .header {
            border-bottom: 3px solid #7c3aed;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          
          .header h1 {
            font-size: 28px;
            color: #7c3aed;
            margin-bottom: 5px;
          }
          
          .header p {
            font-size: 14px;
            color: #666;
          }
          
          .artist-info {
            background-color: #f5f3ff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #7c3aed;
          }
          
          .artist-info p {
            margin: 5px 0;
            font-size: 14px;
          }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #7c3aed;
            border-bottom: 2px solid #e9d5ff;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          
          .subsection {
            margin-bottom: 15px;
            padding-left: 10px;
          }
          
          .subsection-title {
            font-size: 13px;
            font-weight: 600;
            color: #555;
            margin-bottom: 8px;
          }
          
          .field-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
            font-size: 13px;
          }
          
          .field-label {
            font-weight: 500;
            color: #555;
            flex: 0 0 40%;
          }
          
          .field-value {
            color: #333;
            flex: 1;
            text-align: right;
          }
          
          .checkbox-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 8px;
          }
          
          .checkbox-item {
            display: flex;
            align-items: center;
            font-size: 12px;
            padding: 4px;
          }
          
          .checkbox-icon {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 1px solid #ccc;
            border-radius: 3px;
            margin-right: 6px;
            text-align: center;
            line-height: 14px;
            font-size: 12px;
            font-weight: bold;
            color: #7c3aed;
          }
          
          .checkbox-checked {
            background-color: #7c3aed;
            color: white;
          }
          
          .text-content {
            background-color: #fafafa;
            padding: 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: pre-wrap;
            word-wrap: break-word;
            margin-top: 8px;
          }
          
          .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .signature-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e9d5ff;
          }
          
          .signature-line {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
          }
          
          .signature-block {
            flex: 1;
          }
          
          .signature-line-text {
            border-top: 1px solid #333;
            margin-top: 30px;
            padding-top: 5px;
            font-size: 12px;
            text-align: center;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e9d5ff;
            font-size: 11px;
            color: #999;
            text-align: center;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .container {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>🎤 PERFORMANCE RIDER</h1>
            <p>${artistName}</p>
          </div>

          <!-- Artist Info -->
          <div class="artist-info">
            <p><strong>Template:</strong> ${template.templateName}</p>
            ${template.genre ? `<p><strong>Genre:</strong> ${template.genre}</p>` : ''}
            ${template.performanceType ? `<p><strong>Performance Type:</strong> ${template.performanceType}</p>` : ''}
            ${template.description ? `<p><strong>Description:</strong> ${template.description}</p>` : ''}
          </div>

          <!-- Basic Information -->
          <div class="section">
            <div class="section-title">BASIC INFORMATION</div>
            
            ${template.performanceDuration ? `
              <div class="field-row">
                <span class="field-label">Performance Duration</span>
                <span class="field-value">${template.performanceDuration} minutes</span>
              </div>
            ` : ''}
            
            ${template.numberOfPerformers ? `
              <div class="field-row">
                <span class="field-label">Number of Performers</span>
                <span class="field-value">${template.numberOfPerformers}</span>
              </div>
            ` : ''}
            
            ${template.setupTimeRequired ? `
              <div class="field-row">
                <span class="field-label">Setup Time Required</span>
                <span class="field-value">${template.setupTimeRequired} minutes</span>
              </div>
            ` : ''}
            
            ${template.soundcheckTimeRequired ? `
              <div class="field-row">
                <span class="field-label">Soundcheck Time Required</span>
                <span class="field-value">${template.soundcheckTimeRequired} minutes</span>
              </div>
            ` : ''}
            
            ${template.teardownTimeRequired ? `
              <div class="field-row">
                <span class="field-label">Teardown Time Required</span>
                <span class="field-value">${template.teardownTimeRequired} minutes</span>
              </div>
            ` : ''}
          </div>

          <!-- Technical Requirements -->
          <div class="section">
            <div class="section-title">TECHNICAL REQUIREMENTS</div>
            
            <div class="subsection">
              <div class="subsection-title">Sound System</div>
              <div class="field-row">
                <span class="field-label">PA System Required</span>
                <span class="field-value">${formatBoolean(template.paSystemRequired)}</span>
              </div>
              ${template.microphoneType ? `
                <div class="field-row">
                  <span class="field-label">Microphone Type</span>
                  <span class="field-value">${template.microphoneType}</span>
                </div>
              ` : ''}
              <div class="field-row">
                <span class="field-label">Monitor Mix Required</span>
                <span class="field-value">${formatBoolean(template.monitorMixRequired)}</span>
              </div>
              ${template.diBoxesNeeded ? `
                <div class="field-row">
                  <span class="field-label">DI Boxes Needed</span>
                  <span class="field-value">${template.diBoxesNeeded}</span>
                </div>
              ` : ''}
              ${template.audioInterface ? `
                <div class="field-row">
                  <span class="field-label">Audio Interface</span>
                  <span class="field-value">${template.audioInterface}</span>
                </div>
              ` : ''}
            </div>

            <div class="subsection">
              <div class="subsection-title">Lighting & Stage</div>
              <div class="field-row">
                <span class="field-label">Special Lighting Required</span>
                <span class="field-value">${formatBoolean(template.lightingRequired)}</span>
              </div>
              ${template.lightingType ? `
                <div class="field-row">
                  <span class="field-label">Lighting Type</span>
                  <span class="field-value">${template.lightingType}</span>
                </div>
              ` : ''}
              ${template.specialEffects ? `
                <div class="field-row">
                  <span class="field-label">Special Effects</span>
                  <span class="field-value">${template.specialEffects}</span>
                </div>
              ` : ''}
              ${template.stageDimensions ? `
                <div class="field-row">
                  <span class="field-label">Stage Dimensions</span>
                  <span class="field-value">${template.stageDimensions}</span>
                </div>
              ` : ''}
              ${template.stageHeight ? `
                <div class="field-row">
                  <span class="field-label">Stage Height</span>
                  <span class="field-value">${template.stageHeight} ft</span>
                </div>
              ` : ''}
              <div class="field-row">
                <span class="field-label">Backdrop Required</span>
                <span class="field-value">${formatBoolean(template.backdropRequired)}</span>
              </div>
              ${template.backdropDetails ? `
                <div class="text-content">${template.backdropDetails}</div>
              ` : ''}
            </div>

            <div class="subsection">
              <div class="subsection-title">Equipment</div>
              <div class="field-row">
                <span class="field-label">Bringing Own Equipment</span>
                <span class="field-value">${formatBoolean(template.bringingOwnEquipment)}</span>
              </div>
              ${template.equipmentList ? `
                <div class="text-content">${template.equipmentList}</div>
              ` : ''}
              ${template.powerRequirements ? `
                <div class="field-row">
                  <span class="field-label">Power Requirements</span>
                  <span class="field-value">${template.powerRequirements}</span>
                </div>
              ` : ''}
              ${template.backupEquipment ? `
                <div class="text-content">${template.backupEquipment}</div>
              ` : ''}
            </div>
          </div>

          <!-- Hospitality Requirements -->
          <div class="section">
            <div class="section-title">HOSPITALITY REQUIREMENTS</div>
            
            <div class="subsection">
              <div class="subsection-title">Dressing Room</div>
              <div class="field-row">
                <span class="field-label">Dressing Room Required</span>
                <span class="field-value">${formatBoolean(template.dressingRoomRequired)}</span>
              </div>
              ${template.roomTemperature ? `
                <div class="field-row">
                  <span class="field-label">Room Temperature</span>
                  <span class="field-value">${template.roomTemperature}</span>
                </div>
              ` : ''}
              ${template.furnitureNeeded && template.furnitureNeeded.length > 0 ? `
                <div>
                  <div class="subsection-title" style="margin-top: 8px;">Furniture Needed</div>
                  <div class="checkbox-list">
                    ${template.furnitureNeeded.map((item: string) => `
                      <div class="checkbox-item">
                        <span class="checkbox-icon checkbox-checked">✓</span>
                        ${item}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${template.amenities && template.amenities.length > 0 ? `
                <div>
                  <div class="subsection-title" style="margin-top: 8px;">Amenities</div>
                  <div class="checkbox-list">
                    ${template.amenities.map((item: string) => `
                      <div class="checkbox-item">
                        <span class="checkbox-icon checkbox-checked">✓</span>
                        ${item}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>

            <div class="subsection">
              <div class="subsection-title">Catering</div>
              <div class="field-row">
                <span class="field-label">Catering Provided</span>
                <span class="field-value">${formatBoolean(template.cateringProvided)}</span>
              </div>
              ${template.dietaryRestrictions && template.dietaryRestrictions.length > 0 ? `
                <div>
                  <div class="subsection-title" style="margin-top: 8px;">Dietary Restrictions</div>
                  <div class="checkbox-list">
                    ${template.dietaryRestrictions.map((item: string) => `
                      <div class="checkbox-item">
                        <span class="checkbox-icon checkbox-checked">✓</span>
                        ${item}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${template.specificDietaryNeeds ? `
                <div class="text-content">${template.specificDietaryNeeds}</div>
              ` : ''}
              ${template.beverages && template.beverages.length > 0 ? `
                <div>
                  <div class="subsection-title" style="margin-top: 8px;">Beverages</div>
                  <div class="checkbox-list">
                    ${template.beverages.map((item: string) => `
                      <div class="checkbox-item">
                        <span class="checkbox-icon checkbox-checked">✓</span>
                        ${item}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${template.mealTiming ? `
                <div class="field-row">
                  <span class="field-label">Meal Timing</span>
                  <span class="field-value">${template.mealTiming}</span>
                </div>
              ` : ''}
            </div>

            <div class="subsection">
              <div class="subsection-title">Access & Parking</div>
              <div class="field-row">
                <span class="field-label">Parking Required</span>
                <span class="field-value">${formatBoolean(template.parkingRequired)}</span>
              </div>
              ${template.parkingType ? `
                <div class="field-row">
                  <span class="field-label">Parking Type</span>
                  <span class="field-value">${template.parkingType}</span>
                </div>
              ` : ''}
              ${template.loadInAccess ? `
                <div class="text-content">${template.loadInAccess}</div>
              ` : ''}
              <div class="field-row">
                <span class="field-label">Accessible Entrance Required</span>
                <span class="field-value">${formatBoolean(template.accessibleEntrance)}</span>
              </div>
            </div>
          </div>

          <!-- Travel & Accommodation -->
          <div class="section">
            <div class="section-title">TRAVEL & ACCOMMODATION</div>
            
            <div class="subsection">
              <div class="subsection-title">Travel</div>
              <div class="field-row">
                <span class="field-label">Venue Provides Transportation</span>
                <span class="field-value">${formatBoolean(template.travelProvided)}</span>
              </div>
              ${template.travelMethod ? `
                <div class="field-row">
                  <span class="field-label">Travel Method</span>
                  <span class="field-value">${template.travelMethod}</span>
                </div>
              ` : ''}
            </div>

            <div class="subsection">
              <div class="subsection-title">Accommodation</div>
              <div class="field-row">
                <span class="field-label">Venue Provides Hotel</span>
                <span class="field-value">${formatBoolean(template.accommodationProvided)}</span>
              </div>
              ${template.hotelRequirements ? `
                <div class="text-content">${template.hotelRequirements}</div>
              ` : ''}
              ${template.numberOfRooms ? `
                <div class="field-row">
                  <span class="field-label">Number of Rooms</span>
                  <span class="field-value">${template.numberOfRooms}</span>
                </div>
              ` : ''}
              ${template.checkInCheckOut ? `
                <div class="field-row">
                  <span class="field-label">Check-in/Check-out</span>
                  <span class="field-value">${template.checkInCheckOut}</span>
                </div>
              ` : ''}
              ${template.groundTransportation ? `
                <div class="field-row">
                  <span class="field-label">Ground Transportation</span>
                  <span class="field-value">${template.groundTransportation}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Merchandise & Promotion -->
          <div class="section">
            <div class="section-title">MERCHANDISE & PROMOTION</div>
            
            <div class="subsection">
              <div class="field-row">
                <span class="field-label">Selling Merchandise</span>
                <span class="field-value">${formatBoolean(template.merchandiseSales)}</span>
              </div>
              ${template.merchandiseCut ? `
                <div class="field-row">
                  <span class="field-label">Venue Commission</span>
                  <span class="field-value">${template.merchandiseCut}%</span>
                </div>
              ` : ''}
              <div class="field-row">
                <span class="field-label">Photography Allowed</span>
                <span class="field-value">${formatBoolean(template.photographyAllowed)}</span>
              </div>
              <div class="field-row">
                <span class="field-label">Video Recording Allowed</span>
                <span class="field-value">${formatBoolean(template.videoRecordingAllowed)}</span>
              </div>
              <div class="field-row">
                <span class="field-label">Social Media Permission</span>
                <span class="field-value">${formatBoolean(template.socialMediaPermission)}</span>
              </div>
              <div class="field-row">
                <span class="field-label">Broadcasting Rights</span>
                <span class="field-value">${formatBoolean(template.broadcastingRights)}</span>
              </div>
              ${template.promotionalMaterials ? `
                <div class="text-content">${template.promotionalMaterials}</div>
              ` : ''}
            </div>
          </div>

          <!-- Additional Information -->
          ${template.specialRequests || template.emergencyContact || template.additionalNotes ? `
            <div class="section">
              <div class="section-title">ADDITIONAL INFORMATION</div>
              
              ${template.specialRequests ? `
                <div class="subsection">
                  <div class="subsection-title">Special Requests</div>
                  <div class="text-content">${template.specialRequests}</div>
                </div>
              ` : ''}
              
              ${template.emergencyContact ? `
                <div class="subsection">
                  <div class="subsection-title">Emergency Contact</div>
                  <div class="text-content">${template.emergencyContact}</div>
                </div>
              ` : ''}
              
              ${template.additionalNotes ? `
                <div class="subsection">
                  <div class="subsection-title">Additional Notes</div>
                  <div class="text-content">${template.additionalNotes}</div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-line">
              <div class="signature-block">
                <div class="signature-line-text">Artist/Manager Signature</div>
              </div>
              <div class="signature-block">
                <div class="signature-line-text">Date</div>
              </div>
            </div>
            
            <div class="signature-line">
              <div class="signature-block">
                <div class="signature-line-text">Venue Representative</div>
              </div>
              <div class="signature-block">
                <div class="signature-line-text">Date</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>This rider was generated on ${new Date().toLocaleDateString()} from Ologywood Artist Booking Platform</p>
            <p>For modifications or questions, please contact the artist directly.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
