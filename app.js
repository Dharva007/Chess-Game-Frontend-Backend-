// Chessgame.js Backend


const express = require('express');
const socket = require('socket.io');
const http = require('http');
const path = require('path');
// Chess.js import
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {}; 
// { white: socketId, black: socketId }

// set view engine
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.get('/', (req, res) => {
  res.render("index", { title: "Chess Game" });
});

// socket.io
io.on('connection', (uniquesocket) => {
  console.log("✅ User connected:", uniquesocket.id);

  // assign player 
  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerColor", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerColor", "b");
  } else {
    uniquesocket.emit("spectatorRole");
  }

  // send current board state & turn to new user
  uniquesocket.emit("boardState", chess.fen());
  uniquesocket.emit("turn", chess.turn());

  // disconnect handling
  uniquesocket.on('disconnect', () => {
    console.log("❌ User disconnected:", uniquesocket.id);
    if (uniquesocket.id === players.white) delete players.white;
    if (uniquesocket.id === players.black) delete players.black;
  });

  // move handling
  uniquesocket.on('move', (move) => {
    try {
      // check turn and correct player
      if (chess.turn() === 'w' && uniquesocket.id !== players.white) {
        uniquesocket.emit("invalidMove", { reason: "Not White's turn!" });
        return;
      }
      if (chess.turn() === 'b' && uniquesocket.id !== players.black) {
        uniquesocket.emit("invalidMove", { reason: "Not Black's turn!" });
        return;
      }

      const result = chess.move(move);
      if (result) {
        // broadcast valid move + new state
        io.emit('move', result);
        io.emit('boardState', chess.fen());
        io.emit("turn", chess.turn()); // update turn
      } else {
        uniquesocket.emit("invalidMove", { reason: "Illegal move!" });
      }
    } catch (error) {
      console.error("❌ Error processing move:", error);
      uniquesocket.emit("invalidMove", { reason: "Server error" });
    }
  });
});

server.listen(3000, () => {
  console.log('✅ Server running on http://localhost:3000');
});
