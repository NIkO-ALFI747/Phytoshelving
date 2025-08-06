const { getWorker } = require("../utils/workerManager");

class SurveyController {
  async triggerSurvey(req, res) {
    try {
      const worker = getWorker();
      const taskId = Date.now();

      worker.send({ task: "createSurvey", taskId, data: {} });

      return res.status(202).json({
        message: "Survey task started in background.",
        taskId,
      });
    } catch (e) {
      console.error("Error triggering survey:", e);
      return res.status(500).json({ error: "Could not start survey task." });
    }
  }
  
  async triggerSurvey() {
    try {
      const worker = getWorker();
      const taskId = Date.now();

      worker.send({ task: "createSurvey", taskId, data: {} });

      return {
        message: "Survey task started in background.",
        taskId,
      };
    } catch (e) {
      console.error("Error triggering survey:", e);
      return { error: "Could not start survey task." };
    }
  }
}

module.exports = new SurveyController();
