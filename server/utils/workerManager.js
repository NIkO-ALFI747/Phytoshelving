// workerManager.js
const { fork } = require("child_process");
const path = require("path");

let ioInstance = null;
let worker = null;

function setSocketIO(io) {
  ioInstance = io;
}

function startWorker() {
  if (worker && isWorkerAlive(worker)) {
    console.log("Worker is already running");
    return worker;
  }

  worker = fork(path.join(__dirname, "worker", "worker.js"));

  worker.on("message", (msg) => {
    console.log("Main received from worker:", msg);

    if (ioInstance) {
      ioInstance.emit("message", msg);
    }
  });

  worker.on("exit", (code) => {
    console.log(`Worker exited with code ${code}`);
    worker = null; // Mark as dead
  });

  worker.on("error", (err) => {
    console.error("Worker error:", err);
    worker = null;
  });

  return worker;
}

function getWorker() {
  if (worker && isWorkerAlive(worker)) {
    return worker;
  }
  throw new Error("Worker not alive.");
}

function isWorkerAlive(worker) {
  return worker && !worker.killed && worker.connected;
}

module.exports = {
  setSocketIO,
  startWorker,
  getWorker,
};
