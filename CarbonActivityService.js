const CarbonActivity = require('../../core/entities/CarbonActivity');

/**
 * Service class for carbon activity operations
 * Part of the application layer in Clean Architecture
 */
class CarbonActivityService {
  /**
   * Constructor with dependency injection
   * @param {Object} carbonActivityRepository - Repository for CarbonActivity persistence
   * @param {Object} emissionFactorsRepository - Repository for emission factors
   * @param {Object} userRepository - Repository for user data
   */
  constructor(carbonActivityRepository, emissionFactorsRepository, userRepository) {
    this.carbonActivityRepository = carbonActivityRepository;
    this.emissionFactorsRepository = emissionFactorsRepository;
    this.userRepository = userRepository;
  }

  /**
   * Creates a new carbon activity and calculates its emission
   * @param {Object} activityData - Activity information
   * @returns {Promise<CarbonActivity>} - Created activity with calculated emission
   */
  async createActivity(activityData) {
    try {
      // Validate user exists
      const userExists = await this.userRepository.exists(activityData.userId);
      if (!userExists) {
        throw new Error('User does not exist');
      }
      
      // Get emission factors
      const emissionFactors = await this.emissionFactorsRepository.getEmissionFactors();
      
      // Create activity entity
      const activity = new CarbonActivity(
        null, // ID will be generated on save
        activityData.userId,
        activityData.type,
        activityData.value,
        activityData.unit,
        activityData.date || new Date()
      );
      
      // Validate activity data
      if (!activity.isValid()) {
        throw new Error('Invalid activity data');
      }
      
      // Calculate emission
      activity.calculateEmission(emissionFactors);
      
      // Save to repository
      const savedActivity = await this.carbonActivityRepository.save(activity);
      
      // Log for audit purposes
      console.log(`Activity created: ${savedActivity.id}, Emission: ${savedActivity.carbonEmission} kg CO2`);
      
      return savedActivity;
    } catch (error) {
      console.error(`Error creating activity: ${error.message}`);
      throw new Error(`Activity creation error: ${error.message}`);
    }
  }

  /**
   * Gets user's carbon footprint for a specific date range
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date of the range
   * @param {Date} endDate - End date of the range
   * @returns {Promise<Object>} - Carbon footprint summary
   */
  async getUserFootprint(userId, startDate, endDate) {
    try {
      const activities = await this.carbonActivityRepository.findByUserAndDateRange(
        userId,
        startDate,
        endDate
      );
      
      // Calculate total emissions
      let totalEmission = 0;
      const byCategory = {
        transportation: 0,
        energy: 0,
        food: 0,
        consumption: 0
      };
      
      activities.forEach(activity => {
        totalEmission += activity.carbonEmission;
        byCategory[activity.type] += activity.carbonEmission;
      });
      
      // Get average emissions for comparison
      const averageEmissions = await this.emissionFactorsRepository.getAverageEmissions();
      
      return {
        userId,
        period: { startDate, endDate },
        totalEmission,
        byCategory,
        comparison: {
          difference: totalEmission - averageEmissions.total,
          percentageDiff: ((totalEmission - averageEmissions.total) / averageEmissions.total) * 100,
          isBetterThanAverage: totalEmission < averageEmissions.total
        }
      };
    } catch (error) {
      console.error(`Error getting user footprint: ${error.message}`);
      throw new Error(`Footprint calculation error: ${error.message}`);
    }
  }
}

module.exports = CarbonActivityService;