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


io2.on('connection', (socket) => {
  console.log('Client connected');

  let cricketScoreInterval;
  let generalScoreInterval;
  let oddsInterval;
  let sessionDataInterval;

  // Listen for the "startFetchingCricketScore" event from the client
  socket.on('startFetchingCricketScore', (matchId) => {
    console.log(`Client wants to fetch cricket score for MatchID: ${matchId}`);
    // Set up an interval to fetch and emit cricket score data every 3 seconds
    cricketScoreInterval = setInterval(async () => {
      try {
        const url = `https://nikhilm.xyz/bettingapi/score_v1.php?Action=score&match_id=${matchId}`;
        const response = await axios.post('http://35.154.231.183:8080/putapi', { url });
        
        if (!response.data.res) {
          socket.emit('cricketScoreData', []); // Send an empty array to indicate no data
          clearInterval(cricketScoreInterval);
          return;
        }

        // Emit the fetched cricket score data to the client
        socket.emit('cricketScoreData', response.data.res || []);
      } catch (error) {
        console.error('Error fetching cricket score data:', error);
      }
    }, 3000);
  });

  // Listen for the "startFetchingScore" event from the client
  socket.on('startFetchingScore', (matchId) => {
    console.log(`Client wants to fetch general score for MatchID: ${matchId}`);
    // Set up an interval to fetch and emit general score data every 3 seconds
    generalScoreInterval = setInterval(async () => {
      try {
        const url = `https://nikhilm.xyz/bettingapi/score_v1.php?Action=all_event_score&match_id=${matchId}`;
        const response = await axios.post('http://35.154.231.183:8080/putapi', { url });

        if (!response.data.res) {
          socket.emit('scoreData', []); // Send an empty array to indicate no data
          clearInterval(generalScoreInterval);
          return;
        }

        // Emit the fetched general score data to the client
        socket.emit('scoreData', response.data.res || []);
      } catch (error) {
        console.error('Error fetching general score data:', error);
      }
    }, 3000);
  });


  socket.on('startFetchingSession', (matchId) => {
    console.log(`Client wants to fetch general score for MatchID: ${matchId}`);
    // Set up an interval to fetch and emit general score data every 3 seconds
    sessionDataInterval = setInterval(async () => {
      try {
        const url = `https://nikhilm.xyz/bettingapi/match_odds_v1.php?Action=listMarketBookSession&match_id=${matchId}`;
        const response = await axios.post('http://35.154.231.183:8080/putapi', { url });

        if (!response.data.res) {
          socket.emit('sessionData', []); // Send an empty array to indicate no data
          clearInterval(sessionDataInterval);
          return;
        }

        // Emit the fetched general score data to the client
        socket.emit('sessionData', response.data.res || []);
      } catch (error) {
        console.error('Error fetching session data:', error);
      }
    }, 3000);
  });



  // Listen for the "startFetching" event from the client
  socket.on("startFetching", (eventID) => {
    console.log(`Client wants to fetch data for EventID: ${eventID}`);
    // Set up an interval to fetch and emit data every second
    oddsInterval = setInterval(async () => {
      try {
        const url = `https://nikhilm.xyz/bettingapi/match_odds_v1.php?Action=listMarketTypes&EventID=${eventID}`;
        const response = await axios.post("http://35.154.231.183:8080/putapi", {
          url,
        });
        const marketId = response?.data?.res[0]?.marketId;
        
        if (!marketId) {
          socket.emit("oddsData", []); // Send an empty array to indicate no data
          clearInterval(oddsInterval);
          return;
        }

        const url1 = `https://nikhilm.xyz/bettingapi/match_odds_v1.php?Action=listMarketBookOdds&MarketID=${marketId}`;
        const response1 = await axios.post(
          "http://35.154.231.183:8080/putapi",
          {
            url: url1,
          }
        );

        // Emit the fetched data to the client
        socket.emit("oddsData", response1.data.res || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }, 1800);

  });

  // Listen for the "stopFetching" event from the client


  // Listen for the "stopFetching" event from the client for both cricket score and general score
  socket.on('stopFetching', () => {
    console.log('Client requested to stop fetching data');
    // Clear the intervals when the client disconnects or requests to stop
    clearInterval(cricketScoreInterval);
    clearInterval(generalScoreInterval);
    clearInterval(oddsInterval);
    clearInterval(sessionDataInterval);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Clear the intervals when the client disconnects
    clearInterval(cricketScoreInterval);
    clearInterval(generalScoreInterval);
    clearInterval(oddsInterval)
    clearInterval(sessionDataInterval);
  });
});



// io.on("connection", (socket) => {
//   console.log("Client connected");



//   // Handle disconnection
//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//     // Clear the interval when the client disconnects
//     clearInterval(interval);
//   });
// });



