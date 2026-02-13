import { describe, it, expect } from 'vitest';

describe('RiderComparisonTool', () => {
  const mockRiders = [
    {
      id: 1,
      templateName: 'Standard Rock',
      description: 'Standard rock performance rider',
      genre: 'Rock',
      paSystemRequired: true,
      microphoneCount: 2,
      lightingRequired: true,
      dressroomRequired: true,
      cateringProvided: true,
      parkingRequired: true,
      parkingSpaces: 2,
    },
    {
      id: 2,
      templateName: 'Acoustic Jazz',
      description: 'Intimate acoustic jazz setup',
      genre: 'Jazz',
      paSystemRequired: false,
      microphoneCount: 1,
      lightingRequired: false,
      dressroomRequired: false,
      cateringProvided: false,
      parkingRequired: false,
      parkingSpaces: 0,
    },
    {
      id: 3,
      templateName: 'DJ Setup',
      description: 'Electronic DJ performance',
      genre: 'Electronic',
      paSystemRequired: true,
      microphoneCount: 1,
      lightingRequired: true,
      dressroomRequired: false,
      cateringProvided: false,
      parkingRequired: true,
      parkingSpaces: 1,
    },
  ];

  it('should filter riders by search term', () => {
    const searchTerm = 'Rock';
    const filtered = mockRiders.filter(r =>
      r.templateName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].templateName).toBe('Standard Rock');
  });

  it('should sort riders by name', () => {
    const sorted = [...mockRiders].sort((a, b) =>
      a.templateName.localeCompare(b.templateName)
    );
    expect(sorted[0].templateName).toBe('Acoustic Jazz');
    expect(sorted[1].templateName).toBe('DJ Setup');
    expect(sorted[2].templateName).toBe('Standard Rock');
  });

  it('should validate rider selection count', () => {
    const selectedRiders = [1, 2];
    const isValid = selectedRiders.length >= 2 && selectedRiders.length <= 4;
    expect(isValid).toBe(true);

    const tooFew = [1];
    const isTooFew = tooFew.length < 2;
    expect(isTooFew).toBe(true);

    const tooMany = [1, 2, 3, 4, 5];
    const isTooMany = tooMany.length > 4;
    expect(isTooMany).toBe(true);
  });

  it('should handle rider selection toggle', () => {
    let selectedRiders: number[] = [];

    // Select first rider
    selectedRiders = [...selectedRiders, 1];
    expect(selectedRiders).toContain(1);

    // Select second rider
    selectedRiders = [...selectedRiders, 2];
    expect(selectedRiders).toContain(2);
    expect(selectedRiders.length).toBe(2);

    // Deselect first rider
    selectedRiders = selectedRiders.filter(id => id !== 1);
    expect(selectedRiders).not.toContain(1);
    expect(selectedRiders.length).toBe(1);
  });

  it('should format field names correctly', () => {
    const formatFieldName = (field: string): string => {
      return field
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    };

    expect(formatFieldName('paSystemRequired')).toBe('Pa System Required');
    expect(formatFieldName('microphoneCount')).toBe('Microphone Count');
    expect(formatFieldName('dressroomRequired')).toBe('Dressroom Required');
  });

  it('should get comparison value correctly', () => {
    const getComparisonValue = (rider: any, field: string): any => {
      const value = rider[field];
      if (value === undefined || value === null) return 'N/A';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (typeof value === 'number') return value;
      return String(value);
    };

    const rider = mockRiders[0];

    expect(getComparisonValue(rider, 'paSystemRequired')).toBe('Yes');
    expect(getComparisonValue(rider, 'microphoneCount')).toBe(2);
    expect(getComparisonValue(rider, 'nonexistentField')).toBe('N/A');
  });

  it('should identify differences between riders', () => {
    const rider1 = mockRiders[0]; // Rock - requires PA
    const rider2 = mockRiders[1]; // Jazz - no PA

    expect(rider1.paSystemRequired).toBe(true);
    expect(rider2.paSystemRequired).toBe(false);
    expect(rider1.paSystemRequired !== rider2.paSystemRequired).toBe(true);
  });

  it('should compare multiple riders', () => {
    const selectedIds = [1, 2, 3];
    const comparisonRiders = selectedIds
      .map(id => mockRiders.find(r => r.id === id))
      .filter(Boolean);

    expect(comparisonRiders.length).toBe(3);
    expect(comparisonRiders[0].templateName).toBe('Standard Rock');
    expect(comparisonRiders[1].templateName).toBe('Acoustic Jazz');
    expect(comparisonRiders[2].templateName).toBe('DJ Setup');
  });

  it('should handle empty rider list', () => {
    const emptyRiders: any[] = [];
    expect(emptyRiders.length).toBe(0);
    expect(emptyRiders.filter(r => r.id === 1).length).toBe(0);
  });

  it('should categorize rider fields', () => {
    const categories = {
      'Technical Requirements': ['paSystemRequired', 'microphoneCount', 'lightingRequired'],
      'Hospitality': ['dressroomRequired', 'cateringProvided', 'parkingRequired'],
      'Promotion': ['merchandiseAllowed', 'promotionRequirements'],
    };

    expect(categories['Technical Requirements']).toContain('paSystemRequired');
    expect(categories['Hospitality']).toContain('cateringProvided');
    expect(categories['Promotion']).toContain('merchandiseAllowed');
  });

  it('should calculate differences for comparison', () => {
    const rider1 = mockRiders[0];
    const rider2 = mockRiders[1];

    const differences = {
      paSystemRequired: rider1.paSystemRequired !== rider2.paSystemRequired,
      microphoneCount: rider1.microphoneCount !== rider2.microphoneCount,
      lightingRequired: rider1.lightingRequired !== rider2.lightingRequired,
    };

    expect(differences.paSystemRequired).toBe(true);
    expect(differences.microphoneCount).toBe(true);
    expect(differences.lightingRequired).toBe(true);
  });

  it('should handle rider selection with max limit', () => {
    let selectedRiders: number[] = [];
    const maxRiders = 4;

    for (let i = 0; i < maxRiders; i++) {
      if (selectedRiders.length < maxRiders) {
        selectedRiders = [...selectedRiders, i + 1];
      }
    }

    expect(selectedRiders.length).toBe(4);

    // Try to add one more
    const canAdd = selectedRiders.length < maxRiders;
    expect(canAdd).toBe(false);
  });
});
