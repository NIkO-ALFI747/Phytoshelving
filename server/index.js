require("dotenv").config();
const express = require("express");
const sequelize = require("./db");
const models = require("./models/models");
const cors = require("cors");
const router = require("./routes/index");
const fs = require("fs");
const bodyParser = require("body-parser");

const {
  setSocketIO,
  startWorker,
  getWorker,
} = require("./utils/workerManager");

require.extensions[".txt"] = function (module, filename) {
  module.exports = fs.readFileSync(filename, "utf8");
};
const data = require("./data_inserts.txt");

const PORT = process.env.PORT || 8080;
const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/api", router);
app.use(express.json());

const http = require("http");
const surveyController = require("./controllers/surveyController");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const start = () => {
  server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
  });
};

const initDatabase = async () => {
  try {
    console.log("Primary process: Initializing database...");
    // Authenticate and synchronize models (create tables)
    // {force: true} will drop existing tables and recreate them.
    // This is ideal for development to start with a clean slate.
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
    console.log("Primary process: Database tables created successfully.");

    // Insert initial data from data_inserts.txt
    // await sequelize.query(data);
    // console.log("Primary process: Initial data inserted successfully.");

    io.on("connection", (socket) => {
      console.log("user connected");

      socket.on("disconnect", () => {
        console.log("user disconnected");
      });

      socket.on("message", (message) => {
        console.log("Received message from client:", message);
        // You can forward to workers here if needed
      });
    });

    setSocketIO(io);

    const worker = startWorker(); // Start your worker

    const surveyController = require("./controllers/surveyController");

    surveyController.triggerSurvey();

    // Gracefully shut down worker on process exit
    function shutdown() {
      const worker = getWorker();
      if (worker && !worker.killed) {
        console.log("Shutting down worker...");
        worker.kill("SIGTERM");
      }
    }

    // Handle various exit signals
    process.on("exit", shutdown); // When process is exiting
    process.on("SIGINT", () => {
      // e.g. Ctrl+C
      console.log("Received SIGINT");
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      // e.g. kill command
      console.log("Received SIGTERM");
      process.exit(0);
    });
    process.on("uncaughtException", (err) => {
      // Safety net
      console.error("Uncaught exception:", err);
      process.exit(1);
    });

    start();
  } catch (e) {
    console.error("Primary process: Error during database initialization:", e);
    // Exit if initialization fails
    process.exit(1);
  }
};

initDatabase();
