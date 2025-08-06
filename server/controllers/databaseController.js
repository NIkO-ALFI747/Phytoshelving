const models = require("../models/models"); // This imports all defined Sequelize models
const sequelize = require("../db");
const { sequelize_models } = models; // Get Sequelize instance
const fs = require("fs");
const path = require("path");

class DatabaseController {
  // Deletes all data from all tables
  async deleteAllData(req, res) {
    const transaction = await sequelize_models.transaction();
    try {
      // Disable FK constraints temporarily (works in Postgres, MySQL)
      await sequelize_models.query("SET FOREIGN_KEY_CHECKS = 0", { transaction }).catch(() => {});
      await sequelize_models.query("PRAGMA foreign_keys = OFF", { transaction }).catch(() => {});

      // Loop through all models and truncate (delete all data)
      const modelKeys = Object.keys(models).filter(
        (key) => typeof models[key].destroy === "function"
      );

      for (const modelName of modelKeys) {
        const model = models[modelName];
        await model.destroy({ where: {}, truncate: true, cascade: true, force: true, transaction });
      }

      // Re-enable FK constraints
      await sequelize_models.query("SET FOREIGN_KEY_CHECKS = 1", { transaction }).catch(() => {});
      await sequelize_models.query("PRAGMA foreign_keys = ON", { transaction }).catch(() => {});

      await transaction.commit();
      return res.status(200).json({ message: "All data deleted successfully." });
    } catch (error) {
      await transaction.rollback();
      console.error("Error deleting data:", error);
      return res.status(500).json({ error: "Failed to delete all data", details: error.message });
    }
  }

  async fillInitialData(req, res) {
    try {
      const filePath = path.resolve(__dirname, "../data_inserts.txt");
      const sql = fs.readFileSync(filePath, "utf8");

      if (!sql.trim()) {
        return res.status(400).json({ message: "SQL file is empty" });
      }

      await sequelize.query(sql);
      return res.status(200).json({ message: "Initial data inserted successfully." });
    } catch (error) {
      console.error("Error inserting initial data:", error);
      return res.status(500).json({ error: "Failed to insert initial data", details: error.message });
    }
  }

}

module.exports = new DatabaseController();
