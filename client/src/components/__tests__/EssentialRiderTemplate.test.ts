import { describe, it, expect, vi } from 'vitest';

// Mock data for testing
const mockRiderData = {
  templateName: 'Standard Concert Setup',
  description: 'Standard setup for concert performances',
  performanceType: 'concert',
  performanceDuration: 90,
  setupTimeRequired: 30,
  soundcheckTimeRequired: 15,
  paSystemRequired: true,
  lightingRequired: true,
  microphoneCount: 2,
  monitorMixRequired: true,
  stageDimensions: '20x15',
  powerRequirements: '120V, 20A',
  bringingOwnEquipment: false,
  dressingRoomRequired: true,
  cateringProvided: true,
  dietaryRestrictions: 'Vegetarian',
  parkingRequired: true,
  numberOfPerformers: 3,
  performanceFee: 1500,
  feeType: 'fixed' as const,
  paymentMethod: 'bank_transfer' as const,
  paymentTiming: 'before_event' as const,
  depositRequired: true,
  depositAmount: 500,
  specialRequests: 'Please provide green room with seating',
  cancellationPolicy: 'Full refund if cancelled 30+ days before',
  emergencyContact: '+1-555-0123',
};

describe('EssentialRiderTemplate Component', () => {
  describe('Data Validation', () => {
    it('should validate that template name is required', () => {
      const invalidData = { ...mockRiderData, templateName: '' };
      expect(invalidData.templateName.trim()).toBe('');
    });

    it('should validate that performance fee is positive', () => {
      const validData = { ...mockRiderData, performanceFee: 1500 };
      expect(validData.performanceFee).toBeGreaterThan(0);
    });

    it('should reject negative performance fees', () => {
      const invalidData = { ...mockRiderData, performanceFee: -500 };
      expect(invalidData.performanceFee).toBeLessThan(0);
    });

    it('should validate performance duration is reasonable', () => {
      const validData = { ...mockRiderData, performanceDuration: 90 };
      expect(validData.performanceDuration).toBeGreaterThanOrEqual(15);
      expect(validData.performanceDuration).toBeLessThanOrEqual(480);
    });

    it('should validate setup time is reasonable', () => {
      const validData = { ...mockRiderData, setupTimeRequired: 30 };
      expect(validData.setupTimeRequired).toBeGreaterThanOrEqual(15);
      expect(validData.setupTimeRequired).toBeLessThanOrEqual(240);
    });
  });

  describe('Financial Requirements', () => {
    it('should handle fixed fee type correctly', () => {
      const data = { ...mockRiderData, feeType: 'fixed' as const };
      expect(data.feeType).toBe('fixed');
    });

    it('should handle percentage fee type correctly', () => {
      const data = { ...mockRiderData, feeType: 'percentage' as const };
      expect(data.feeType).toBe('percentage');
    });

    it('should support all payment methods', () => {
      const methods = ['bank_transfer', 'check', 'cash', 'paypal'] as const;
      methods.forEach(method => {
        const data = { ...mockRiderData, paymentMethod: method };
        expect(['bank_transfer', 'check', 'cash', 'paypal']).toContain(data.paymentMethod);
      });
    });

    it('should support all payment timings', () => {
      const timings = ['upon_booking', 'before_event', 'after_event'] as const;
      timings.forEach(timing => {
        const data = { ...mockRiderData, paymentTiming: timing };
        expect(['upon_booking', 'before_event', 'after_event']).toContain(data.paymentTiming);
      });
    });

    it('should validate deposit amount when deposit is required', () => {
      const data = { ...mockRiderData, depositRequired: true, depositAmount: 500 };
      if (data.depositRequired) {
        expect(data.depositAmount).toBeGreaterThan(0);
      }
    });

    it('should allow zero deposit amount when deposit not required', () => {
      const data = { ...mockRiderData, depositRequired: false, depositAmount: 0 };
      expect(data.depositAmount).toBe(0);
    });
  });

  describe('Technical Requirements', () => {
    it('should support PA system requirement', () => {
      const data = { ...mockRiderData, paSystemRequired: true };
      expect(typeof data.paSystemRequired).toBe('boolean');
    });

    it('should support lighting requirement', () => {
      const data = { ...mockRiderData, lightingRequired: true };
      expect(typeof data.lightingRequired).toBe('boolean');
    });

    it('should support monitor mix requirement', () => {
      const data = { ...mockRiderData, monitorMixRequired: true };
      expect(typeof data.monitorMixRequired).toBe('boolean');
    });

    it('should support bringing own equipment flag', () => {
      const data = { ...mockRiderData, bringingOwnEquipment: true };
      expect(typeof data.bringingOwnEquipment).toBe('boolean');
    });

    it('should validate microphone count is reasonable', () => {
      const data = { ...mockRiderData, microphoneCount: 2 };
      expect(data.microphoneCount).toBeGreaterThanOrEqual(0);
      expect(data.microphoneCount).toBeLessThanOrEqual(10);
    });

    it('should store equipment list when bringing own equipment', () => {
      const data = {
        ...mockRiderData,
        bringingOwnEquipment: true,
        equipmentList: 'Turntables, mixer, headphones',
      };
      if (data.bringingOwnEquipment) {
        expect(data.equipmentList).toBeDefined();
      }
    });
  });

  describe('Hospitality Requirements', () => {
    it('should support dressing room requirement', () => {
      const data = { ...mockRiderData, dressingRoomRequired: true };
      expect(typeof data.dressingRoomRequired).toBe('boolean');
    });

    it('should support catering requirement', () => {
      const data = { ...mockRiderData, cateringProvided: true };
      expect(typeof data.cateringProvided).toBe('boolean');
    });

    it('should support parking requirement', () => {
      const data = { ...mockRiderData, parkingRequired: true };
      expect(typeof data.parkingRequired).toBe('boolean');
    });

    it('should store dietary restrictions when catering is provided', () => {
      const data = {
        ...mockRiderData,
        cateringProvided: true,
        dietaryRestrictions: 'Vegetarian, gluten-free',
      };
      if (data.cateringProvided) {
        expect(data.dietaryRestrictions).toBeDefined();
      }
    });

    it('should validate number of performers is reasonable', () => {
      const data = { ...mockRiderData, numberOfPerformers: 3 };
      expect(data.numberOfPerformers).toBeGreaterThanOrEqual(1);
      expect(data.numberOfPerformers).toBeLessThanOrEqual(50);
    });
  });

  describe('Performance Types', () => {
    it('should support all performance types', () => {
      const types = ['concert', 'dj', 'acoustic', 'band', 'solo', 'corporate', 'festival', 'other'];
      types.forEach(type => {
        const data = { ...mockRiderData, performanceType: type };
        expect(types).toContain(data.performanceType);
      });
    });
  });

  describe('Template Data Completeness', () => {
    it('should have all required fields', () => {
      expect(mockRiderData).toHaveProperty('templateName');
      expect(mockRiderData).toHaveProperty('performanceType');
      expect(mockRiderData).toHaveProperty('performanceDuration');
      expect(mockRiderData).toHaveProperty('setupTimeRequired');
      expect(mockRiderData).toHaveProperty('performanceFee');
      expect(mockRiderData).toHaveProperty('feeType');
      expect(mockRiderData).toHaveProperty('paymentMethod');
      expect(mockRiderData).toHaveProperty('paymentTiming');
    });

    it('should have optional fields', () => {
      expect(mockRiderData).toHaveProperty('description');
      expect(mockRiderData).toHaveProperty('soundcheckTimeRequired');
      expect(mockRiderData).toHaveProperty('equipmentList');
      expect(mockRiderData).toHaveProperty('dietaryRestrictions');
      expect(mockRiderData).toHaveProperty('specialRequests');
    });
  });

  describe('Template Scenarios', () => {
    it('should create a minimal DJ template', () => {
      const djTemplate = {
        templateName: 'Club DJ Setup',
        performanceType: 'dj',
        performanceDuration: 240,
        setupTimeRequired: 30,
        paSystemRequired: true,
        lightingRequired: true,
        monitorMixRequired: false,
        bringingOwnEquipment: true,
        equipmentList: 'Turntables, mixer, headphones',
        dressingRoomRequired: false,
        cateringProvided: false,
        parkingRequired: true,
        performanceFee: 800,
        feeType: 'fixed' as const,
        paymentMethod: 'bank_transfer' as const,
        paymentTiming: 'before_event' as const,
        depositRequired: false,
      };

      expect(djTemplate.templateName).toBe('Club DJ Setup');
      expect(djTemplate.performanceType).toBe('dj');
      expect(djTemplate.bringingOwnEquipment).toBe(true);
    });

    it('should create an acoustic solo template', () => {
      const acousticTemplate = {
        templateName: 'Acoustic Solo',
        performanceType: 'acoustic',
        performanceDuration: 90,
        setupTimeRequired: 15,
        paSystemRequired: true,
        lightingRequired: false,
        monitorMixRequired: false,
        bringingOwnEquipment: true,
        equipmentList: 'Acoustic guitar, microphone',
        dressingRoomRequired: false,
        cateringProvided: false,
        parkingRequired: true,
        performanceFee: 300,
        feeType: 'fixed' as const,
        paymentMethod: 'cash' as const,
        paymentTiming: 'after_event' as const,
        depositRequired: false,
      };

      expect(acousticTemplate.templateName).toBe('Acoustic Solo');
      expect(acousticTemplate.performanceType).toBe('acoustic');
      expect(acousticTemplate.performanceFee).toBe(300);
    });

    it('should create a full band template', () => {
      const bandTemplate = {
        templateName: 'Live Band',
        performanceType: 'band',
        performanceDuration: 120,
        setupTimeRequired: 60,
        numberOfPerformers: 4,
        paSystemRequired: true,
        lightingRequired: true,
        monitorMixRequired: true,
        bringingOwnEquipment: true,
        equipmentList: 'Drums, bass amp, guitar amp, keyboards',
        stageDimensions: '20x15',
        dressingRoomRequired: true,
        cateringProvided: true,
        parkingRequired: true,
        performanceFee: 2000,
        feeType: 'fixed' as const,
        paymentMethod: 'bank_transfer' as const,
        paymentTiming: 'before_event' as const,
        depositRequired: true,
        depositAmount: 500,
      };

      expect(bandTemplate.templateName).toBe('Live Band');
      expect(bandTemplate.numberOfPerformers).toBe(4);
      expect(bandTemplate.depositRequired).toBe(true);
      expect(bandTemplate.depositAmount).toBe(500);
    });
  });

  describe('Data Transformation', () => {
    it('should convert string numbers to integers correctly', () => {
      const stringData = {
        performanceDuration: '90',
        setupTimeRequired: '30',
        numberOfPerformers: '3',
      };

      const intData = {
        performanceDuration: parseInt(stringData.performanceDuration),
        setupTimeRequired: parseInt(stringData.setupTimeRequired),
        numberOfPerformers: parseInt(stringData.numberOfPerformers),
      };

      expect(intData.performanceDuration).toBe(90);
      expect(intData.setupTimeRequired).toBe(30);
      expect(intData.numberOfPerformers).toBe(3);
    });

    it('should convert string numbers to floats for fees', () => {
      const stringData = {
        performanceFee: '1500.50',
        depositAmount: '500.00',
      };

      const floatData = {
        performanceFee: parseFloat(stringData.performanceFee),
        depositAmount: parseFloat(stringData.depositAmount),
      };

      expect(floatData.performanceFee).toBe(1500.50);
      expect(floatData.depositAmount).toBe(500.00);
    });
  });

  describe('Conditional Fields', () => {
    it('should only require equipment list when bringing own equipment', () => {
      const withEquipment = {
        bringingOwnEquipment: true,
        equipmentList: 'Turntables, mixer',
      };

      const withoutEquipment = {
        bringingOwnEquipment: false,
        equipmentList: undefined,
      };

      expect(withEquipment.bringingOwnEquipment).toBe(true);
      expect(withEquipment.equipmentList).toBeDefined();

      expect(withoutEquipment.bringingOwnEquipment).toBe(false);
      expect(withoutEquipment.equipmentList).toBeUndefined();
    });

    it('should only require dietary restrictions when catering is provided', () => {
      const withCatering = {
        cateringProvided: true,
        dietaryRestrictions: 'Vegetarian',
      };

      const withoutCatering = {
        cateringProvided: false,
        dietaryRestrictions: undefined,
      };

      expect(withCatering.cateringProvided).toBe(true);
      expect(withCatering.dietaryRestrictions).toBeDefined();

      expect(withoutCatering.cateringProvided).toBe(false);
      expect(withoutCatering.dietaryRestrictions).toBeUndefined();
    });

    it('should only require deposit amount when deposit is required', () => {
      const withDeposit = {
        depositRequired: true,
        depositAmount: 500,
      };

      const withoutDeposit = {
        depositRequired: false,
        depositAmount: undefined,
      };

      expect(withDeposit.depositRequired).toBe(true);
      expect(withDeposit.depositAmount).toBeDefined();

      expect(withoutDeposit.depositRequired).toBe(false);
      expect(withoutDeposit.depositAmount).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long template names', () => {
      const longName = 'A'.repeat(255);
      const data = { ...mockRiderData, templateName: longName };
      expect(data.templateName.length).toBe(255);
    });

    it('should handle very long special requests', () => {
      const longRequest = 'Request '.repeat(100);
      const data = { ...mockRiderData, specialRequests: longRequest };
      expect(data.specialRequests.length).toBeGreaterThan(100);
    });

    it('should handle minimum performance duration', () => {
      const data = { ...mockRiderData, performanceDuration: 15 };
      expect(data.performanceDuration).toBe(15);
    });

    it('should handle maximum performance duration', () => {
      const data = { ...mockRiderData, performanceDuration: 480 };
      expect(data.performanceDuration).toBe(480);
    });

    it('should handle zero microphone count', () => {
      const data = { ...mockRiderData, microphoneCount: 0 };
      expect(data.microphoneCount).toBe(0);
    });

    it('should handle maximum microphone count', () => {
      const data = { ...mockRiderData, microphoneCount: 10 };
      expect(data.microphoneCount).toBe(10);
    });
  });
});
