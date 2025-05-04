const CarbonActivityModel = require('../database/models/CarbonActivityModel');
const CarbonActivity = require('../../core/entities/CarbonActivity');

/**
 * Repository for CarbonActivity persistence
 * Part of the infrastructure layer in Clean Architecture
 */
class CarbonActivityRepository {
  /**
   * Saves a carbon activity to the database
   * @param {CarbonActivity} carbonActivity - Activity to save
   * @returns {Promise<CarbonActivity>} - Saved activity with generated ID
   */
  async save(carbonActivity) {
    try {
      // Create model from entity
      const model = new CarbonActivityModel({
        userId: carbonActivity.userId,
        type: carbonActivity.type,
        value: carbonActivity.value,
        unit: carbonActivity.unit,
        date: carbonActivity.date,
        carbonEmission: carbonActivity.carbonEmission
      });
      
      // Save to database
      const savedModel = await model.save();
      
      // Return entity with generated ID
      return new CarbonActivity(
        savedModel._id.toString(),
        savedModel.userId.toString(),
        savedModel.type,
        savedModel.value,
        savedModel.unit,
        savedModel.date,
        savedModel.carbonEmission
      );
    } catch (error) {
      console.error(`Database error while saving activity: ${error.message}`);
      throw new Error(`Activity save error: ${error.message}`);
    }
  }

  /**
   * Finds activities by user and date range
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date of the range (optional)
   * @param {Date} endDate - End date of the range (optional)
   * @returns {Promise<Array<CarbonActivity>>} - List of matching activities
   */
  async findByUserAndDateRange(userId, startDate, endDate) {
    try {
      const query = { userId };
      
      // Add date range conditions if provided
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }
      
      // Execute query
      const models = await CarbonActivityModel.find(query).sort({ date: -1 });
      
      // Map to domain entities
      return models.map(model => new CarbonActivity(
        model._id.toString(),
        model.userId.toString(),
        model.type,
        model.value,
        model.unit,
        model.date,
        model.carbonEmission
      ));
    } catch (error) {
      console.error(`Database error while finding activities: ${error.message}`);
      throw new Error(`Activity query error: ${error.message}`);
    }
  }

  /**
   * Gets user's activity statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Activity statistics
   */
  async getUserStats(userId) {
    try {
      const stats = await CarbonActivityModel.aggregate([
        { $match: { userId } },
        { $group: {
            _id: "$type",
            count: { $sum: 1 },
            totalEmission: { $sum: "$carbonEmission" },
            avgEmission: { $avg: "$carbonEmission" }
          }
        }
      ]);
      
      const result = {};
      stats.forEach(stat => {
        result[stat._id] = {
          count: stat.count,
          totalEmission: stat.totalEmission,
          avgEmission: stat.avgEmission
        };
      });
      
      return result;
    } catch (error) {
      console.error(`Database error while getting stats: ${error.message}`);
      throw new Error(`Stats calculation error: ${error.message}`);
    }
  }
}

module.exports = CarbonActivityRepository;