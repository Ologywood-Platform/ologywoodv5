import { describe, it, expect, beforeAll } from 'vitest';
import { RiderContractGenerator, generateRiderContractText, type RiderContractData } from '../services/riderContractService';

describe('RiderContractService', () => {
  const mockContractData: RiderContractData = {
    artistName: 'John Doe',
    artistEmail: 'john@example.com',
    artistPhone: '555-1234',
    venueName: 'The Grand Theater',
    venueAddress: '123 Main St, New York, NY 10001',
    eventDate: '2026-02-15',
    eventTime: '19:00',
    eventDuration: 90,
    totalFee: 5000,
    depositAmount: 2500,
    technical: {
      soundSystem: 'Full PA system with monitors',
      lightingSystem: 'Professional stage lighting',
      stage: '20x16 ft stage',
      parking: 'Dedicated parking for 2 vehicles',
      loadIn: '2 hours before event',
      soundCheck: '1 hour before performance',
      additionalRequirements: ['Wireless microphone', 'Drum riser'],
    },
    hospitality: {
      greenRoom: 'Private green room with seating',
      meals: 'Catered dinner for 3 people',
      dressing: 'Private dressing room with mirror',
      parking: 'Complimentary parking',
      accommodations: 'Hotel accommodations for 2 nights',
      additionalRequirements: ['WiFi access', 'Bottled water'],
    },
    financial: {
      paymentTerms: '50% deposit upon booking, balance due 7 days before event',
      cancellationPolicy: 'Full refund if cancelled 30 days in advance',
      insuranceRequired: true,
      taxId: '12-3456789',
      additionalTerms: ['Payment via bank transfer', 'Invoice provided'],
    },
    specialRequests: 'Please ensure the stage is clear of any obstacles',
    notes: 'This is a special event with VIP guests',
  };

  describe('generateRiderContractText', () => {
    it('should generate text contract with all sections', () => {
      const text = generateRiderContractText(mockContractData);

      expect(text).toContain('ARTIST RIDER CONTRACT');
      expect(text).toContain('EVENT DETAILS');
      expect(text).toContain('TECHNICAL REQUIREMENTS');
      expect(text).toContain('HOSPITALITY REQUIREMENTS');
      expect(text).toContain('FINANCIAL TERMS');
      expect(text).toContain('SPECIAL REQUESTS');
      expect(text).toContain('NOTES');
    });

    it('should include artist information', () => {
      const text = generateRiderContractText(mockContractData);

      expect(text).toContain(mockContractData.artistName);
      expect(text).toContain(mockContractData.artistEmail);
      expect(text).toContain(mockContractData.artistPhone);
    });

    it('should include venue information', () => {
      const text = generateRiderContractText(mockContractData);

      expect(text).toContain(mockContractData.venueName);
      expect(text).toContain(mockContractData.venueAddress);
    });

    it('should include event details', () => {
      const text = generateRiderContractText(mockContractData);

      expect(text).toContain(mockContractData.eventDate);
      expect(text).toContain(mockContractData.eventTime);
      expect(text).toContain('90 minutes');
    });

    it('should include financial information', () => {
      const text = generateRiderContractText(mockContractData);

      expect(text).toContain('$5000.00');
      expect(text).toContain('$2500.00');
    });

    it('should include technical requirements', () => {
      const text = generateRiderContractText(mockContractData);

      expect(text).toContain('Sound System');
      expect(text).toContain('Full PA system with monitors');
      expect(text).toContain('Wireless microphone');
      expect(text).toContain('Drum riser');
    });

    it('should include hospitality requirements', () => {
      const text = generateRiderContractText(mockContractData);

      expect(text).toContain('Green Room');
      expect(text).toContain('Private green room with seating');
      expect(text).toContain('WiFi access');
      expect(text).toContain('Bottled water');
    });

    it('should include financial terms', () => {
      const text = generateRiderContractText(mockContractData);

      expect(text).toContain('Payment Terms');
      expect(text).toContain('Cancellation');
      expect(text).toContain('Insurance Required');
    });
  });

  describe('RiderContractGenerator.generatePDF', () => {
    it('should generate PDF buffer', async () => {
      const pdfBuffer = await RiderContractGenerator.generatePDF(mockContractData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      // PDF files start with %PDF
      expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
    });

    it('should handle minimal contract data', async () => {
      const minimalData: RiderContractData = {
        artistName: 'Jane Smith',
        artistEmail: 'jane@example.com',
        venueName: 'Small Club',
        venueAddress: '456 Oak Ave',
        eventDate: '2026-03-01',
        eventTime: '20:00',
        totalFee: 1000,
      };

      const pdfBuffer = await RiderContractGenerator.generatePDF(minimalData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
    });

    it('should handle contract data with all optional fields', async () => {
      const pdfBuffer = await RiderContractGenerator.generatePDF(mockContractData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should generate multi-page PDF for detailed contracts', async () => {
      const pdfBuffer = await RiderContractGenerator.generatePDF(mockContractData);

      // Multi-page PDFs have multiple %%Page entries
      const pdfString = pdfBuffer.toString('utf8');
      expect(pdfString).toContain('%%Page');
    });
  });

  describe('Contract data validation', () => {
    it('should handle special characters in text fields', async () => {
      const dataWithSpecialChars: RiderContractData = {
        ...mockContractData,
        artistName: "O'Brien & Co.",
        specialRequests: 'Please use "quotes" and (parentheses) carefully',
      };

      const text = generateRiderContractText(dataWithSpecialChars);
      expect(text).toContain("O'Brien & Co.");
      expect(text).toContain('Please use');
    });

    it('should handle large fee amounts', async () => {
      const dataWithLargeFee: RiderContractData = {
        ...mockContractData,
        totalFee: 999999.99,
        depositAmount: 500000,
      };

      const text = generateRiderContractText(dataWithLargeFee);
      expect(text).toContain('$999999.99');
      expect(text).toContain('$500000.00');
    });

    it('should handle empty optional arrays', async () => {
      const dataWithEmptyArrays: RiderContractData = {
        ...mockContractData,
        technical: {
          ...mockContractData.technical,
          additionalRequirements: [],
        },
      };

      const text = generateRiderContractText(dataWithEmptyArrays);
      expect(text).toContain('TECHNICAL REQUIREMENTS');
    });
  });
});
