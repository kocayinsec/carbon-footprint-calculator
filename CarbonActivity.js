/**
 * CarbonActivity represents a user activity that generates carbon emissions
 * This entity is part of the core domain layer in our Clean Architecture
 */
class CarbonActivity {
  constructor(id, userId, type, value, unit, date = new Date()) {
    this.id = id;
    this.userId = userId;
    this.type = type; // 'transportation', 'energy', 'food', 'consumption'
    this.value = value;
    this.unit = unit;
    this.date = date;
    this.carbonEmission = null;
  }

  /**
   * Calculates carbon emission based on activity details and emission factors
   * @param {Object} emissionFactors - Emission factors for different activity types
   * @returns {number} - Calculated carbon emission in kg CO2
   */
  calculateEmission(emissionFactors) {
    if (!emissionFactors || !emissionFactors[this.type]) {
      throw new Error(`Emission factor for ${this.type} not found`);
    }
    
    const factor = emissionFactors[this.type][this.unit];
    if (!factor) {
      throw new Error(`Emission factor for ${this.type}/${this.unit} not found`);
    }
    
    this.carbonEmission = this.value * factor;
    return this.carbonEmission;
  }

  /**
   * Compares this activity's emission with average emissions for this type
   * @param {Object} averageEmissions - Average emissions by activity type
   * @returns {Object} - Comparison result including percentage difference
   */
  compareToAverage(averageEmissions) {
    if (!this.carbonEmission || !averageEmissions || !averageEmissions[this.type]) {
      throw new Error('Cannot compare: missing data');
    }
    
    const avgEmission = averageEmissions[this.type];
    const difference = this.carbonEmission - avgEmission;
    const percentageDiff = (difference / avgEmission) * 100;
    
    return {
      difference,
      percentageDiff,
      isBetterThanAverage: difference < 0
    };
  }

  /**
   * Validates if the activity data is complete and correct
   * @returns {boolean} - True if valid, false otherwise
   */
  isValid() {
    const validTypes = ['transportation', 'energy', 'food', 'consumption'];
    return (
      this.userId &&
      validTypes.includes(this.type) &&
      typeof this.value === 'number' &&
      this.value > 0 &&
      this.unit &&
      this.date instanceof Date
    );
  }
}

module.exports = CarbonActivity;