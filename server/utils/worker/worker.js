const rangeController = require("../../controllers/rangeController");

console.log(`Worker ${process.pid} started`);

let isRunning = false;

process.on("message", (msg) => {
  const { task, taskId } = msg;
  if (task === "createSurvey") {
    if (isRunning) {
      console.log("Worker: Survey task already running, ignoring duplicate.");
      return;
    }
    console.log(`Worker ${process.pid}: Starting survey task ${taskId}`);
    isRunning = true;
    try {
      rangeController.createSurvey();
      console.log(`Worker ${process.pid}: Task ${taskId} complete.`);
    } catch (e) {
      console.error(`Worker ${process.pid}: Task ${taskId} failed:`, e);
    } finally {
      isRunning = false;
    }
  }
});
