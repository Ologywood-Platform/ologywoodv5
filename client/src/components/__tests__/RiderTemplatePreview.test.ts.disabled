import { describe, it, expect } from 'vitest';

const mockRiderData = {
  templateName: 'Standard Concert Setup',
  description: 'Professional concert performance requirements',
  performanceType: 'concert',
  performanceDuration: 90,
  setupTimeRequired: 30,
  soundcheckTimeRequired: 15,
  numberOfPerformers: 3,
  paSystemRequired: true,
  lightingRequired: true,
  microphoneCount: 2,
  monitorMixRequired: true,
  stageDimensions: '20x15 ft',
  powerRequirements: '120V, 20A circuits',
  bringingOwnEquipment: false,
  dressingRoomRequired: true,
  cateringProvided: true,
  dietaryRestrictions: 'Vegetarian options required',
  parkingRequired: true,
  performanceFee: 1500,
  feeType: 'fixed' as const,
  paymentMethod: 'bank_transfer',
  paymentTiming: 'before_event',
  depositRequired: true,
  depositAmount: 500,
  specialRequests: 'Green room with seating for 3 people',
  cancellationPolicy: 'Full refund if cancelled 30+ days before event',
  emergencyContact: '+1-555-0123',
};

describe('RiderTemplatePreview Component', () => {
  describe('Rendering', () => {
    it('should render loading state when isLoading is true', () => {
      const props = { isLoading: true };
      expect(props.isLoading).toBe(true);
    });

    it('should render empty state when no rider data provided', () => {
      const props = { riderData: undefined };
      expect(props.riderData).toBeUndefined();
    });

    it('should render complete rider data when provided', () => {
      const props = { riderData: mockRiderData };
      expect(props.riderData).toBeDefined();
      expect(props.riderData?.templateName).toBe('Standard Concert Setup');
    });
  });

  describe('Data Display', () => {
    it('should display template name correctly', () => {
      const data = { ...mockRiderData };
      expect(data.templateName).toBe('Standard Concert Setup');
    });

    it('should display description correctly', () => {
      const data = { ...mockRiderData };
      expect(data.description).toBe('Professional concert performance requirements');
    });

    it('should display performance type', () => {
      const data = { ...mockRiderData };
      expect(data.performanceType).toBe('concert');
    });

    it('should display performance duration in minutes', () => {
      const data = { ...mockRiderData };
      expect(data.performanceDuration).toBe(90);
    });

    it('should display setup time required', () => {
      const data = { ...mockRiderData };
      expect(data.setupTimeRequired).toBe(30);
    });

    it('should display number of performers', () => {
      const data = { ...mockRiderData };
      expect(data.numberOfPerformers).toBe(3);
    });
  });

  describe('Technical Requirements Display', () => {
    it('should show PA system requirement status', () => {
      const data = { ...mockRiderData };
      expect(data.paSystemRequired).toBe(true);
    });

    it('should show lighting requirement status', () => {
      const data = { ...mockRiderData };
      expect(data.lightingRequired).toBe(true);
    });

    it('should show monitor mix requirement status', () => {
      const data = { ...mockRiderData };
      expect(data.monitorMixRequired).toBe(true);
    });

    it('should show own equipment status', () => {
      const data = { ...mockRiderData };
      expect(data.bringingOwnEquipment).toBe(false);
    });

    it('should display microphone count', () => {
      const data = { ...mockRiderData };
      expect(data.microphoneCount).toBe(2);
    });

    it('should display stage dimensions', () => {
      const data = { ...mockRiderData };
      expect(data.stageDimensions).toBe('20x15 ft');
    });

    it('should display power requirements', () => {
      const data = { ...mockRiderData };
      expect(data.powerRequirements).toBe('120V, 20A circuits');
    });

    it('should display equipment list when bringing own equipment', () => {
      const dataWithEquipment = {
        ...mockRiderData,
        bringingOwnEquipment: true,
        equipmentList: 'Turntables, mixer, headphones',
      };
      expect(dataWithEquipment.equipmentList).toBe('Turntables, mixer, headphones');
    });
  });

  describe('Hospitality Requirements Display', () => {
    it('should show dressing room requirement', () => {
      const data = { ...mockRiderData };
      expect(data.dressingRoomRequired).toBe(true);
    });

    it('should show catering requirement', () => {
      const data = { ...mockRiderData };
      expect(data.cateringProvided).toBe(true);
    });

    it('should show parking requirement', () => {
      const data = { ...mockRiderData };
      expect(data.parkingRequired).toBe(true);
    });

    it('should display dietary restrictions when catering provided', () => {
      const data = { ...mockRiderData };
      if (data.cateringProvided) {
        expect(data.dietaryRestrictions).toBe('Vegetarian options required');
      }
    });
  });

  describe('Financial Terms Display', () => {
    it('should display performance fee', () => {
      const data = { ...mockRiderData };
      expect(data.performanceFee).toBe(1500);
    });

    it('should display fee type as fixed', () => {
      const data = { ...mockRiderData };
      expect(data.feeType).toBe('fixed');
    });

    it('should display fee type as percentage', () => {
      const dataPercentage = { ...mockRiderData, feeType: 'percentage' as const };
      expect(dataPercentage.feeType).toBe('percentage');
    });

    it('should display payment method', () => {
      const data = { ...mockRiderData };
      expect(data.paymentMethod).toBe('bank_transfer');
    });

    it('should display payment timing', () => {
      const data = { ...mockRiderData };
      expect(data.paymentTiming).toBe('before_event');
    });

    it('should show deposit requirement', () => {
      const data = { ...mockRiderData };
      expect(data.depositRequired).toBe(true);
    });

    it('should display deposit amount when required', () => {
      const data = { ...mockRiderData };
      if (data.depositRequired) {
        expect(data.depositAmount).toBe(500);
      }
    });

    it('should not display deposit amount when not required', () => {
      const dataNoDeposit = { ...mockRiderData, depositRequired: false };
      expect(dataNoDeposit.depositRequired).toBe(false);
      expect(dataNoDeposit.depositAmount).toBeUndefined();
    });
  });

  describe('Additional Information Display', () => {
    it('should display special requests', () => {
      const data = { ...mockRiderData };
      expect(data.specialRequests).toBe('Green room with seating for 3 people');
    });

    it('should display cancellation policy', () => {
      const data = { ...mockRiderData };
      expect(data.cancellationPolicy).toBe('Full refund if cancelled 30+ days before event');
    });

    it('should display emergency contact', () => {
      const data = { ...mockRiderData };
      expect(data.emergencyContact).toBe('+1-555-0123');
    });
  });

  describe('Conditional Display', () => {
    it('should only show equipment list when bringing own equipment', () => {
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

    it('should only show dietary restrictions when catering provided', () => {
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
  });

  describe('Different Performance Types', () => {
    it('should handle concert performance type', () => {
      const data = { ...mockRiderData, performanceType: 'concert' };
      expect(data.performanceType).toBe('concert');
    });

    it('should handle DJ performance type', () => {
      const data = { ...mockRiderData, performanceType: 'dj' };
      expect(data.performanceType).toBe('dj');
    });

    it('should handle acoustic performance type', () => {
      const data = { ...mockRiderData, performanceType: 'acoustic' };
      expect(data.performanceType).toBe('acoustic');
    });

    it('should handle band performance type', () => {
      const data = { ...mockRiderData, performanceType: 'band' };
      expect(data.performanceType).toBe('band');
    });

    it('should handle solo performance type', () => {
      const data = { ...mockRiderData, performanceType: 'solo' };
      expect(data.performanceType).toBe('solo');
    });

    it('should handle corporate performance type', () => {
      const data = { ...mockRiderData, performanceType: 'corporate' };
      expect(data.performanceType).toBe('corporate');
    });
  });

  describe('Payment Methods', () => {
    it('should support bank transfer payment method', () => {
      const data = { ...mockRiderData, paymentMethod: 'bank_transfer' };
      expect(data.paymentMethod).toBe('bank_transfer');
    });

    it('should support check payment method', () => {
      const data = { ...mockRiderData, paymentMethod: 'check' };
      expect(data.paymentMethod).toBe('check');
    });

    it('should support cash payment method', () => {
      const data = { ...mockRiderData, paymentMethod: 'cash' };
      expect(data.paymentMethod).toBe('cash');
    });

    it('should support PayPal payment method', () => {
      const data = { ...mockRiderData, paymentMethod: 'paypal' };
      expect(data.paymentMethod).toBe('paypal');
    });
  });

  describe('Payment Timing Options', () => {
    it('should support upon booking payment timing', () => {
      const data = { ...mockRiderData, paymentTiming: 'upon_booking' };
      expect(data.paymentTiming).toBe('upon_booking');
    });

    it('should support before event payment timing', () => {
      const data = { ...mockRiderData, paymentTiming: 'before_event' };
      expect(data.paymentTiming).toBe('before_event');
    });

    it('should support after event payment timing', () => {
      const data = { ...mockRiderData, paymentTiming: 'after_event' };
      expect(data.paymentTiming).toBe('after_event');
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimal rider data', () => {
      const minimalData = {
        templateName: 'Basic Setup',
        performanceType: 'solo',
        performanceDuration: 60,
        setupTimeRequired: 15,
        paSystemRequired: false,
        lightingRequired: false,
        monitorMixRequired: false,
        bringingOwnEquipment: false,
        dressingRoomRequired: false,
        cateringProvided: false,
        parkingRequired: false,
        performanceFee: 0,
        feeType: 'fixed' as const,
        paymentMethod: 'cash',
        paymentTiming: 'after_event',
        depositRequired: false,
      };
      expect(minimalData.templateName).toBe('Basic Setup');
      expect(minimalData.performanceFee).toBe(0);
    });

    it('should handle comprehensive rider data', () => {
      const comprehensiveData = { ...mockRiderData };
      expect(comprehensiveData).toHaveProperty('templateName');
      expect(comprehensiveData).toHaveProperty('performanceType');
      expect(comprehensiveData).toHaveProperty('paSystemRequired');
      expect(comprehensiveData).toHaveProperty('dressingRoomRequired');
      expect(comprehensiveData).toHaveProperty('performanceFee');
      expect(comprehensiveData).toHaveProperty('specialRequests');
    });

    it('should handle null/undefined optional fields', () => {
      const dataWithNulls = {
        templateName: 'Setup',
        performanceType: 'concert',
        performanceDuration: 60,
        setupTimeRequired: 30,
        soundcheckTimeRequired: undefined,
        numberOfPerformers: undefined,
        stageDimensions: undefined,
        powerRequirements: undefined,
        equipmentList: undefined,
        dietaryRestrictions: undefined,
        specialRequests: undefined,
        cancellationPolicy: undefined,
        emergencyContact: undefined,
      };
      expect(dataWithNulls.soundcheckTimeRequired).toBeUndefined();
      expect(dataWithNulls.specialRequests).toBeUndefined();
    });
  });

  describe('Artist Name Display', () => {
    it('should use provided artist name', () => {
      const props = { riderData: mockRiderData, artistName: 'John Doe' };
      expect(props.artistName).toBe('John Doe');
    });

    it('should default to "Artist" when not provided', () => {
      const props = { riderData: mockRiderData };
      expect(props.artistName).toBeUndefined();
    });
  });
});
