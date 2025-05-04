const CarbonActivity = require('../src/core/entities/CarbonActivity');

describe('CarbonActivity Entity', () => {
  // Setup common test data
  const validActivity = {
    id: '1',
    userId: 'user123',
    type: 'transportation',
    value: 100,
    unit: 'km',
    date: new Date('2023-01-01')
  };
  
  const emissionFactors = {
    transportation: {
      km: 0.2,
      mile: 0.32
    },
    energy: {
      kwh: 0.5
    },
    food: {
      kg: 1.2
    }
  };

  test('should create a valid CarbonActivity', () => {
    const activity = new CarbonActivity(
      validActivity.id,
      validActivity.userId,
      validActivity.type,
      validActivity.value,
      validActivity.unit,
      validActivity.date
    );
    
    expect(activity.id).toBe(validActivity.id);
    expect(activity.userId).toBe(validActivity.userId);
    expect(activity.type).toBe(validActivity.type);
    expect(activity.value).toBe(validActivity.value);
    expect(activity.unit).toBe(validActivity.unit);
    expect(activity.date).toBe(validActivity.date);
    expect(activity.carbonEmission).toBeNull();
  });

  test('should calculate carbon emission correctly', () => {
    const activity = new CarbonActivity(
      validActivity.id,
      validActivity.userId,
      validActivity.type,
      validActivity.value,
      validActivity.unit
    );
    
    const emission = activity.calculateEmission(emissionFactors);
    
    expect(emission).toBe(20); // 100 km * 0.2 kg CO2/km = 20 kg CO2
    expect(activity.carbonEmission).toBe(20);
  });

  test('should throw error when emission factor not found', () => {
    const activity = new CarbonActivity(
      validActivity.id,
      validActivity.userId,
      'unknown-type',
      validActivity.value,
      validActivity.unit
    );
    
    expect(() => {
      activity.calculateEmission(emissionFactors);
    }).toThrow('Emission factor for unknown-type not found');
  });

  test('should validate correct activity data', () => {
    const activity = new CarbonActivity(
      validActivity.id,
      validActivity.userId,
      validActivity.type,
      validActivity.value,
      validActivity.unit
    );
    
    expect(activity.isValid()).toBe(true);
  });

  test('should invalidate activity with wrong type', () => {
    const activity = new CarbonActivity(
      validActivity.id,
      validActivity.userId,
      'invalid-type',
      validActivity.value,
      validActivity.unit
    );
    
    expect(activity.isValid()).toBe(false);
  });

  test('should invalidate activity with negative value', () => {
    const activity = new CarbonActivity(
      validActivity.id,
      validActivity.userId,
      validActivity.type,
      -10,
      validActivity.unit
    );
    
    expect(activity.isValid()).toBe(false);
  });

  test('should compare to average correctly', () => {
    const activity = new CarbonActivity(
      validActivity.id,
      validActivity.userId,
      validActivity.type,
      validActivity.value,
      validActivity.unit
    );
    
    // Calculate emission first
    activity.calculateEmission(emissionFactors);
    
    const averageEmissions = {
      transportation: 25 // Average is 25 kg CO2
    };
    
    const comparison = activity.compareToAverage(averageEmissions);
    
    expect(comparison.difference).toBe(-5); // 20 - 25 = -5
    expect(comparison.percentageDiff).toBe(-20); // -5/25 * 100 = -20%
    expect(comparison.isBetterThanAverage).toBe(true);
  });
});