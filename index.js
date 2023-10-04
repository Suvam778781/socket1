const express = require("express");
const cors = require("cors");
const http = require("http"); // Import the 'http' module
const socketIo = require("socket.io"); // Import 'socket.io'
const { default: axios } = require("axios");

const server = express();

const httpServer2 = http.createServer(server);


const io2 = socketIo(httpServer2, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
}); // Initialize socket.io with the HTTP server



// Middleware for parsing JSON requests
server.use(express.json());
server.use(cors());

// Define a route for /api/home
server.get("/api/home", async (req, res) => {
  res.status(200).json({
    status: 200,
    success: true,
    data: null,
    message: "Welcome to the home API!",
  });
});

server.all("*", (req, res) => {
  res.status(404).json({
    status: 404,
    success: false,
    data: null,
    message: "Route not found.",
  });
});

// Error handler middleware
server.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});



httpServer2.listen(8091, async (err) => {
  if (err) {
    console.log("Error starting the second server:", err);
  } else {
    console.log("Second server listening on port 8091");
  }
});




io2.on("connection", (socket) => {
  console.log("Client connected1");
  let interval;
  // Listen for the "startFetching" event from the client
  socket.on("startFetchingScore", (matchId) => {
    console.log(`Client wants to fetch data for EventID: ${matchId}`);
    // Set up an interval to fetch and emit data every second
    interval = setInterval(async () => {
      try {
        const url1 = `https://nikhilm.xyz/bettingapi/score_v1.php?Action=all_event_score&match_id=${matchId}`;
        const response1 = await axios.post(
          "http://35.154.231.183:8080/putapi",
          {
            url: url1,
          }
        );

        // console.log(response1.data.res);
        if (!response1) {
          socket.emit("scoreData", []); // Send an empty array to indicate no data
          clearInterval(interval);
          return;
        }
        // Emit the fetched data to the client
        socket.emit("scoreData", response1.data.res || []);
      } catch (error) {
        console.error("Error fetching bookmaker data:", error);
      }
    }, 3000);
  });

  // Listen for the "stopFetching" event from the client
  socket.on("stopFetchingScore", () => {
    console.log("Client requested to stop fetching bookmaker data");
    // Clear the interval when the client disconnects or requests to stop
    clearInterval(interval);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected1");
    // Clear the interval when the client disconnects
    clearInterval(interval);
  });
});



